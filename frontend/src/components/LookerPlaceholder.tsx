'use client';
import React, { useEffect, useRef, useState } from 'react';

// 5분마다 갱신될 key 생성 (전체화면 유지, 페이지 리로드 없음)
function getHourlyKey() {
  const now = new Date();
  const min5 = Math.floor(now.getMinutes() / 5);
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${min5}`;
}

export default function LookerPlaceholder({ teamName, iframeSrc, slideTitles }: { teamName: string; iframeSrc?: string | string[], slideTitles?: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(getHourlyKey);

  // 정각 시각에 맞춰 iframe만 조용히 갱신 (전체화면 영향 없음)
  useEffect(() => {
    const checkHourChange = setInterval(() => {
      const newKey = getHourlyKey();
      setIframeKey((prev) => prev !== newKey ? newKey : prev);
    }, 60 * 1000); // 1분마다 체크하여 정각 감지
    return () => clearInterval(checkHourChange);
  }, []);

  const sources = Array.isArray(iframeSrc) ? iframeSrc : (iframeSrc ? [iframeSrc] : []);

  // Slideshow Logic & Dispatch slide title
  useEffect(() => {
    // Announce the initial or single slide title if it exists
    const currentTitle = slideTitles?.[currentIndex] || '';
    window.dispatchEvent(new CustomEvent('slide-update', { detail: currentTitle }));

    if (sources.length <= 1) return;
    const idx = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sources.length);
    }, 10000); // 10 seconds per slide
    return () => clearInterval(idx);
  }, [sources.length, currentIndex, slideTitles]);

  if (sources.length > 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Optional padding to align with header/banner margins if desired,
          // but we leave it flush to fill the flex container.
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            {sources.map((src, idx) => (
            <iframe
              key={`${iframeKey}-${src}`}
              src={`${src}${src.includes('?') ? '&' : '?'}displayMode=RESIZE_TO_FIT`}
              scrolling="no"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                opacity: currentIndex === idx ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                pointerEvents: currentIndex === idx ? 'auto' : 'none',
                zIndex: currentIndex === idx ? 2 : 1,
              }}
              title={`${teamName} - Slide ${idx + 1}`}
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          ))}
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for teams without source
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f8f5',
      gap: 24,
    }}>
      <div style={{
        width: 80, height: 80,
        borderRadius: 20,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}>
        🛠️
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.02em' }}>
          {teamName} — 데이터 연동 작업 중입니다
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.8, fontWeight: 400 }}>
          Looker Studio 대시보드가 준비 중입니다.<br />
          작업이 완료되면 이 화면이 자동으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
