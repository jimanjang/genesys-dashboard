import './AlertBanner.css';

export default function AlertBanner({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alert-banner" id="alert-banner">
      {alerts.map((alert, index) => (
        <div className="alert-item" key={index}>
          <span className="alert-icon">🚨</span>
          <div className="alert-content">
            <div>
              <div className="alert-message">
                {alert.queueName} — 대기열 과부하
              </div>
              <div className="alert-detail">
                {alert.waiting}건 대기 중 (임계값: {alert.threshold})
              </div>
            </div>
            <span className="alert-count">{alert.waiting}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
