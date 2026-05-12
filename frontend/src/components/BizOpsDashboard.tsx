'use client';
import React from 'react';
import Header from '@/components/Header';
import RollingBanner from '@/components/RollingBanner';
import { useDashboard, QueueMetric } from '@/hooks/useDashboard';
import AgentTable from '@/components/AgentTable';

const DAANGN_ORANGE = '#FF8200';

// 1시간마다 갱신될 key 생성 (전체화면 유지, 페이지 리로드 없음)
function getHourlyKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
}

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString();
}

// longestWait (HH:MM:SS) → MM:SS 형식으로 변환
function fmtLongestWait(longestWait: string | undefined): string {
  if (!longestWait || longestWait === '00:00:00') return '00:00';
  const parts = longestWait.split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseInt(parts[2], 10);
    const totalMin = h * 60 + m;
    return `${String(totalMin).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return longestWait;
}

// 여러 큐를 하나의 지표로 집계
function aggregateQueues(allQueues: QueueMetric[], namePatterns: string[], label: string): QueueMetric | undefined {
  const matches = allQueues.filter(q => namePatterns.some(p => q.name.includes(p)));
  if (matches.length === 0) return undefined;

  const totalOffered = matches.reduce((s, q) => s + q.daily.offered, 0);
  const totalAnswered = matches.reduce((s, q) => s + q.daily.answered, 0);

  // 최대 대기 시간: 가장 긴 longestWait 값 선택
  const longestWait = matches
    .map(q => q.longestWait || '00:00:00')
    .sort((a, b) => b.localeCompare(a))[0] || '00:00:00';

  return {
    id: matches[0].id,
    name: label,
    waiting: matches.reduce((s, q) => s + q.waiting, 0),
    interacting: matches.reduce((s, q) => s + q.interacting, 0),
    agents: matches.reduce((s, q) => s + q.agents, 0),
    longestWait,
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

// 광고 큐 패턴 (6개)
const AD_QUEUE_PATTERNS = ['광고 호전환', '광고 노출/성과', '광고 세금계산서', '신규 광고 문의', '신규 광고 성과 문의', '신규 광고 신청'];
// 비즈 큐 패턴 (5개)
const BIZ_QUEUE_PATTERNS = ['비즈프로필 오류', '비즈프로필 이용제재', '포장주문 이용방법', 'QR서비스센터', '비즈프로필 호전환'];

// Looker Studio embed URL 기본
const LOOKER_BASE = 'https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e';

// 슬라이드 정의: 사업심사-광고 / 사업심사-비즈 / 사업심사-전화(Genesys) / 사업운영
const SLIDES = [
  { title: '사업심사 - 광고', type: 'looker', src: `${LOOKER_BASE}/page/p_5an3jenw1d` },
  { title: '사업심사 - 비즈', type: 'looker', src: `${LOOKER_BASE}/page/p_2bvhsenw1d` },
  { title: '전화',            type: 'native' },
  { title: '사업운영',        type: 'looker', src: `${LOOKER_BASE}/page/p_qmanjlnr2d` },
];
const TOTAL_SLIDES = SLIDES.length;

export default function BizOpsDashboard() {
  const { data, connected } = useDashboard('biz-ops');
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [iframeKey, setIframeKey] = React.useState(getHourlyKey);

  // 1분마다 체크하여 정각에 iframe만 조용히 갱신 (전체화면 영향 없음)
  React.useEffect(() => {
    const checkHourChange = setInterval(() => {
      const newKey = getHourlyKey();
      setIframeKey((prev) => prev !== newKey ? newKey : prev);
    }, 60 * 1000);
    return () => clearInterval(checkHourChange);
  }, []);

  const adGroup = aggregateQueues(data?.queues || [], AD_QUEUE_PATTERNS, '광고');
  const bizGroup = aggregateQueues(data?.queues || [], BIZ_QUEUE_PATTERNS, '비즈');

  // 슬라이드 자동 전환 + 헤더 서브타이틀 업데이트
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('slide-update', { detail: SLIDES[currentIndex].title }));
  }, [currentIndex]);

  React.useEffect(() => {
    const idx = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TOTAL_SLIDES);
    }, 10000);
    return () => clearInterval(idx);
  }, []);

  return (
    <div id="dashboard-root" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <Header connected={connected} />

      <main style={{
        flex: 1, width: '100%', position: 'relative',
        boxSizing: 'border-box', overflow: 'hidden', minHeight: 0,
      }}>

        {/* ── Slide 0: 사업심사 - 광고 (Looker) ── */}
        <LookerSlide
          slideKey={`${iframeKey}-ad-review`}
          src={SLIDES[0].src!}
          title={SLIDES[0].title}
          visible={currentIndex === 0}
        />

        {/* ── Slide 1: 사업심사 - 비즈 (Looker) ── */}
        <LookerSlide
          slideKey={`${iframeKey}-biz-review`}
          src={SLIDES[1].src!}
          title={SLIDES[1].title}
          visible={currentIndex === 1}
        />

        {/* ── Slide 2: 사업심사 - 전화 (Genesys 실시간) ── */}
        <div style={{
          position: 'absolute',
          top: '0.4vw', left: '1.67vw', right: '1.67vw', bottom: '0.4vw',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 19%',
          gap: '1.1vw',
          opacity: currentIndex === 2 ? 1 : 0,
          pointerEvents: currentIndex === 2 ? 'auto' : 'none',
          transition: 'opacity 0.8s ease-in-out',
          zIndex: currentIndex === 2 ? 2 : 1,
        }}>
          {/* 광고 패널 */}
          <GroupPanel title="광고 콜 시스템" prefix="광고" metric={adGroup} />
          {/* 비즈 패널 */}
          <GroupPanel title="비즈 콜 시스템" prefix="비즈" metric={bizGroup} />
          {/* 구성원별 상태 */}
          <div style={{ height: '100%' }}>
            <AgentTable agents={data?.agents || []} title="구성원별 상태" />
          </div>
        </div>

        {/* ── Slide 3: 사업운영 (Looker) ── */}
        <LookerSlide
          slideKey={`${iframeKey}-biz-ops`}
          src={SLIDES[3].src!}
          title={SLIDES[3].title}
          visible={currentIndex === 3}
        />

      </main>

      <RollingBanner />
    </div>
  );
}

// ─── Looker iframe 슬라이드 공용 컴포넌트 ────────────────────────────
function LookerSlide({ slideKey, src, title, visible }: {
  slideKey: string; src: string; title: string; visible: boolean;
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '0.4vw', left: '1.67vw', right: '1.67vw', bottom: '0.4vw',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.8s ease-in-out',
      zIndex: visible ? 2 : 1,
    }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        maxWidth: '100%', maxHeight: '100%', aspectRatio: '16 / 9',
        backgroundColor: '#ffffff', borderRadius: '1.2vw',
        boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      }}>
        <iframe
          key={slideKey}
          src={`${src}${src.includes('?') ? '&' : '?'}displayMode=RESIZE_TO_FIT`}
          scrolling="no"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={title}
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}

// ─── 광고/비즈 공용 패널: 오렌지 헤더 + 상단 2칸 + 하단 4칸 ────────────
function GroupPanel({ title, prefix, metric }: {
  title: string; prefix: string; metric: QueueMetric | undefined;
}) {
  const rate = metric?.answerRate ?? 0;
  const rateColor = rate >= 90 ? 'var(--color-green)' : rate >= 70 ? 'var(--color-yellow)' : 'var(--color-red)';
  const rateBg   = rate >= 90 ? 'var(--color-green-light)' : rate >= 70 ? 'var(--color-yellow-light)' : 'var(--color-red-light)';

  const longestWaitStr = fmtLongestWait(metric?.longestWait);
  const isLongWait = metric && metric.longestWait !== '00:00:00' && metric.longestWait !== '00:00' && !!metric.longestWait;

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
      {/* 오렌지 헤더 */}
      <div style={{
        padding: '0.75vw 1.2vw',
        background: DAANGN_ORANGE,
        fontSize: '1.1vw',
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}>
        {title}
      </div>

      <div style={{
        padding: '0.9vw 1vw',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9vw',
        minHeight: 0,
      }}>
        {/* 상단: 응대율 + 최대 대기 시간 (2칸) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9vw', flex: '0 0 48%' }}>
          {/* 응대율 카드 */}
          <div style={{
            background: rateBg,
            border: `1px solid ${rateColor}`,
            borderRadius: '1vw',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.5vw', textAlign: 'center', padding: '0.5vw',
          }}>
            <div style={{ fontSize: '0.8vw', fontWeight: 700, color: rateColor, letterSpacing: '0.06em' }}>
              응대율
            </div>
            <div style={{ fontSize: '3.6vw', fontWeight: 900, color: rateColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {metric ? `${rate}%` : '—'}
            </div>
            <div style={{ fontSize: '0.75vw', fontWeight: 600, color: rateColor, opacity: 0.8 }}>
              {metric
                ? `${metric.daily.answered.toLocaleString()} / ${metric.daily.offered.toLocaleString()} 응대`
                : '연결 중...'}
            </div>
          </div>

          {/* 최대 대기 시간 카드 */}
          <div style={{
            background: isLongWait ? 'var(--color-red-light)' : 'var(--color-surface-2)',
            border: isLongWait ? '1px solid var(--color-red)' : '1px solid var(--color-border)',
            borderRadius: '1vw',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.5vw', textAlign: 'center', padding: '0.5vw',
          }}>
            <div style={{ fontSize: '0.8vw', fontWeight: 700, color: isLongWait ? 'var(--color-red)' : 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
              {prefix} 전화 최대 대기 시간
            </div>
            <div style={{ fontSize: '3.6vw', fontWeight: 900, color: isLongWait ? 'var(--color-red)' : 'var(--color-text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {metric ? longestWaitStr : '—'}
            </div>
            <div style={{ fontSize: '0.75vw', fontWeight: 500, color: isLongWait ? 'var(--color-red)' : 'var(--color-text-muted)' }}>
              분 : 초
            </div>
          </div>
        </div>

        {/* 하단: 4칸 통계 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '0.9vw',
          flex: 1, minHeight: 0,
        }}>
          <StatBox label="인입호" value={fmt(metric?.daily.offered)} />
          <StatBox label="응대호" value={fmt(metric?.daily.answered)} />
          <StatBox
            label="대기호"
            value={fmt(metric?.waiting)}
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
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      height: '100%', minWidth: 0, overflow: 'hidden',
      border: color ? `1px solid ${color}44` : 'none',
    }}>
      <div style={{
        fontSize: '0.75vw', color: 'var(--color-text-muted)', fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.4vw', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '2.2vw', fontWeight: 800,
        color: color || 'var(--color-text)',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
    </div>
  );
}
