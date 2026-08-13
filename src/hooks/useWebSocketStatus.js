import { useState, useEffect, useRef } from 'react';

export function useWebSocketStatus() {
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      if (isMounted) setStatus('connecting');

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/health`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isMounted) setStatus('connected');
        };

        ws.onclose = () => {
          if (isMounted) {
            setStatus('disconnected');
            // Attempt auto-reconnect after 3s
            reconnectTimerRef.current = window.setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          if (isMounted) setStatus('disconnected');
        };

        wsRef.current = ws;
      } catch (err) {
        if (isMounted) setStatus('disconnected');
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return status;
}
