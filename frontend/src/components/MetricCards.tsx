'use client';
import { QueueMetric } from '@/hooks/useDashboard';

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString();
}

function fmtMs(ms: number | undefined) {
  if (!ms) return '—';
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function MetricCard({
  label,
  value,
  sub,
  color,
  size = 'md',
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  accent?: boolean;
}) {
  const valueFontSize = size === 'lg' ? 'clamp(40px, 3.5vw, 140px)' : size === 'sm' ? 'clamp(20px, 1.5vw, 60px)' : 'clamp(32px, 2.5vw, 90px)';
  const labelFontSize = size === 'lg' ? '1.1vw' : '0.9vw';
  const subFontSize   = size === 'lg' ? '1.0vw' : '0.8vw';

  return (
    <div className="metric-card" style={{
      borderTop: accent ? '0.1vw solid var(--color-daangn)' : undefined,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '0.6vw 0.3vw',
      minWidth: 0,
      overflow: 'hidden',
    }}>
      <div className="metric-card-label" style={{ fontSize: labelFontSize, marginBottom: '0.4vw', fontWeight: 700, color: 'var(--color-text-sub)', whiteSpace: 'nowrap' }}>{label}</div>
      <div className="metric-card-value" style={{ fontSize: valueFontSize, color: color || 'var(--color-text)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && <div className="metric-card-sub" style={{ fontSize: subFontSize, marginTop: '0.4vw', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  );
}

export function QueueStatsGroup({ label, metric }: { label: string; metric: QueueMetric | undefined }) {
  if (!metric) {
    return (
      <div className="metric-card" style={{ opacity: 0.5 }}>
        <div className="metric-card-label">{label}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>연결 중...</div>
      </div>
    );
  }

  const { waiting, daily } = metric;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Label bar */}
      <div style={{
        padding: '0.83vw 1.04vw',
        background: 'var(--color-daangn)',
        fontSize: '1.25vw',
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '0.02em',
      }}>
        {label}
      </div>
      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        padding: '0.83vw 1.04vw',
        gap: '0.83vw',
        flex: 1,
      }}>
        <Stat 
          label="대기" 
          value={fmt(daily.waiting)} 
          color={waiting > 0 ? 'var(--color-red)' : 'var(--color-text)'} 
          bg={waiting > 0 ? 'var(--color-red-light)' : undefined} 
        />
        <Stat label="인입" value={fmt(daily.offered)} />
        <Stat label="포기" value={fmt(daily.abandon)} color={daily.abandon > 0 ? 'var(--color-yellow)' : 'var(--color-text)'} bg={daily.abandon > 0 ? 'var(--color-yellow-light)' : undefined} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color, bg }: { label: string; value: string; sub?: string; color?: string; bg?: string }) {
  return (
    <div style={{
      textAlign: 'center',
      background: bg || 'var(--color-surface-2)',
      borderRadius: '0.6vw',
      padding: '0.5vw 0.1vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minWidth: 0,
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: '0.9vw', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.2vw', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 'clamp(24px, 1.8vw, 80px)', fontWeight: 800, color: color || 'var(--color-text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.8vw', marginTop: '0.2vw', color: color || 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  );
}

export function AnswerRateCard({ metric, label }: { metric: QueueMetric | undefined; label: string }) {
  const rate = metric?.answerRate ?? 0;
  const color = rate >= 90 ? 'var(--color-green)' : rate >= 70 ? 'var(--color-yellow)' : 'var(--color-red)';
  const bg    = rate >= 90 ? 'var(--color-green-light)' : rate >= 70 ? 'var(--color-yellow-light)' : 'var(--color-red-light)';
  return (
    <div style={{
      background: bg,
      border: `1px solid ${color}`,
      borderRadius: 20,
      padding: '24px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 8,
      height: '100%',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: '1.1vw', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {metric ? `${rate}%` : '—'}
      </div>
      {metric && (
        <div style={{ fontSize: 12, color, fontWeight: 500 }}>
          {metric.daily.answered.toLocaleString()} / {metric.daily.offered.toLocaleString()} 응대
        </div>
      )}
    </div>
  );
}

export function LeadTimeCard({ metric, label }: { metric: QueueMetric | undefined; label: string }) {
  return (
    <MetricCard
      label={label}
      value={metric ? fmtMs(metric.avgHandleTime) : '—'}
      sub="평균 처리 시간 (AHT)"
      size="lg"
      accent
    />
  );
}
