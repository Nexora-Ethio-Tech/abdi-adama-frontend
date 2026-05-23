import { useEffect, useRef } from 'react';
import { useStore } from '../context/useStore';

/**
 * Custom hook to connect to SSE stream and listen for real-time updates
 * - NOTICE_DELETED: Removes a notice from the store
 */
export const useSSE = () => {
  const { deleteNotice } = useStore();
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('abdi_adama_token');
    if (!token) {
      console.warn('No auth token found; SSE not connected');
      return;
    }

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

    try {
      // Connect to SSE stream (pass token via query parameter since EventSource doesn't support headers)
      const sseUrl = `${API_URL}/api/driver/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(sseUrl);

      // Listen for notice deletion events
      eventSource.addEventListener('NOTICE_DELETED', (event: Event) => {
        const customEvent = event as MessageEvent;
        try {
          const payload = JSON.parse(customEvent.data);
          console.log('🗑️ [SSE] Notice deleted:', payload.id);
          deleteNotice(payload.id);
        } catch (err) {
          console.error('Failed to parse SSE deletion event:', err);
        }
      });

      // Listen for connection success
      eventSource.addEventListener('connected', (event: Event) => {
        const customEvent = event as MessageEvent;
        try {
          const payload = JSON.parse(customEvent.data);
          console.log('✅ [SSE] Connected to stream:', payload);
        } catch (err) {
          console.error('Failed to parse SSE connected event:', err);
        }
      });

      eventSource.onerror = () => {
        console.warn('⚠️ [SSE] Connection error or closed');
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource.close();
          sseRef.current = null;
        }
      };

      sseRef.current = eventSource;
    } catch (err) {
      console.error('Failed to connect to SSE stream:', err);
    }

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [deleteNotice]);

  return { sseConnected: !!sseRef.current };
};

