'use client';
import React from 'react';
import Header from '@/components/Header';
import RollingBanner from '@/components/RollingBanner';
import { useDashboard, QueueMetric } from '@/hooks/useDashboard';
import AgentTable from '@/components/AgentTable';
import { LeadTimeCard, QueueStatsGroup } from '@/components/MetricCards';

interface QueueConfig {
  label: string;
  nameSearch: string;
}

interface Props {
  teamId: string;
  teamName: string;
  queues: QueueConfig[];
  agentTitle?: string;
  totalRateLabel?: string;
  /** If provided, only these indexes in the queues array will be used for the total response rate calculation */
  mainQueueIndexes?: number[];
  hideOfflineAgents?: boolean;
}

export default function RealtimeDashboard({
  teamId,
  teamName,
  queues,
  agentTitle,
  totalRateLabel,
  mainQueueIndexes,
  hideOfflineAgents,
}: Props) {
  const { data, connected } = useDashboard(teamId);

  // Find metrics for each configured queue (supports aggregation)
  const matchedQueues = queues.map((conf) => {
    const matches = data?.queues.filter((q) => q.name.includes(conf.nameSearch)) || [];
    
    // Aggregate metrics if multiple queues match
    const aggregatedMetric: QueueMetric | undefined = matches.length > 0 ? {
      id: matches[0].id,
      name: conf.label,
      waiting: matches.reduce((s, q) => s + q.waiting, 0),
      interacting: matches.reduce((s, q) => s + q.interacting, 0),
      agents: matches.reduce((s, q) => s + q.agents, 0),
      longestWait: matches.sort((a, b) => (b.longestWait || '').localeCompare(a.longestWait || ''))[0]?.longestWait || '00:00',
      daily: {
        offered: matches.reduce((s, q) => s + q.daily.offered, 0),
        answered: matches.reduce((s, q) => s + q.daily.answered, 0),
        abandon: matches.reduce((s, q) => s + q.daily.abandon, 0),
        waiting: matches.reduce((s, q) => s + q.daily.waiting, 0),
      },
      avgHandleTime: matches.reduce((s, q) => s + (q.avgHandleTime || 0) * q.daily.answered, 0) / 
                     (matches.reduce((s, q) => s + q.daily.answered, 0) || 1),
    } : undefined;

    return { ...conf, metric: aggregatedMetric };
  });

  // Calculate total response rate
  const queuesForRate = mainQueueIndexes 
    ? matchedQueues.filter((_, i) => mainQueueIndexes.includes(i))
    : matchedQueues;

  const totalOffered  = queuesForRate.reduce((sum, q) => sum + (q.metric?.daily.offered || 0), 0);
  const totalAnswered = queuesForRate.reduce((sum, q) => sum + (q.metric?.daily.answered || 0), 0);
  const combinedRate  = totalOffered > 0 ? Math.round((totalAnswered / totalOffered) * 100) : 0;

  // Layout logic: Max 3 columns for queues in the middle. 
  // If more than 3, we might need a different grid or just overflow/scroll.
  // For Biz Ops (5 queues), let's try a 2-row approach for the center.
  const queueCount = matchedQueues.length;
  
  return (
    <div id="dashboard-root">
      <Header connected={connected} />

      <main style={{
        flex: 1,
        width: '100%',
        padding: '1.25vw 1.67vw',
        display: 'grid',
        // Responsive grid: [Total Rate] [Queues...] [Agent Table]
        // We use fractional units for the queues to fill the middle space
        gridTemplateColumns: `17% repeat(${Math.min(queueCount, 3)}, minmax(0, 1fr)) 19%`,
        gridTemplateRows: '1fr 1fr',
        gap: '1.25vw',
        overflow: 'hidden',
        boxSizing: 'border-box',
        minHeight: 0,
      }}>
        {/* ① Total Answer Rate — spans 2 rows left col */}
        <div style={{ gridRow: '1 / 3' }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '1.04vw',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.04vw',
            padding: '1.67vw',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '0.7vw', fontWeight: 700, color: 'var(--color-text-sub)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {totalRateLabel || `${teamName} 전체 응대율`}
            </div>
            <div style={{
              fontSize: '3.5vw', 
              fontWeight: 800,
              color: combinedRate >= 90 ? 'var(--color-green)' : combinedRate >= 70 ? 'var(--color-yellow)' : 'var(--color-red)',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {totalOffered > 0 ? `${combinedRate}%` : '—'}
            </div>
            <div style={{ fontSize: '0.8vw', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '1.0vw' }}>
              {totalAnswered.toLocaleString()} / {totalOffered.toLocaleString()} 응대
            </div>
            <div style={{ fontSize: '0.6vw', color: 'var(--color-text-muted)', marginTop: '0.4vw' }}>
              당일 기준 음성 채널
            </div>
          </div>
        </div>

        {/* ② Queue Stats & Lead Times */}
        {matchedQueues.map((q, idx) => {
          const col = idx + 2;
          return (
            <React.Fragment key={q.label}>
              <div style={{ gridColumn: col, gridRow: 1 }}>
                <QueueStatsGroup label={q.label} metric={q.metric} />
              </div>
              <div style={{ gridColumn: col, gridRow: 2 }}>
                <LeadTimeCard label={`${q.label} 리드타임`} metric={q.metric} />
              </div>
            </React.Fragment>
          );
        })}

        {/* ⑦ Agent Table — spans 2 rows right col */}
        <div style={{ gridColumn: queueCount >= 3 ? 5 : queueCount + 2, gridRow: '1 / 3' }}>
          <AgentTable 
            agents={
              hideOfflineAgents 
                ? (data?.agents || []).filter(a => a.status !== 'Offline') 
                : (data?.agents || [])
            } 
            title={agentTitle || `계정 상태 (${teamName})`} 
          />
        </div>
      </main>

      <RollingBanner />
    </div>
  );
}
