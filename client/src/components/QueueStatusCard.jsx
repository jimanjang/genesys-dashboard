import './QueueStatusCard.css';

export default function QueueStatusCard({ queues, interactingOnly }) {
  const title = interactingOnly ? '상담중' : '상담가능';
  const subtitle = interactingOnly ? '인디렉션 중인 상담원' : '유휴 상담원';

  return (
    <div className="queue-status-card">
      <div className="queue-status-header">
        <span className="queue-status-title">{title}</span>
        <span className="queue-status-subtitle">{subtitle}</span>
      </div>
      <div className="queue-status-list">
        {queues.map(q => {
          // For available, we might approximate it or use 'agents - interacting' or something from backend. 
          // For now we assume: if interactingOnly, use interacting. If not, maybe use '0' or calculate it if known.
          // Since it's a demo mockup, we just use interacting for interacting, and for available, maybe Math.max(0, q.agents - q.interacting)
          const value = interactingOnly ? q.interacting : Math.max(0, (q.agents || 0) - (q.interacting || 0));
          
          return (
            <div key={q.id} className="queue-status-item">
              <span className="queue-status-name">{q.name}</span>
              <span className="queue-status-value">{value || '-'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
