import './AgentTable.css';

const STATUS_KO = {
  Available: '대화 가능',
  Interacting: '인터랙션 중',
  Communicating: '커뮤니케이션 중',
  Idle: '유휴',
  Other: '다른 작업',
  Offline: '오프라인',
};

export default function AgentTable({ agents = [] }) {
  const statusCounts = {
    available: agents.filter((a) => a.status === 'Available').length,
    idle: agents.filter((a) => a.status === 'Idle').length,
    interacting: agents.filter((a) => a.status === 'Interacting').length,
    communicating: agents.filter((a) => a.status === 'Communicating').length,
  };

  const formatDurationKo = (durationStr) => {
    if (!durationStr || durationStr === '00:00:00') return '0초';
    // Handle both HH:MM:SS and X분 Y초 if it somehow comes in different formats
    if (durationStr.includes('분') || durationStr.includes('초')) return durationStr;
    
    const [h, m, s] = durationStr.split(':').map(Number);
    const parts = [];
    if (h > 0) parts.push(`${h}시간`);
    if (m > 0) parts.push(`${m}분`);
    if (s > 0 || parts.length === 0) parts.push(`${s}초`);
    return parts.join(' ');
  };

  return (
    <div className="agent-table-container" id="agent-table">
      <div className="agent-table-header">
        <span className="agent-table-title">계정 상태</span>
      </div>

      <div className="agent-status-badges">
        <span className="badge available">{statusCounts.available} 대화 가능</span>
        <span className="badge idle">{statusCounts.idle} 유휴</span>
        <span className="badge interacting">{statusCounts.interacting} 인터랙션 중</span>
        <span className="badge communicating">{statusCounts.communicating} 커뮤니케이션 중</span>
      </div>

      <div className="agent-table-wrapper">
        {agents.length === 0 ? (
          <div className="no-agents">현재 큐에 상담원이 없습니다</div>
        ) : (
          <table className="agent-table">
            <thead>
              <tr>
                <th>상담원</th>
                <th>상태</th>
                <th>기간</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id || agent.name}>
                  <td>
                    <span className="agent-name">{agent.name}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${agent.status.toLowerCase()}`}>
                      <span className="status-dot"></span>
                      {STATUS_KO[agent.status] || agent.status}
                    </span>
                  </td>
                  <td>
                    <span className="agent-duration">
                      {formatDurationKo(agent.duration)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
