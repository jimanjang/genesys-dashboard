import { useState, useEffect } from 'react';
import useWebSocket from './hooks/useWebSocket';
import Header from './components/Header';
import KpiCard from './components/KpiCard';
import DualKpiCard from './components/DualKpiCard';
import QueueStatusCard from './components/QueueStatusCard';
import AgentTable from './components/AgentTable';
import AlertBanner from './components/AlertBanner';
import LookerReport from './components/LookerReport';

export default function App() {
  const { data, isConnected, lastUpdated } = useWebSocket();
  const [queues, setQueues] = useState([]);
  const [agents, setAgents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [updateTime, setUpdateTime] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'analysis'

  useEffect(() => {
    if (data) {
      setQueues(data.queues || []);
      setAgents(data.agents || []);
      setAlerts(data.alerts || []);
      if (data.alertThreshold) {
        setAlertThreshold(data.alertThreshold);
      }
      setUpdateTime(lastUpdated);
    }
  }, [data, lastUpdated]);

  // Force re-render every second to update relative timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate totals for new KPI cards based on strict widget constraints
  const kpiQueues = queues.filter(q => 
    q.name === "당근 비즈니스센터_광고 노출/성과" || 
    q.name === "당근 비즈니스센터_신규 광고 신청"
  );

  const totalWaiting = kpiQueues.reduce((sum, q) => sum + (q.waiting || 0), 0);
  const totalOffered = kpiQueues.reduce((sum, q) => sum + (q.daily?.offered || 0), 0);
  const totalAnswered = kpiQueues.reduce((sum, q) => sum + (q.daily?.answered || 0), 0);
  const totalAbandoned = kpiQueues.reduce((sum, q) => sum + (q.daily?.abandon || 0), 0);
  
  const answerRate = totalOffered > 0 ? ((totalAnswered / totalOffered) * 100).toFixed(1) + '%' : '-';

  return (
    <div className="dashboard" id="dashboard-root">
      <Header lastUpdated={updateTime} isConnected={isConnected} title="광고_사업팀 운영 대시보드" />

      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => setView('dashboard')}
        >
          실시간 모니터링
        </button>
        <button 
          className={`nav-tab ${view === 'analysis' ? 'active' : ''}`}
          onClick={() => setView('analysis')}
        >
          데이터 분석 (Looker Studio)
        </button>
      </nav>

      {view === 'dashboard' ? (
        <>
          <AlertBanner alerts={alerts} />
          <div className="dashboard-content">
            <div className="kpi-grid">
              <KpiCard title="응답률" subtitle="오늘" value={answerRate} />
              <KpiCard title="대기호" value={totalWaiting} valueClass="blue" />
              <KpiCard title="포기호" subtitle="오늘" value={totalAbandoned || '-'} />
              
              <DualKpiCard 
                title="응답/인입호 오늘"
                label1="응답" value1={totalAnswered || '-'}
                label2="인입" value2={totalOffered || '-'}
              />
              <QueueStatusCard queues={queues} interactingOnly={true} />
              <QueueStatusCard queues={queues} interactingOnly={false} />
            </div>

            <div className="agent-section">
              <AgentTable agents={agents} />
            </div>
          </div>
        </>
      ) : (
        <LookerReport />
      )}
    </div>
  );
}
