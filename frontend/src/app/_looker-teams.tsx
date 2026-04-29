'use client';
import Header from '@/components/Header';
import RollingBanner from '@/components/RollingBanner';
import LookerPlaceholder from '@/components/LookerPlaceholder';

function LookerOnlyPage({ teamName, iframeSrc, slideTitles }: { teamName: string; iframeSrc?: string | string[]; slideTitles?: string[] }) {
  return (
    <div id="dashboard-root">
      <Header />
      <main style={{
        flex: 1,
        width: '100%',
        padding: '1.25vw 1.67vw', // MATCHES PAY TEAM ALIGNMENT
        overflow: 'hidden',
        boxSizing: 'border-box',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          overflow: 'hidden',
          // Removed card styling for Looker reports to maximize view area
        }}>
          <LookerPlaceholder teamName={teamName} iframeSrc={iframeSrc} slideTitles={slideTitles} />
        </div>
      </main>
      <RollingBanner />
    </div>
  );
}

export function BizReviewPage() { 
  return (
    <LookerOnlyPage 
      teamName="사업심사팀" 
      iframeSrc={[
        "https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_5an3jenw1d",
        "https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_2bvhsenw1d"
      ]}
      slideTitles={['광고', '비즈']}
    />
  );
}

export function ExternalPage() { 
  return (
    <LookerOnlyPage 
      teamName="대외민원팀" 
      iframeSrc="https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_ubs3vbor2d" 
    />
  ); 
}

export function DisputePage()   { 
  return (
    <LookerOnlyPage 
      teamName="분쟁조정팀" 
      iframeSrc="https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_ewb190vw2d"
    />
  ); 
}

export function SecondhandPage(){ 
  return (
    <LookerOnlyPage 
      teamName="중고거래팀" 
      iframeSrc="https://datastudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_vdbm0mdq2d"
    />
  ); 
}
