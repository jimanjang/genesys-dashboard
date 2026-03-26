import './KpiCard.css';

export default function DualKpiCard({ title, label1, value1, label2, value2 }) {
  return (
    <div className="kpi-card dual">
      <div className="kpi-card-header">
        <span className="kpi-card-title">{title}</span>
      </div>
      <div className="kpi-card-body dual">
        <div className="dual-item">
          <span className="dual-label">{label1}</span>
          <span className="dual-value blue">{value1}</span>
        </div>
        <div className="dual-item">
          <span className="dual-label">{label2}</span>
          <span className="dual-value blue">{value2}</span>
        </div>
      </div>
    </div>
  );
}
