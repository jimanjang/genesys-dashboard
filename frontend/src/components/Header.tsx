'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const TEAMS = [
  { id: 'pay',         label: '페이팀',          path: '/pay' },
  { id: 'biz-ops',    label: '사업 운영팀',      path: '/biz-ops' },
  { id: 'alba',       label: '당근알바팀',        path: '/alba' },
  { id: 'biz-review', label: '사업심사팀',        path: '/biz-review' },
  { id: 'external',   label: '대외민원팀',        path: '/external' },
  { id: 'dispute',    label: '분쟁조정팀',        path: '/dispute' },
  { id: 'secondhand', label: '중고거래팀',         path: '/secondhand' },
];

export default function Header({ connected }: { connected?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const current = TEAMS.find((t) => pathname.startsWith(t.path));

  // Reset subtitle when you switch menus
  useEffect(() => { setSubtitle(''); }, [pathname]);

  useEffect(() => {
    const handleSlideUpdate = (e: any) => {
      setSubtitle(e.detail || '');
    };
    window.addEventListener('slide-update', handleSlideUpdate);
    return () => window.removeEventListener('slide-update', handleSlideUpdate);
  }, []);

  return (
    <header style={{
      width: '96.67vw',
      height: '4.0vw',
      background: '#ffffff',
      borderRadius: '1.25vw',
      display: 'flex',
      alignItems: 'center',
      margin: '0.8vw 1.67vw 0 1.67vw',
      padding: '0 2.08vw',
      gap: '1.67vw',
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src="/daangn-logo.png"
          alt="당근서비스"
          style={{
            height: '3.54vw', /* 68px */
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: '2.29vw', background: 'var(--color-border)' }} />

      {/* Team Selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: open ? 'var(--color-daangn-light)' : '#f8f8f5',
            border: `1.5px solid ${open ? 'var(--color-daangn)' : 'var(--color-border)'}`,
            borderRadius: '0.52vw',
            color: open ? 'var(--color-daangn-dark)' : 'var(--color-text)',
            padding: '0.6vw 1.2vw',
            fontSize: '1.25vw',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8vw',
            minWidth: '12vw', /* Increased from 10.42vw */
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{current?.label || '팀 선택'}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.57vw', color: 'var(--color-text-muted)' }}>▼</span>
        </button>
        {open && (
          <div style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            background: '#ffffff',
            border: '1.5px solid var(--color-border)',
            borderRadius: '0.625vw',
            overflow: 'hidden',
            zIndex: 100,
            minWidth: '11.46vw', /* 220px */
            boxShadow: '0 0.42vw 1.25vw rgba(0,0,0,0.12)',
          }}>
            {TEAMS.map((team) => {
              const isActive = pathname.startsWith(team.path);
              return (
                <Link
                  key={team.id}
                  href={team.path}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.625vw 1.04vw',
                    fontSize: '0.73vw',
                    color: isActive ? 'var(--color-daangn)' : 'var(--color-text)',
                    background: isActive ? 'var(--color-daangn-light)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 400,
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  {team.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Slide Subtitle (Next to Dropbox) */}
      {subtitle && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4vw',
          fontSize: '1.25vw',
          fontWeight: 800,
          color: 'var(--color-daangn)',
          paddingLeft: '0.5vw'
        }}>
          <span style={{ color: 'var(--color-border)', marginRight: '0.2vw' }}>|</span>
          {subtitle}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Connection + Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.42vw', fontSize: '0.68vw' }}>
          <span style={{
            width: '0.42vw', height: '0.42vw', borderRadius: '50%',
            background: connected ? 'var(--color-green)' : 'var(--color-red)',
            display: 'inline-block',
            boxShadow: connected ? '0 0 0 2px #e6f7ee' : 'none',
          }} />
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {connected ? 'LIVE' : '연결 중...'}
          </span>
        </div>
        <Clock />
      </div>
    </header>
  );
}

function Clock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted || !now) {
    // Return empty placeholder with same min-width to prevent layout shift
    return <div style={{ textAlign: 'right', minWidth: '6vw' }} />;
  }

  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div style={{ textAlign: 'right', minWidth: '6vw' }}>
      <div style={{ fontSize: '1.15vw', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '0.63vw', color: 'var(--color-text-muted)', fontWeight: 500 }}>{dateStr}</div>
    </div>
  );
}
