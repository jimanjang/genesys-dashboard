'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useBanner } from '@/hooks/useDashboard';

// Define the FlowingBanner component for testing
function FlowingBannerTest({
  text,
  speed = 25,
  pauseOnHover = true,
  themeColor = '#ff6f0f',
}: {
  text: string;
  speed?: number;
  pauseOnHover?: boolean;
  themeColor?: string;
}) {
  const isDefaultText = !text;
  const displayText = text || '오늘도 우리 팀의 친절한 응대 덕분에 서비스가 빛나고 있어요! ✨';

  const formatText = (rawText: string) => {
    const match = rawText.match(/^(.*?)에게 도착한 (.*)$/);
    if (match) {
      return (
        <>
          <strong style={{ fontWeight: 800 }}>{match[1]}</strong>에게 도착한 {match[2]}
        </>
      );
    }
    return rawText;
  };

  // We repeat the item to ensure it spans at least the width of the screen.
  const renderListBlock = () => (
    <div className="marquee-list" style={{
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25vw',
          paddingRight: '8vw', // Generous space between repeated messages
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: '0.8vw',
            height: '0.8vw',
            borderRadius: '50%',
            background: 'white',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '1.8vw',
            fontWeight: 400,
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}>
            {formatText(displayText)}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      width: '96.67vw',
      height: '7.0vw',
      borderRadius: '1.25vw',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: themeColor,
      transition: 'background-color 0.3s ease',
    }}>
      {/* Dynamic keyframe injection */}
      <style>{`
        @keyframes flowMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .marquee-box:hover .marquee-list {
          animation-play-state: ${pauseOnHover ? 'paused' : 'running'};
        }
      `}</style>

      {/* Left Static Area: Mascot & Vertical Divider Line */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '16.5vw',
        display: 'flex',
        alignItems: 'center',
        zIndex: 4,
        backgroundColor: themeColor,
        transition: 'background-color 0.3s ease',
      }}>
        <img
          src="/headset-mascot.png"
          alt="Official CSAT Mascot"
          style={{
            height: '100%',
            objectFit: 'contain',
            marginLeft: '2.6vw',
          }}
        />
        
        {/* Elegant Vertical Divider Line */}
        <div style={{
          width: '2px',
          height: '3.5vw',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          marginLeft: 'auto',
          marginRight: '0.2vw',
          borderRadius: '1px',
        }} />
      </div>

      {/* Left side fade-in mask immediately after the divider */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '16.5vw',
        width: '4vw',
        height: '100%',
        background: `linear-gradient(to right, ${themeColor} 10%, transparent)`,
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Right side fade mask for smooth exit */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '6vw',
        height: '100%',
        background: `linear-gradient(to left, ${themeColor} 20%, transparent)`,
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Infinite Marquee Container - starts after the static left area */}
      <div className="marquee-box" style={{
        display: 'flex',
        flex: 1,
        height: '100%',
        alignItems: 'center',
        overflow: 'hidden',
        marginLeft: '16.5vw', // Perfectly aligned with the right edge of the static area
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          width: 'max-content',
        }}>
          {/* We place two identical blocks side-by-side. 
              The animation moves them to the left by exactly 100% of one block's width,
              creating a perfect, seamless infinite loop. */}
          <div style={{
            display: 'flex',
            animation: `flowMarquee ${speed}s linear infinite`,
          }}>
            {renderListBlock()}
            {renderListBlock()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Current static/fading banner style for comparison
function OriginalBannerDemo({ text, themeColor = '#ff6f0f' }) {
  const isDefaultText = !text;
  return (
    <div style={{
      width: '96.67vw',
      height: '7.0vw',
      borderRadius: '1.25vw',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0 4.17vw 0 17.71vw',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: themeColor,
      opacity: 0.85,
    }}>
      <img
        src="/headset-mascot.png"
        alt="Mascot"
        style={{
          position: 'absolute', top: 0, left: '2.6vw', height: '100%',
          objectFit: 'contain',
          zIndex: 1,
        }}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25vw',
        zIndex: 2,
      }}>
        {!isDefaultText && (
          <div style={{ width: '0.625vw', height: '0.625vw', borderRadius: '50%', background: 'white', flexShrink: 0 }} />
        )}
        <div style={{
          fontSize: '2.0vw',
          fontWeight: 400,
          color: '#ffffff',
          lineHeight: 1.5,
          wordBreak: 'keep-all',
        }}>
          {text || '오늘도 우리 팀의 친절한 응대 덕분에 서비스가 빛나고 있어요! ✨'}
        </div>
      </div>
    </div>
  );
}

