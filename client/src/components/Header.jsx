import './Header.css';

export default function Header({ lastUpdated, isConnected, title }) {
  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRelativeTime = (date) => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return '방금 전';
    if (seconds < 60) return `${seconds}초 전`;
    return `${Math.floor(seconds / 60)}분 전`;
  };

  return (
    <header className="header" id="dashboard-header">
      <div className="header-left">
        <button className="back-btn" aria-label="Go back">&lt;</button>
        <img 
          src="/karrot-logo.png" 
          alt="당근 서비스 워크" 
          className="karrot-logo-img"
        />
        <h1 className="header-title">{title || '대시보드'}</h1>
      </div>
      <div className="header-right">
        <div className="header-meta">
          <span className="header-timestamp">
            마지막 업데이트: {formatTime(lastUpdated)} ({getRelativeTime(lastUpdated)})
          </span>
          <span className="header-connection">
            <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'WebSocket 연결됨' : '폴링 모드'}
          </span>
        </div>
      </div>
    </header>
  );
}
