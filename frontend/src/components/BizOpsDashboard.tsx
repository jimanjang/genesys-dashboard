'use client';
import React from 'react';
import Header from '@/components/Header';
import RollingBanner from '@/components/RollingBanner';
import { useDashboard, QueueMetric } from '@/hooks/useDashboard';
import AgentTable from '@/components/AgentTable';

const DAANGN_ORANGE = '#FF8200';

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString();
}

// Helper to aggregate multiple queues into one metric
function aggregateQueues(allQueues: QueueMetric[], namePatterns: string[], label: string): QueueMetric | undefined {
  const matches = allQueues.filter(q => namePatterns.some(p => q.name.includes(p)));
  if (matches.length === 0) return undefined;

  const totalOffered = matches.reduce((s, q) => s + q.daily.offered, 0);
  const totalAnswered = matches.reduce((s, q) => s + q.daily.answered, 0);

  return {
    id: matches[0].id,
    name: label,
    waiting: matches.reduce((s, q) => s + q.waiting, 0),
    interacting: matches.reduce((s, q) => s + q.interacting, 0),
    agents: matches.reduce((s, q) => s + q.agents, 0),
    longestWait: matches.sort((a, b) => (b.longestWait || '').localeCompare(a.longestWait || ''))[0]?.longestWait || '00:00',
    daily: {
      offered: totalOffered,
      answered: totalAnswered,
      abandon: matches.reduce((s, q) => s + q.daily.abandon, 0),
      waiting: matches.reduce((s, q) => s + q.daily.waiting, 0),
    },
    answerRate: totalOffered > 0 ? Math.round((totalAnswered / totalOffered) * 100) : 0,
    avgHandleTime: matches.reduce((s, q) => s + (q.avgHandleTime || 0) * q.daily.answered, 0) / (totalAnswered || 1),
  };
}

