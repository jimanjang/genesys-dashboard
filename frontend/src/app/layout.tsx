import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DashboardScaler from '@/components/DashboardScaler';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '당근서비스 실시간 운영 대시보드',
  description: '당근서비스 팀별 실시간 운영 모니터링 대시보드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <DashboardScaler>
          {children}
        </DashboardScaler>
      </body>
    </html>
  );
}
