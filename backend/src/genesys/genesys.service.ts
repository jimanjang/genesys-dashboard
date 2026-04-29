import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GenesysApiService } from './genesys-api.service';
import { TEAM_QUEUE_CONFIG } from './team-queue.config';
import { DashboardData, QueueMetric, AgentStatus } from './genesys.types';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class GenesysService {
  private readonly logger = new Logger(GenesysService.name);

  // In-memory latest data store per team
  private latestData = new Map<string, DashboardData>();

  // Resolved queue name → ID mapping
  private queueNameToId: Record<string, string> = {};
  private queueIdToName: Record<string, string> = {};

  constructor(
    private api: GenesysApiService,
    private events: EventsGateway,
  ) {}

  async onModuleInit() {
    await this.resolveQueueIds();
    await this.pollAll();
  }

  // ───────────────────────────────────────────────────────────────
  // Resolve all queue IDs from Genesys once on start + every hour
  // ───────────────────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_HOUR)
  async resolveQueueIds() {
    try {
      const allQueues = await this.api.fetchAllQueueIds();
      this.queueNameToId = allQueues;
      this.queueIdToName = Object.fromEntries(
        Object.entries(allQueues).map(([name, id]) => [id, name]),
      );
      this.logger.log(`Queue registry updated: ${Object.keys(allQueues).length} queues`);
    } catch (err: any) {
      this.logger.error(`Failed to resolve queue IDs: ${err.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────────
  // Poll every 10 seconds
  // ───────────────────────────────────────────────────────────────
  @Cron('*/10 * * * * *')
  async pollAll() {
    const teams = ['pay', 'biz-ops', 'alba'];
    for (const teamId of teams) {
      await this.pollTeam(teamId);
    }
  }

  async pollTeam(teamId: string) {
    try {
      const data = await this.buildTeamData(teamId);
      this.latestData.set(teamId, data);
      this.events.broadcastDashboard(teamId, data);
    } catch (err: any) {
      this.logger.error(`Poll failed for team ${teamId}: ${err.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────────
  // Build complete dashboard data for a given team
  // ───────────────────────────────────────────────────────────────
  async buildTeamData(teamId: string): Promise<DashboardData> {
    const config = (TEAM_QUEUE_CONFIG as any)[this.configKeyFromTeamId(teamId)];
    if (!config || config.lookerOnly) {
      return { queues: [], agents: [], timestamp: new Date().toISOString() };
    }

    // Collect all queue IDs for this team
    const queueIds: string[] = [];
    for (const qKey of Object.keys(config.queues || {})) {
      const queueName = config.queues[qKey].queueName;
      const queueId = this.queueNameToId[queueName];
      if (queueId) queueIds.push(queueId);
      else this.logger.warn(`Queue not found in registry: "${queueName}"`);
    }

    const [obsData, aggData] = await Promise.all([
      this.api.fetchQueueObservations(queueIds),
      this.api.fetchDailyAggregates(queueIds),
    ]);

    const queues = this.api.transformQueueData(
      obsData,
      this.queueIdToName,
      aggData,
      config,
    );

    // Fetch agents by team label(s)
    const agentTeams: string[] = config.agentTeam
      ? [config.agentTeam]
      : config.agentTeams || [];

    // We fetch all users and filter by team name client-side for simplicity
    let agents: AgentStatus[] = [];
    try {
      const allUsers = await this.api.apiRequest<any>(
        'GET',
        `/api/v2/users?pageSize=200&expand=presence,routingStatus,team`,
      );
      const filtered = (allUsers?.entities || []).filter((u: any) => {
        const teamName = u.team?.name || '';
        return agentTeams.some((t: string) =>
          teamName.toLowerCase().includes(t.toLowerCase()),
        );
      });
      agents = this.api.transformAgents(filtered);
    } catch (err: any) {
      this.logger.warn(`Agent fetch failed for ${teamId}: ${err.message}`);
    }

    return {
      queues,
      agents,
      timestamp: new Date().toISOString(),
    };
  }

  private configKeyFromTeamId(teamId: string): string {
    const map: Record<string, string> = {
      pay: 'pay',
      'biz-ops': 'bizOps',
      alba: 'alba',
      'ad-review': 'adReview',
      'biz-review': 'bizReview',
      dispute: 'dispute',
      secondhand: 'secondhand',
    };
    return map[teamId] || teamId;
  }

  getLatestData(teamId: string): DashboardData | null {
    return this.latestData.get(teamId) || null;
  }
}
