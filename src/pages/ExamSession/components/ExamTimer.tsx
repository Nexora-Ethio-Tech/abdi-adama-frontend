import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  endTime: number;
  onTimeUp: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ endTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState<number>(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(interval); onTimeUp(); }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, onTimeUp]);

  const totalSeconds = Math.floor(timeLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (v: number) => v < 10 ? '0' + v : String(v);
  const formatted = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  const isLow = timeLeft < 300000; // 5 min
  const isCritical = timeLeft < 60000; // 1 min

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-black text-sm border transition-colors ${
      isCritical
        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse'
        : isLow
          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
    }`}>
      <Clock size={14} />
      {formatted}
    </div>
  );
};
