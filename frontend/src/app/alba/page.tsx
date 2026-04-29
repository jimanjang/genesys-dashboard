'use client';
import React from 'react';
import Header from '@/components/Header';
import RollingBanner from '@/components/RollingBanner';
import { useDashboard, QueueMetric } from '@/hooks/useDashboard';
import AgentTable from '@/components/AgentTable';
import LookerPlaceholder from '@/components/LookerPlaceholder';

function GrayBox({ label, value, isRate = false }: { label: string; value: string | number; isRate?: boolean }) {
  const isDanger = isRate && typeof value === 'number' && value < 70;
  return (
    <div style={{
      flex: 1,
      background: '#f1f3f5', // Gray box as requested
      border: '1px solid var(--color-border)',
      borderRadius: '1vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.4vw',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: '1.2vw', fontWeight: 700, color: 'var(--color-text-sub)' }}>
        {label}
      </div>
      <div style={{
        fontSize: '2.5vw',
        fontWeight: 800,
        color: isDanger ? 'var(--color-red)' : 'var(--color-text)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}{isRate ? '%' : ''}
      </div>
    </div>
  );
}

export default function AlbaDashboard() {
  const { data, connected } = useDashboard('alba');

  // Queues specifically for Alba team
  const queues = [
    { label: '알바 일반문의', nameSearch: '당근알바 고객센터 일반문의' },
    { label: '알바 유료상품', nameSearch: '당근알바 고객센터 유료 상품 문의' },
  ];

  // Aggregate stats across all matched queues
  let totalOffered = 0;
  let totalAnswered = 0;
  let totalAbandon = 0;
  let totalWaiting = 0;

  queues.forEach((conf) => {
    const matches = data?.queues.filter((q) => q.name.includes(conf.nameSearch)) || [];
    matches.forEach(q => {
      totalOffered += q.daily.offered;
      totalAnswered += q.daily.answered;
      totalAbandon += q.daily.abandon;
      totalWaiting += q.waiting;
    });
  });

  const combinedRate = totalOffered > 0 ? Math.round((totalAnswered / totalOffered) * 100) : 0;

  // Filter out Offline agents as requested
  const visibleAgents = (data?.agents || []).filter(a => a.status !== 'Offline');

  return (
    <div id="dashboard-root">
      <Header connected={connected} />

      <main style={{
        flex: 1,
        width: '100%',
        padding: '1.25vw 1.67vw', // Standard padding
        display: 'grid',
        // 2 columns: Looker (80%), Gray Boxes (20%)
        gridTemplateColumns: '80% 20%',
        gap: '1.25vw',
        overflow: 'hidden',
        boxSizing: 'border-box',
        minHeight: 0,
      }}>
        {/* Left: Looker Studio iframe */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1.2vw', boxShadow: 'var(--shadow-sm)' }}>
          <LookerPlaceholder 
            teamName="당근알바팀" 
            iframeSrc="https://datastudio.google.com/embed/reporting/67814d96-3a79-405f-afed-482fc89083a1/page/p_iwakfem91d" 
          />
        </div>

        {/* Right: 5 Gray Boxes (Genesys Metrics) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1vw', height: '100%' }}>
          <GrayBox label="응대율" value={combinedRate} isRate={true} />
          <GrayBox label="인입호" value={totalOffered} />
          <GrayBox label="응대호" value={totalAnswered} />
          <GrayBox label="포기호" value={totalAbandon} />
          <GrayBox label="대기호" value={totalWaiting} />
        </div>
      </main>

      <RollingBanner />
    </div>
  );
}
