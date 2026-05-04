import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { google } from 'googleapis';
import { BigQuery } from '@google-cloud/bigquery';
import { EventsGateway } from '../events/events.gateway';
import { BannerMessage, CHEER_MESSAGES } from './banner.types';

@Injectable()
export class CsatBannerService implements OnModuleInit {
  private readonly logger = new Logger(CsatBannerService.name);

  // Priority-queued message list for rolling banner
  private messageQueue: BannerMessage[] = [];
  private currentIndex = 0;

  // Sheets data refreshed every 30s
  private sheetMessages: BannerMessage[] = [];

  // BigQuery data refreshed hourly
  private bigQueryMessages: BannerMessage[] = [];

  private bigquery: BigQuery;
  private sheetsAuth: any;

  constructor(
    private config: ConfigService,
    private events: EventsGateway,
  ) {
    const credPath = this.config.get('GOOGLE_APPLICATION_CREDENTIALS') || './service-account.json';
    try {
      const credentials = JSON.parse(require('fs').readFileSync(credPath, 'utf8'));
      this.bigquery = new BigQuery({ 
        projectId: credentials.project_id || 'data-proj-470202',
        keyFilename: credPath 
      });
      this.sheetsAuth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } catch (e) {
      this.logger.error(`Failed to load credentials: ${e.message}`);
      // Fallback
      this.bigquery = new BigQuery({ keyFilename: credPath });
      this.sheetsAuth = new google.auth.GoogleAuth({
        keyFile: credPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }
  }

  async onModuleInit() {
    await this.refreshBigQueryData();
    await this.checkGoogleSheets();
    this.buildQueue();
    this.startRollingBroadcast();
  }

  // ── Sheets: check for new excellent comments every 30s ─────
  @Cron('*/30 * * * * *')
  async checkGoogleSheets() {
    try {
      const sheetId = this.config.get('GOOGLE_SHEET_ID');
      if (!sheetId) return;

      const sheets = google.sheets({ version: 'v4', auth: this.sheetsAuth });

      // Actual tab: '배달된 우수 코멘트 적재'
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "'배달된 우수 코멘트 적재'!A:E",
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        if (this.sheetMessages.length > 0) {
          this.sheetMessages = [];
          this.buildQueue();
        }
        return;
      }

      const dataRows = rows.slice(1); // skip header
      // Take the last 100 rows (approx 1 week worth) and reverse to show newest first
      const recentRows = dataRows.slice(-100).reverse();

      const newMessages: BannerMessage[] = recentRows
        .filter((row: string[]) => row[4] && row[4].trim()) // col E = comment
        .map((row: string[]) => {
          const agentName = row[2] || '상담원'; // col C = admin_nickname
          const comment = (row[4] || '').trim().replace(/\n/g, ' ').substring(0, 100);
          return {
            type: 'excellent_comment' as const,
            agentName,
            comment,
            text: `${agentName}에게 도착한 별점 5점과 기분 좋은 한마디: "${comment}"`,
            priority: 1 as const,
          };
        });

      if (newMessages.length === 0) return;

      // Only rebuild queue if the sheet data has actually changed
      const isChanged = JSON.stringify(this.sheetMessages) !== JSON.stringify(newMessages);
      if (isChanged) {
        this.sheetMessages = newMessages;
        this.buildQueue();
        this.logger.log(`[Sheets] Updated ${newMessages.length} messages for the rolling cycle`);
      }
    } catch (err: any) {
      this.logger.warn(`[Sheets] Fetch failed: ${err.message}`);
    }
  }

  // ── BigQuery: refresh 5-star list every hour ────────────────
  @Cron(CronExpression.EVERY_HOUR)
  async refreshBigQueryData() {
    try {
      const projectId = this.config.get('BIGQUERY_PROJECT_ID') || 'data-proj-470202';
      const datasetId = this.config.get('BIGQUERY_DATASET_ID') || 'ds_growth_culture';

      // vw_high_csat_details: first_name, rate, created_at_kst
      const query = `
        SELECT first_name, rate, created_at_kst
        FROM \`${projectId}.${datasetId}.vw_high_csat_details\`
        WHERE rate = 5
          AND first_name IS NOT NULL
          AND DATE(created_at_kst) >= DATE_TRUNC(CURRENT_DATE('Asia/Seoul'), ISOWEEK)
        ORDER BY created_at_kst DESC
        LIMIT 50
      `;

      const [rows] = await this.bigquery.query({ query, location: 'US' });

      this.bigQueryMessages = rows.map((row: any) => {
        const name = row.first_name;
        const timeStr = new Date(row.created_at_kst).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return {
          type: 'five_star' as const,
          agentName: name,
          text: `${name}님 / 별점 ${row.rate}점 / ${timeStr} ✨`,
          priority: 2 as const,
        };
      });

      this.logger.log(`[BigQuery] Refreshed ${this.bigQueryMessages.length} 5-star records`);
      this.buildQueue();
    } catch (err: any) {
      this.logger.warn(`[BigQuery] Fetch failed: ${err.message}`);
    }
  }

  // ── Build unified priority queue ────────────────────────────
  buildQueue() {
    const cheerMessages: BannerMessage[] = [...CHEER_MESSAGES];

    // Priority 1 first, then BigQuery P2, then cheer P3
    const combined: BannerMessage[] = [
      ...this.sheetMessages,
      ...this.bigQueryMessages,
      ...cheerMessages,
    ];

    // If still empty, fall back to cheer only
    this.messageQueue = combined.length > 0 ? combined : cheerMessages;
    this.currentIndex = 0;
  }

  // ── Rolling broadcast every 10s ────────────────────────────
  startRollingBroadcast() {
    setInterval(() => {
      this.broadcastNext();
    }, 10000);
    // Broadcast immediately on start
    this.broadcastNext();
  }

  broadcastNext() {
    if (this.messageQueue.length === 0) {
      this.buildQueue();
    }

    const message = this.messageQueue[this.currentIndex % this.messageQueue.length];
    this.currentIndex = (this.currentIndex + 1) % this.messageQueue.length;

    this.events.broadcastBanner(message);
    this.logger.debug(`[Banner] Broadcasting: ${message.text.substring(0, 50)}...`);
  }

  getCurrentBanner(): BannerMessage {
    if (this.messageQueue.length === 0) this.buildQueue();
    return this.messageQueue[this.currentIndex % this.messageQueue.length];
  }
}
