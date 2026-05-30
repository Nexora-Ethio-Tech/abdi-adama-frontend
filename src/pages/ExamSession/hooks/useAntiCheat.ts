import { useEffect, useState, useCallback, useRef } from 'react';
import { reportViolation, terminateExam } from '../../../services/examService';

interface AntiCheatOptions {
  examId: string;
  enabled: boolean;
  onWarning: (count: number, type: string) => void;
  onTerminate: () => void;
}

export const useAntiCheat = ({ examId, enabled, onWarning, onTerminate }: AntiCheatOptions) => {
  const [warningCount, setWarningCount] = useState(0);
  const lastViolationRef = useRef(0);
  const terminatedRef = useRef(false);

  const handleViolation = useCallback(async (type: string) => {
    if (!enabled || terminatedRef.current) return;

    const now = Date.now();
    // Debounce: ignore violations within 2s of each other
    if (now - lastViolationRef.current < 2000) return;
    lastViolationRef.current = now;

    try {
      // Report to backend – backend is source of truth for count
      const serverCount = await reportViolation(examId);

      setWarningCount(serverCount);

      if (serverCount >= 3) {
        terminatedRef.current = true;
        try { await terminateExam(examId, 'violation_limit'); } catch { /* best effort */ }
        onTerminate();
      } else {
        onWarning(serverCount, type);
      }
    } catch {
      // Fallback: local tracking
      setWarningCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
          terminatedRef.current = true;
          terminateExam(examId, 'violation_limit').catch(() => {});
          onTerminate();
        } else {
          onWarning(next, type);
        }
        return next;
      });
    }
  }, [examId, enabled, onWarning, onTerminate]);

  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleViolation('Fullscreen Exit');
    };
    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation('Tab Switch');
    };
    const handleBlur = () => {
      handleViolation('Window Blur');
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && (e.key === 'c' || e.key === 'v' || e.key === 'p')) {
        e.preventDefault();
        handleViolation('Restricted Key');
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        handleViolation('Print Screen');
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled, handleViolation]);

  const requestFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return { warningCount, requestFullscreen, exitFullscreen };
};