export default function BizOpsDashboard() {
  const { data, connected } = useDashboard('biz-ops');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Group definitions
  const adGroup = aggregateQueues(data?.queues || [], ['광고'], '광고');
  const bizGroup = aggregateQueues(data?.queues || [], ['비즈프로필', '포장주문', 'QR'], '비즈');

  // Slide logic: 3 slides total (Native, Looker 1, Looker 2)
  const slideTitles = ['실시간 현황', '비즈', '광고'];

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('slide-update', { detail: slideTitles[currentIndex] }));
  }, [currentIndex]);

  React.useEffect(() => {
    const idx = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3);
    }, 10000); // 10 seconds per slide
    return () => clearInterval(idx);
  }, []);

  return (
    <div id="dashboard-root" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <Header connected={connected} />

      <main style={{
        flex: 1,
        width: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Slide 0: Native Genesys Layout */}
        <div style={{
          position: 'absolute',
          top: '0.4vw', left: '1.67vw', right: '1.67vw', bottom: '0.4vw',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1.1fr 19%',
          gap: '1.25vw',
          opacity: currentIndex === 0 ? 1 : 0,
          pointerEvents: currentIndex === 0 ? 'auto' : 'none',
          transition: 'opacity 0.8s ease-in-out',
          zIndex: currentIndex === 0 ? 2 : 1,
        }}>
          {/* Ad Group Container */}
          <GroupContainer title="광고 콜 시스템" metric={adGroup} />

          {/* Biz Group Container */}
          <GroupContainer title="비즈 콜 시스템" metric={bizGroup} />

          {/* Agent Table */}
          <div style={{ height: '100%' }}>
            <AgentTable agents={data?.agents || []} title="구성원별 상태" />
          </div>
        </div>

        {/* Slide 1: Looker Studio (사업심사-비즈) */}
        <div style={{
          position: 'absolute',
          top: '0.4vw', left: '1.67vw', right: '1.67vw', bottom: '0.4vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: currentIndex === 1 ? 1 : 0,
          pointerEvents: currentIndex === 1 ? 'auto' : 'none',
          transition: 'opacity 0.8s ease-in-out',
          zIndex: currentIndex === 1 ? 2 : 1,
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#ffffff',
            borderRadius: '1.2vw',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <iframe
              src="https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_qmanjlnr2d?displayMode=RESIZE_TO_FIT"
              scrolling="no"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
              title="사업심사-비즈"
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>

        {/* Slide 2: Looker Studio (사업심사-광고) */}
        <div style={{
          position: 'absolute',
          top: '0.4vw', left: '1.67vw', right: '1.67vw', bottom: '0.4vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: currentIndex === 2 ? 1 : 0,
          pointerEvents: currentIndex === 2 ? 'auto' : 'none',
          transition: 'opacity 0.8s ease-in-out',
          zIndex: currentIndex === 2 ? 2 : 1,
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#ffffff',
            borderRadius: '1.2vw',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <iframe
              src="https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_doihjtht2d?displayMode=RESIZE_TO_FIT"
              scrolling="no"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
              title="사업심사-광고"
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      </main>

      <RollingBanner />
    </div>
  );
}

function GroupContainer({ title, metric }: { title: string; metric: QueueMetric | undefined }) {
  const rate = metric?.answerRate ?? 0;
  const rateColor = rate >= 90 ? 'var(--color-green)' : rate >= 70 ? 'var(--color-yellow)' : 'var(--color-red)';
  const rateBg = rate >= 90 ? 'var(--color-green-light)' : rate >= 70 ? 'var(--color-yellow-light)' : 'var(--color-red-light)';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '1.25vw',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)',
      height: '100%',
    }}>
      {/* Header Bar - matching Pay Team design */}
      <div style={{
        padding: '0.9vw 1.2vw',
        background: DAANGN_ORANGE,
        fontSize: '1.2vw',
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '0.02em',
      }}>
        {title}
      </div>

      <div style={{
        padding: '1.25vw',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25vw',
        minHeight: 0,
      }}>
        {/* Top: Answer Rate Card - matching the look of Pay Team's total rate */}
        <div style={{
          background: rateBg,
          border: `1px solid ${rateColor}`,
          borderRadius: '1.04vw',
          padding: '1.5vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.8vw',
          height: '50%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1vw', fontWeight: 700, color: rateColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            응대율
          </div>
          <div style={{ fontSize: '4.5vw', fontWeight: 900, color: rateColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {metric ? `${rate}%` : '—'}
          </div>
          <div style={{ fontSize: '1vw', fontWeight: 600, color: rateColor, opacity: 0.8 }}>
            {metric ? `${metric.daily.answered.toLocaleString()} / ${metric.daily.offered.toLocaleString()} 응대` : '연결 중...'}
          </div>
        </div>

        {/* Bottom: 4 Stats Row - matching Stat component in MetricCards.tsx */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1vw',
          height: '40%',
        }}>
          <StatBox label="인입호" value={fmt(metric?.daily.offered)} />
          <StatBox label="응대호" value={fmt(metric?.daily.answered)} />
          <StatBox 
            label="대기호" 
            value={fmt(metric?.daily.waiting)} 
            color={metric && metric.waiting > 0 ? 'var(--color-red)' : undefined}
            bg={metric && metric.waiting > 0 ? 'var(--color-red-light)' : undefined}
          />
          <StatBox 
            label="미응대" 
            value={fmt(metric?.daily.abandon)} 
            color={metric && metric.daily.abandon > 0 ? 'var(--color-yellow)' : undefined}
            bg={metric && metric.daily.abandon > 0 ? 'var(--color-yellow-light)' : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: string; color?: string; bg?: string }) {
  return (
    <div style={{
      textAlign: 'center',
      background: bg || 'var(--color-surface-2)',
      borderRadius: '0.8vw',
      padding: '0.8vw 0.2vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minWidth: 0,
      overflow: 'hidden',
      border: color ? `1px solid ${color}44` : 'none',
    }}>
      <div style={{ 
        fontSize: '0.8vw', 
        color: 'var(--color-text-muted)', 
        fontWeight: 700, 
        letterSpacing: '0.04em', 
        textTransform: 'uppercase', 
        marginBottom: '0.4vw',
        whiteSpace: 'nowrap'
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '2vw', 
        fontWeight: 800, 
        color: color || 'var(--color-text)', 
        fontVariantNumeric: 'tabular-nums', 
        lineHeight: 1.1, 
        letterSpacing: '-0.02em' 
      }}>
        {value}
      </div>
    </div>
  );
}
