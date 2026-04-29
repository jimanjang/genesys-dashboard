import { Injectable, Logger } from '@nestjs/common';
import { GenesysAuthService } from './genesys-auth.service';
import { AgentStatus, DashboardData, QueueMetric } from './genesys.types';
import axios from 'axios';

const RATE_LIMIT_DELAY = 2000;

@Injectable()
export class GenesysApiService {
  private readonly logger = new Logger(GenesysApiService.name);
  private isRateLimited = false;

  // Simple in-memory cache (5s TTL)
  private cache = new Map<string, { value: any; ts: number }>();
  private readonly CACHE_TTL = 5000;

  constructor(private auth: GenesysAuthService) {}

  private cached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private setCache(key: string, value: any) {
    this.cache.set(key, { value, ts: Date.now() });
  }

  async apiRequest<T = any>(method: string, path: string, data?: any): Promise<T> {
    if (this.isRateLimited) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY));
      this.isRateLimited = false;
    }

    const token = await this.auth.getAccessToken();
    const url = `${this.auth.getApiUrl().replace(/\/$/, '')}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    if (data) headers['Content-Type'] = 'application/json';

    try {
      const res = await axios({ method, url, headers, data, timeout: 10000 });
      return res.data as T;
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        if (status === 429) {
          this.isRateLimited = true;
          const retryAfter = Number(err.response.headers['retry-after'] || 2);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          return this.apiRequest(method, path, data);
        }
        if (status === 401) {
          this.auth.clearToken();
          return this.apiRequest(method, path, data);
        }
        throw new Error(`Genesys API error: ${status}`);
      }
      throw err;
    }
  }

  // ── Queue name resolution ─────────────────────────────────────
  async fetchAllQueueIds(): Promise<Record<string, string>> {
    const cached = this.cached<Record<string, string>>('all_queue_ids');
    if (cached) return cached;

    const result: Record<string, string> = {};
    let pageNumber = 1;
    const pageSize = 100;

    while (true) {
      const data = await this.apiRequest<any>(
        'GET',
        `/api/v2/routing/queues?pageSize=${pageSize}&pageNumber=${pageNumber}`,
      );
      if (!data.entities || data.entities.length === 0) break;
      for (const q of data.entities) {
        result[q.name] = q.id;
      }
      if (data.entities.length < pageSize) break;
      pageNumber++;
    }

    this.setCache('all_queue_ids', result);
    this.logger.log(`Fetched ${Object.keys(result).length} queues from Genesys`);
    return result;
  }

  // ── Queue Observations ────────────────────────────────────────
  async fetchQueueObservations(queueIds: string[]): Promise<any> {
    if (queueIds.length === 0) return { results: [] };
    const body = {
      filter: {
        type: 'or',
        predicates: queueIds.map((id) => ({
          type: 'dimension',
          dimension: 'queueId',
          operator: 'matches',
          value: id,
        })),
      },
      groupBy: ['queueId', 'mediaType'],
      metrics: ['oWaiting', 'oInteracting', 'oOnQueueUsers'],
      detailMetrics: ['oWaiting'],
    };
    return this.apiRequest('POST', '/api/v2/analytics/queues/observations/query', body);
  }

  // ── Daily Aggregates ──────────────────────────────────────────
  async fetchDailyAggregates(queueIds: string[]): Promise<any> {
    if (queueIds.length === 0) return { results: [] };
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const interval = `${start.toISOString()}/${end.toISOString()}`;

    const body = {
      interval,
      groupBy: ['queueId', 'mediaType'],
      filter: {
        type: 'or',
        predicates: queueIds.map((id) => ({
          type: 'dimension',
          dimension: 'queueId',
          operator: 'matches',
          value: id,
        })),
      },
      metrics: ['tAnswered', 'tAbandon', 'tHandle', 'nOffered', 'tWait'],
    };

    return this.apiRequest(
      'POST',
      '/api/v2/analytics/conversations/aggregates/query',
      body,
    );
  }

  // ── Agent Status ──────────────────────────────────────────────
  async fetchAgentsByTeam(teamFilter?: string): Promise<AgentStatus[]> {
    // Fetch users with presence + routing status
    let url = `/api/v2/users?pageSize=200&expand=presence,routingStatus`;
    if (teamFilter) {
      url += `&teamId=${encodeURIComponent(teamFilter)}`;
    }

    const data = await this.apiRequest<any>('GET', url);
    return this.transformAgents(data?.entities || []);
  }

  async fetchAgentsByUserIds(userIds: string[]): Promise<AgentStatus[]> {
    if (userIds.length === 0) return [];
    const ids = userIds.slice(0, 200).join(',');
    const data = await this.apiRequest<any>(
      'GET',
      `/api/v2/users?id=${ids}&expand=presence,routingStatus`,
    );
    return this.transformAgents(data?.entities || []);
  }

  async fetchQueueMembers(queueId: string): Promise<string[]> {
    const data = await this.apiRequest<any>(
      'GET',
      `/api/v2/routing/queues/${queueId}/users?pageSize=100`,
    );
    return (data?.entities || []).map((u: any) => u.id);
  }

  // ── Data Transformation ───────────────────────────────────────
  private formatDuration(ms: number): string {
    if (!ms || ms < 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  transformQueueData(
    obsData: any,
    queueIdToName: Record<string, string>,
    aggData: any,
    config?: any,
  ): QueueMetric[] {
    const queueMap = new Map<string, QueueMetric>();

    // Helper: Map queueId to the specific config for that queue
    const getQueueMediaConfig = (queueId: string): string[] | null => {
      if (!config?.queues) return null;
      const qName = queueIdToName[queueId];
      const entry = Object.values(config.queues).find((v: any) => v.queueName === qName);
      return (entry as any)?.mediaTypes || null;
    };

    for (const result of obsData?.results || []) {
      const queueId = result.group?.queueId || 'unknown';
      const mediaType = result.group?.mediaType;
      
      // Filter by enabled mediaTypes if config is provided
      const allowedMedia = getQueueMediaConfig(queueId);
      if (allowedMedia && mediaType && !allowedMedia.includes(mediaType)) {
        continue;
      }

      if (!queueMap.has(queueId)) {
        queueMap.set(queueId, {
          id: queueId,
          name: queueIdToName[queueId] || queueId,
          waiting: 0, interacting: 0, agents: 0, longestWait: '00:00:00',
          daily: { offered: 0, answered: 0, abandon: 0, waiting: 0 },
        });
      }
      const q = queueMap.get(queueId)!;
      let longestWaitMs = 0;

      for (const d of result.data || []) {
        if (d.metric === 'oWaiting') q.waiting += d.stats?.count || 0;
        if (d.metric === 'oInteracting') q.interacting += d.stats?.count || 0;
        if (d.metric === 'oOnQueueUsers') q.agents += d.stats?.count || 0;
        if (d.metric === 'oWaiting' && d.observations) {
          for (const obs of d.observations) {
            const wait = Date.now() - new Date(obs.observationDate).getTime();
            if (wait > longestWaitMs) longestWaitMs = wait;
          }
        }
      }
      q.longestWait = this.formatDuration(longestWaitMs);
    }

    // Merge aggregates
    for (const result of aggData?.results || []) {
      const queueId = result.group?.queueId;
      const mediaType = result.group?.mediaType;
      if (!queueId) continue;

      const allowedMedia = getQueueMediaConfig(queueId);
      if (allowedMedia && mediaType && !allowedMedia.includes(mediaType)) {
        continue;
      }

      if (!queueMap.has(queueId)) {
        queueMap.set(queueId, {
          id: queueId, name: queueIdToName[queueId] || queueId,
          waiting: 0, interacting: 0, agents: 0, longestWait: '00:00:00',
          daily: { offered: 0, answered: 0, abandon: 0, waiting: 0 },
        });
      }
      const q = queueMap.get(queueId)!;
      let totalHandleMs = 0;
      let handleCount = 0;

      for (const d of result.data || []) {
        for (const m of d.metrics || []) {
          if (m.metric === 'tAnswered') q.daily.answered += m.stats?.count || 0;
          if (m.metric === 'tAbandon') q.daily.abandon += m.stats?.count || 0;
          if (m.metric === 'nOffered') q.daily.offered += m.stats?.count || 0;
          if (m.metric === 'tWait') q.daily.waiting += m.stats?.count || 0;
          if (m.metric === 'tHandle') {
            totalHandleMs += m.stats?.sum || 0;
            handleCount += m.stats?.count || 0;
          }
        }
      }

      q.avgHandleTime = handleCount > 0 ? Math.round(totalHandleMs / handleCount) : 0;
    }

    return Array.from(queueMap.values()).map((q) => ({
      ...q,
      answerRate: q.daily.offered > 0
        ? Math.round((q.daily.answered / q.daily.offered) * 100)
        : 0,
    }));
  }

  transformAgents(entities: any[]): AgentStatus[] {
    return entities
      .map((u) => {
        const presence = u.presence?.presenceDefinition?.systemPresence || 'OFFLINE';
        const routing = u.routingStatus?.status || 'OFF_QUEUE';

        let status: AgentStatus['status'] = 'Offline';
        let durationDateStr = u.presence?.modifiedDate;

        if (routing === 'INTERACTING') {
          status = 'Interacting';
          durationDateStr = u.routingStatus?.startTime || durationDateStr;
        } else if (routing === 'COMMUNICATING') {
          status = 'Communicating';
          durationDateStr = u.routingStatus?.startTime || durationDateStr;
        } else if (routing === 'IDLE' && presence === 'On Queue') {
          status = 'Idle';
          durationDateStr = u.routingStatus?.startTime || durationDateStr;
        } else if (presence === 'Available' || presence === 'On Queue') {
          status = 'Available';
        } else if (presence !== 'Offline') {
          // Map specific system presences
          const knownPresences = ['Meal', 'Break', 'Meeting', 'Training', 'Busy', 'Away'];
          if (knownPresences.includes(presence)) {
            status = presence as any;
          } else {
            status = 'Other';
          }
        }

        const durationMs = durationDateStr
          ? Date.now() - new Date(durationDateStr).getTime()
          : 0;

        return {
          id: u.id,
          name: u.name,
          status,
          duration: this.formatDuration(durationMs),
          team: u.team?.name,
        } as AgentStatus;
      })
      .sort((a, b) => {
        // Sort: shortest interaction time first (ascending duration for Interacting), then by status
        const order: Record<string, number> = {
          Interacting: 0, Communicating: 1, Idle: 2, Available: 3, 
          Meal: 4, Break: 4, Meeting: 4, Training: 4, Busy: 4, Away: 4, Other: 4, 
          Offline: 99,
        };
        return (order[a.status] ?? 50) - (order[b.status] ?? 50);
      });
  }
}
