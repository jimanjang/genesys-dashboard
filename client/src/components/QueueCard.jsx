import './QueueCard.css';

export default function QueueCard({ queue, alertThreshold = 5 }) {
  const { name, waiting, interacting, agents, avgWait, longestWait } = queue;

  // Determine status color based on waiting calls
  const getStatus = () => {
    if (waiting >= alertThreshold) return 'red';
    if (waiting >= Math.ceil(alertThreshold * 0.6)) return 'yellow';
    return 'green';
  };

  const getStatusLabel = () => {
    const s = getStatus();
    if (s === 'red') return '과부하';
    if (s === 'yellow') return '주의';
    return '정상';
  };

  const status = getStatus();

  const formatWaitTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className={`queue-card status-${status}`} id={`queue-card-${queue.id}`}>
      <div className="queue-card-header">
        <span className="queue-card-name">{name}</span>
        <span className={`queue-card-badge ${status}`}>{getStatusLabel()}</span>
      </div>

      <div className="queue-card-metrics">
        <div className="metric">
          <span className="metric-label">대기</span>
          <span className="metric-value waiting">{waiting}</span>
        </div>
        <div className="metric">
          <span className="metric-label">상호작용</span>
          <span className="metric-value interacting">{interacting}</span>
        </div>
        <div className="metric">
          <span className="metric-label">상담원</span>
          <span className="metric-value agents">{agents}</span>
        </div>
      </div>

      <div className="queue-card-footer">
        <div className="footer-item">
          <span className="footer-label">평균 대기</span>
          <span className="footer-value">{formatWaitTime(avgWait)}</span>
        </div>
        <div className="footer-item">
          <span className="footer-label">최장 대기</span>
          <span className="footer-value">{longestWait || '--'}</span>
        </div>
      </div>
    </div>
  );
}
