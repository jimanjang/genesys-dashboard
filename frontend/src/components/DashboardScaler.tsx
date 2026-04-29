'use client';
import { useEffect, useState, useRef } from 'react';

const BASE_W = 1920;
const BASE_H = 1080;

export default function DashboardScaler({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    function compute() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / BASE_W, vh / BASE_H);
      const offsetX = Math.round((vw - BASE_W * scale) / 2);
      const offsetY = Math.round((vh - BASE_H * scale) / 2);

      setStyle({
        width: BASE_W,
        height: BASE_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: offsetY,
        left: offsetX,
      });
    }

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        position: 'relative',
      }}
    >
      <div style={{ ...style, width: '100%', height: '100%', position: 'relative', top: 0, left: 0, transform: 'none' }}>
        {children}
      </div>
    </div>
  );
}