export default function TestBannerPage() {
  const { banner } = useBanner();
  const [speed, setSpeed] = useState(25);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [customText, setCustomText] = useState('');
  const [bannerColor, setBannerColor] = useState('#ff6f0f');

  // Handle color selection depending on message type
  useEffect(() => {
    if (customText) return; // ignore real banner updates if custom text is active
    if (!banner) {
      setBannerColor('#ff6f0f');
      return;
    }
    if (banner.type === 'excellent_comment') {
      setBannerColor('var(--color-green)');
    } else if (banner.type === 'five_star') {
      setBannerColor('var(--color-yellow)');
    } else {
      setBannerColor('#ff6f0f');
    }
  }, [banner, customText]);

  const activeText = customText || (banner ? banner.text : '');

  return (
    <div id="dashboard-root" style={{ height: '100vh', overflowY: 'auto', background: '#f8f9fa' }}>
      <Header connected={true} />

      <main style={{
        flex: 1,
        padding: '2.5vw 4vw',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5vw',
        maxWidth: '1200px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {/* Title Panel */}
        <div style={{
          background: 'var(--color-surface)',
          padding: '2vw',
          borderRadius: '1.5vw',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border)',
        }}>
          <h1 style={{ fontSize: '2.2vw', fontWeight: 800, color: 'var(--color-daangn)', marginBottom: '0.8vw' }}>
            📢 실시간 흐르는 배너 (Marquee) 테스트 베드
          </h1>
          <p style={{ fontSize: '1.1vw', color: 'var(--color-text-sub)', lineHeight: 1.6 }}>
            현재 대시보드에 영향을 주지 않고, <strong>가로로 끊김 없이 물 흐르듯 흘러가는 무한 루프 배너(Tomato-Cheese Marquee)</strong>의 성능과 디자인을 테스트할 수 있는 독립 페이지입니다. 
            아래 컨트롤 패널에서 텍스트와 스피드를 조절하며 실시간으로 결과를 확인해 보세요.
          </p>
        </div>

        {/* Live Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vw' }}>
          <div>
            <h3 style={{ fontSize: '1.3vw', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.8vw' }}>
              ✨ [v1.5 프로토타입] 신규 흐르는 배너 (Marquee Style)
            </h3>
            <FlowingBannerTest
              text={activeText}
              speed={speed}
              pauseOnHover={pauseOnHover}
              themeColor={bannerColor}
            />
          </div>

          <div style={{ marginTop: '1vw' }}>
            <h3 style={{ fontSize: '1.3vw', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.8vw' }}>
              🔄 [비교용] 기존 서서히 나타나는 배너 (Static/Fade Style)
            </h3>
            <OriginalBannerDemo
              text={activeText}
              themeColor={bannerColor}
            />
          </div>
        </div>

        {/* Control Center */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '2vw',
          background: 'var(--color-surface)',
          padding: '2.5vw',
          borderRadius: '1.5vw',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)',
        }}>
          {/* Left: Input fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vw' }}>
            <h4 style={{ fontSize: '1.4vw', fontWeight: 700, color: 'var(--color-text)' }}>🎛️ 배너 문구 설정</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vw' }}>
              <label style={{ fontSize: '0.9vw', fontWeight: 600, color: 'var(--color-text-sub)' }}>
                테스트 텍스트 입력 (직접 수정 가능)
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="텍스트를 입력하면 실시간 반영됩니다. 비우면 Genesys 실시간 CSAT 시트 데이터를 가져옵니다."
                style={{
                  width: '100%',
                  height: '6vw',
                  padding: '1vw',
                  fontSize: '1vw',
                  borderRadius: '0.8vw',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'none',
                }}
              />
              <span style={{ fontSize: '0.8vw', color: 'var(--color-text-muted)' }}>
                💡 Tip: <code>"홍길동에게 도착한 별점 5점과 기분 좋은 한마디: 친절해요!"</code> 처럼 입력하시면 이름이 자동으로 굵게 표시됩니다.
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <span style={{ fontSize: '0.9vw', fontWeight: 600, color: 'var(--color-text-sub)', display: 'block', marginBottom: '0.5vw' }}>
                ⚡ 테스트 프리셋 문구
              </span>
              <div style={{ display: 'flex', gap: '0.5vw', flexWrap: 'wrap' }}>
                {[
                  { text: 'Asha에게 도착한 별점 5점과 기분 좋은 한마디: "덕분에 쉽게 해결되었어요 최고!" 🧡', color: 'var(--color-yellow)' },
                  { text: 'Binny에게 도착한 별점 5점과 기분 좋은 한마디: "너무 친절하고 명쾌하게 가이드를 주셔서 감사합니다" 🌟', color: 'var(--color-yellow)' },
                  { text: '오늘도 우리 팀의 친절한 응대 덕분에 서비스가 빛나고 있어요! ✨', color: '#ff6f0f' },
                  { text: '짧은 텍스트 테스트', color: '#ff6f0f' },
                  { text: '매우 긴 텍스트 테스트: 동해물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세 무궁화 삼천리 화려강산 대한사람 대한으로 길이 보전하세 남산 위에 저 소나무 철갑을 두른 듯 바람서리 불변함은 우리 기상일세', color: '#ff6f0f' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomText(item.text);
                      setBannerColor(item.color);
                    }}
                    style={{
                      padding: '0.5vw 0.8vw',
                      fontSize: '0.85vw',
                      borderRadius: '0.5vw',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-2)',
                      cursor: 'pointer',
                      color: 'var(--color-text-sub)',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--color-border)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface-2)';
                    }}
                  >
                    Preset {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCustomText('');
                    setBannerColor('#ff6f0f');
                  }}
                  style={{
                    padding: '0.5vw 0.8vw',
                    fontSize: '0.85vw',
                    borderRadius: '0.5vw',
                    border: '1px dashed var(--color-daangn)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-daangn)',
                    fontWeight: 600,
                  }}
                >
                  초기화 (실시간 연동)
                </button>
              </div>
            </div>
          </div>

          {/* Right: Marquee Speed and Pause settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vw', borderLeft: '1px solid var(--color-border)', paddingLeft: '2vw' }}>
            <h4 style={{ fontSize: '1.4vw', fontWeight: 700, color: 'var(--color-text)' }}>⚙️ 애니메이션 제어</h4>

            {/* Speed slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vw' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9vw', fontWeight: 600, color: 'var(--color-text-sub)' }}>
                  흐름 속도 (초 단위)
                </label>
                <span style={{ fontSize: '1vw', fontWeight: 700, color: 'var(--color-daangn)' }}>
                  {speed}초 (낮을수록 빠름)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: 'var(--color-daangn)',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8vw', color: 'var(--color-text-muted)' }}>
                <span>속도 빠름 (5s)</span>
                <span>속도 느림 (60s)</span>
              </div>
            </div>

            {/* Pause on hover */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1vw 0', borderBottom: '1px solid var(--color-border)', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.9vw', fontWeight: 600, color: 'var(--color-text)', display: 'block' }}>
                  마우스 오버 시 일시 정지 (Pause on Hover)
                </span>
                <span style={{ fontSize: '0.8vw', color: 'var(--color-text-muted)' }}>
                  마우스를 배너 위에 올리면 글자가 멈춥니다.
                </span>
              </div>
              <input
                type="checkbox"
                checked={pauseOnHover}
                onChange={(e) => setPauseOnHover(e.target.checked)}
                style={{
                  width: '1.6vw',
                  height: '1.6vw',
                  cursor: 'pointer',
                  accentColor: 'var(--color-daangn)',
                }}
              />
            </div>

            {/* Theme Colors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vw' }}>
              <span style={{ fontSize: '0.9vw', fontWeight: 600, color: 'var(--color-text-sub)' }}>
                배너 배경색 수동 변경
              </span>
              <div style={{ display: 'flex', gap: '0.8vw' }}>
                {[
                  { name: '기본 오렌지', value: '#ff6f0f' },
                  { name: '그린 (5점 댓글)', value: 'var(--color-green)' },
                  { name: '골드 (5점 일반)', value: 'var(--color-yellow)' },
                  { name: '딥 네이비', value: '#1a252f' },
                ].map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setBannerColor(color.value)}
                    style={{
                      flex: 1,
                      padding: '0.5vw',
                      fontSize: '0.8vw',
                      borderRadius: '0.4vw',
                      border: bannerColor === color.value ? '2px solid black' : '1px solid var(--color-border)',
                      background: color.value,
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Explanation */}
        <div style={{
          background: 'var(--color-surface)',
          padding: '2vw',
          borderRadius: '1.5vw',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border)',
          fontSize: '0.9vw',
          color: 'var(--color-text-sub)',
          lineHeight: 1.6,
        }}>
          <h4 style={{ fontSize: '1.2vw', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.8vw' }}>
            ℹ️ 무한 루프 Marquee 구현 기술적 세부사항
          </h4>
          <ul style={{ paddingLeft: '1.2vw', display: 'flex', flexDirection: 'column', gap: '0.4vw' }}>
            <li>
              <strong>완전 무중단 루프:</strong> 동일한 텍스트 묶음(Block)을 나란히 배치하고 CSS 3D 가속 애니메이션(<code>translateX(-100%)</code>)을 통해 한 세트가 완전히 넘어가면 즉시 0%로 리셋되도록 설계되어 끊어짐이 전혀 없습니다.
            </li>
            <li>
              <strong>CSS Only 가속:</strong> Javascript <code>setInterval</code>을 사용한 좌표 제어가 아닌 브라우저 GPU 가속을 유도하는 CSS3 Keyframe 방식을 채택하여 TV 월 등의 가동 환경에서도 지연이나 끊김 현상이 없습니다.
            </li>
            <li>
              <strong>Fixed Mascot & Gradient Mask:</strong> 배너 고유의 마스코트 이미지는 고정 레이어로 띄우고 그 옆에 배경색과 매칭되는 페이드아웃 그라데이션 레이어를 마운트하여, 흐르는 텍스트가 마스코트 뒤에서 부드럽게 나타나도록 고급스러운 시각 효과를 적용했습니다.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
