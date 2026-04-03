import { useState, useEffect, useCallback } from 'react';

/**
 * WebSocket hook with auto-reconnect and HTTP polling fallback.
 */
export default function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [csatAlert, setCsatAlert] = useState(null);

  const connect = useCallback(() => {
    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = url || `${protocol}//${window.location.host}/ws`;

    let ws;
    let reconnectTimeout;
    let reconnectDelay = 1000;
    const MAX_RECONNECT_DELAY = 30000;

    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.warn('[WS] Failed to create WebSocket:', err);
      return null;
    }

    ws.onopen = () => {
      console.log('[WS] Connected');
      setIsConnected(true);
      reconnectDelay = 1000; // Reset backoff
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'update' && message.data) {
          setData(message.data);
          setLastUpdated(new Date());
        } else if (message.type === 'csat_alert') {
          setCsatAlert({ ...message.data, id: Date.now() });
        }
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected. Reconnecting in', reconnectDelay, 'ms');
      setIsConnected(false);

      // Exponential backoff reconnect
      reconnectTimeout = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
        connect();
      }, reconnectDelay);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };

    // Cleanup function
    ws._cleanup = () => {
      clearTimeout(reconnectTimeout);
      ws.onclose = null; // Prevent reconnect on intentional close
      ws.close();
    };

    return ws;
  }, [url]);

  useEffect(() => {
    const ws = connect();

    return () => {
      if (ws && ws._cleanup) {
        ws._cleanup();
      }
    };
  }, [connect]);

  // HTTP polling fallback when WebSocket is disconnected
  useEffect(() => {
    if (isConnected) return;

    const pollData = async () => {
      try {
        const res = await fetch('/api/dashboard/queues');
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('[Poll] Failed to fetch data:', err);
      }
    };

    // Initial fetch
    pollData();

    // Poll every 10 seconds as fallback
    const interval = setInterval(pollData, 10000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return { data, isConnected, lastUpdated, csatAlert };
}
