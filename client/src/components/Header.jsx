import { useState, useRef, useEffect } from 'react';
import './Header.css';

export default function Header({ lastUpdated, isConnected, title, currentView, onViewChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuClick = (view) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };
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
        <div className="hamburger-container" ref={menuRef}>
          <button 
            className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          
          {isMenuOpen && (
            <nav className="nav-menu">
              <div className="nav-menu-header">대시보드 메뉴</div>
              <ul className="nav-menu-list">
                <li 
                  className={`nav-menu-item ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleMenuClick('dashboard')}
                >
                  <span className="nav-icon">📊</span>
                  <div className="nav-text">
                    <span className="nav-label">실시간 모니터링</span>
                    <span className="nav-sub">운영 지표 실시간 확인</span>
                  </div>
                </li>
                <li 
                  className={`nav-menu-item ${currentView === 'analysis' ? 'active' : ''}`}
                  onClick={() => handleMenuClick('analysis')}
                >
                  <span className="nav-icon">📈</span>
                  <div className="nav-text">
                    <span className="nav-label">데이터 분석</span>
                    <span className="nav-sub">Looker Studio 리포트</span>
                  </div>
                </li>
              </ul>
            </nav>
          )}
        </div>
        
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
