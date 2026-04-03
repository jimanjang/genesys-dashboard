import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import './CSATToast.css';

const CSATToast = ({ alert, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      
      // Trigger confetti for 5-star ratings
      if (alert.score === 5) {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          // since particles fall down, start a bit higher than random
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }

      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 500); // Wait for exit animation
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="csat-toast-container"
          initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
          animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
          exit={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <div className="csat-toast-left">
            <motion.img 
              src="/images/daangn_bunny_headset.png" 
              alt="Daangn Mascot" 
              className="csat-bunny-img"
              initial={{ rotate: -20, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            />
          </div>
          <div className="csat-toast-right">
            <motion.div 
              className="csat-badge"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              칭찬 메시지가 도착했어요! 🥕
            </motion.div>
            <div className="csat-header">
              <span className="csat-agent-name">{alert.agentName}님</span>
              <span className="csat-score">⭐⭐⭐⭐⭐ {alert.score}점</span>
            </div>
            
            <motion.div 
              className="csat-comment"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              "{alert.comment}"
            </motion.div>

            <motion.div 
              className="csat-celebration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
                오늘도 동네를 따뜻하게 만들어주셔서 감사해요! ✨
            </motion.div>

            <div className="csat-progress-container">
              <motion.div 
                className="csat-progress-bar"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 10, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CSATToast;
