import './KpiCard.css';

export default function KpiCard({ title, subtitle, value, valueClass }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <span className="kpi-card-title">{title}</span>
        {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
      </div>
      <div className="kpi-card-body">
        <span className={`kpi-card-value ${valueClass || ''}`}>{value !== null && value !== undefined && String(value) !== 'NaN' ? value : '-'}</span>
      </div>
    </div>
  );
}
