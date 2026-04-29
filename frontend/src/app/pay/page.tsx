'use client';
import RealtimeDashboard from '@/components/RealtimeDashboard';

export default function PayDashboard() {
  return (
    <RealtimeDashboard
      teamId="pay"
      teamName="페이팀"
      totalRateLabel="당근페이 전체 응대율"
      queues={[
        { label: '일반내선', nameSearch: '당근 페이 관련 문의' },
        { label: '바로구매', nameSearch: '당근 페이_바로 구매 문의' },
        { label: '금융피해 신고센터', nameSearch: '당근페이 금융피해 신고센터' },
      ]}
      agentTitle="계정 상태 (페이)"
      mainQueueIndexes={[0]} // Combined answer rate uses ONLY the general line (당근 페이 관련 문의)
      hideOfflineAgents={true}
    />
  );
}
