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

  // Track last processed Sheets row to detect new entries
  private lastSheetRowIndex = -1;

  // BigQuery data refreshed hourly
  private bigQueryMessages: BannerMessage[] = [];

  private bigquery: BigQuery;
  private sheetsAuth: any;

  constructor(
    private config: ConfigService,
    private events: EventsGateway,
  ) {
    const credPath = this.config.get('GOOGLE_APPLICATION_CREDENTIALS') || './service-account.json';
    this.bigquery = new BigQuery({ keyFilename: credPath });
    this.sheetsAuth = new google.auth.GoogleAuth({
      keyFile: credPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
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
      // Columns: A=csat_inquiry_id, B=inquiry_type, C=admin_nickname, D=url, E=comment
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "'배달된 우수 코멘트 적재'!A:E",
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return; // header only

      const dataRows = rows.slice(1); // skip header
      const newRows = dataRows.slice(this.lastSheetRowIndex + 1);

      if (newRows.length === 0) return;

      this.logger.log(`[Sheets] Found ${newRows.length} new comment rows`);
      this.lastSheetRowIndex = dataRows.length - 1;

      const newMessages: BannerMessage[] = newRows
        .reverse() // newest last → newest first
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

      // Prepend new Sheets messages to the front of the queue
      this.messageQueue = [
        ...newMessages,
        ...this.messageQueue.filter((m) => m.priority !== 1),
      ];
      this.currentIndex = 0;
      this.logger.log(`[Sheets] Added ${newMessages.length} new messages to queue`);
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

      // csat_raw_staging: rate=5, comment non-null, today's records
      const query = `
        SELECT admin_nickname, comment, DATE(created_at_kst) as date
        FROM \`${projectId}.${datasetId}.csat_raw_staging\`
        WHERE rate = 5
          AND admin_nickname IS NOT NULL
          AND comment IS NOT NULL
          AND DATE(created_at_kst) = CURRENT_DATE('Asia/Seoul')
        ORDER BY created_at_kst DESC
        LIMIT 50
      `;

      const [rows] = await this.bigquery.query({ query, location: 'US' });

      this.bigQueryMessages = rows
        .filter((row: any) => row.admin_nickname)
        .map((row: any) => {
          const name = row.admin_nickname;
          const comment = (row.comment || '').trim().replace(/\n/g, ' ').substring(0, 80);
          return {
            type: 'five_star' as const,
            agentName: name,
            text: comment
              ? `${name}에게 도착한 별점 5점과 따뜻한 한마디: "${comment}" 🌟`
              : `${name}, 별점 5점 만점! 오늘도 멋지게 해냈네요! 🎉`,
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
    const sheetMessages = this.messageQueue.filter((m) => m.priority === 1);
    const cheerMessages: BannerMessage[] = [...CHEER_MESSAGES];

    // Priority 1 first, then BigQuery P2, then cheer P3
    // Interleave P2 and P3 if P1 is empty
    const combined: BannerMessage[] = [
      ...sheetMessages,
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
