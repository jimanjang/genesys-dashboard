import './LookerReport.css';

export default function LookerReport() {
  return (
    <div className="looker-report-container">
      <iframe 
        width="100%" 
        height="100%" 
        src="https://lookerstudio.google.com/embed/reporting/a38ef374-136b-4dbd-9984-42a09f97143e/page/p_2bvhsenw1d" 
        frameBorder="0" 
        style={{ border: 0 }} 
        allowFullScreen 
        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Looker Studio Analysis Report"
      ></iframe>
    </div>
  );
}
