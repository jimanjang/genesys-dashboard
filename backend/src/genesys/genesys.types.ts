export interface DailyAggregates {
  offered: number;
  answered: number;
  abandon: number;
  waiting: number;
}

export interface QueueMetric {
  id: string;
  name: string;
  waiting: number;
  interacting: number;
  agents: number;
  longestWait: string;
  daily: DailyAggregates;
  answerRate?: number;
  avgHandleTime?: number; // ms
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'Interacting' | 'Communicating' | 'Idle' | 'Available' | 'Offline' | 
          'Meal' | 'Break' | 'Meeting' | 'Training' | 'Busy' | 'Away' | 'Other';
  duration: string; // "HH:MM:SS"
  team?: string;
}

export interface DashboardData {
  queues: QueueMetric[];
  agents: AgentStatus[];
  timestamp: string;
}

// Per-team queue filter config
export interface TeamQueueConfig {
  teamId: string;
  teamName: string;
  queueNames: string[];  // display names matched against Genesys queue name strings
  mediaTypes?: string[];
}
