import './LookerReport.css';

export default function LookerReport() {
  return (
    <div className="looker-report-container">
      <iframe 
        width="100%" 
        height="100%" 
        src="https://lookerstudio.google.com/embed/reporting/2eadfa4e-6c81-495e-b907-0ffbcd6af400/page/Q6LrF" 
        frameBorder="0" 
        style={{ border: 0 }} 
        allowFullScreen 
        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Looker Studio Analysis Report"
      ></iframe>
    </div>
  );
}
