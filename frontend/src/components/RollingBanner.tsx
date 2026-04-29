'use client';
import { useBanner } from '@/hooks/useDashboard';
import { useEffect, useState } from 'react';

export default function RollingBanner() {
  const { banner } = useBanner();
  const [visible, setVisible] = useState(true);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!banner) return;
    setVisible(false);
    const t = setTimeout(() => {
      setDisplayText(banner.text);
      setVisible(true);
    }, 350);
    return () => clearTimeout(t);
  }, [banner]);

  const getAccentColor = () => {
    if (!banner) return 'var(--color-daangn)';
    if (banner.type === 'excellent_comment') return 'var(--color-green)';
    if (banner.type === 'five_star') return 'var(--color-yellow)';
    return 'var(--color-daangn)';
  };

  const accent = getAccentColor();
  const isDefaultText = !displayText;

  return (
    <div style={{
      width: '96.67vw',
      height: '9.17vw',
      margin: '0.83vw 1.67vw 1.25vw 1.67vw',
      borderRadius: '1.25vw',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0 4.17vw 0 17.71vw', /* padding to clear the mascot */
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#ff6f0f',
    }}>
      {/* Official Mascot Image perfectly preserved as an overlay without hallucination */}
      <img 
        src="/headset-mascot.png" 
        alt="Official CSAT Mascot"
        style={{
          position: 'absolute', top: 0, left: '2.6vw', height: '100%',
          objectFit: 'contain',
          zIndex: 1,
        }} 
      />

      {/* Content Container (Left-aligned, safe behind fade) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '1.25vw',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-10px)',
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '72.9vw', /* 1400px */
        textAlign: 'left',
        zIndex: 2,
      }}>
        {/* Simple decorative dot on the left side now */}
        {!isDefaultText && (
          <div style={{ 
            width: '0.625vw', height: '0.625vw', borderRadius: '50%', background: 'white', flexShrink: 0 
          }} />
        )}

        <div style={{
          fontSize: '2.0vw',
          fontWeight: 400, /* Regular weight for main body */
          color: '#ffffff',
          lineHeight: 1.5,
          letterSpacing: '-0.01em',
        }}>
          {(() => {
            if (isDefaultText) {
              return <><strong style={{ fontWeight: 800 }}>당근 서비스</strong>는 여러분의 따뜻한 상담을 응원합니다. 항상 감사합니다!</>;
            }
            const match = displayText.match(/^(.*?)에게 도착한 (.*)$/);
            if (match) {
              return (
                <>
                  <strong style={{ fontWeight: 800 }}>{match[1]}</strong>에게 도착한 {match[2]}
                </>
              );
            }
            return displayText;
          })()}
        </div>
      </div>
    </div>
  );
}
