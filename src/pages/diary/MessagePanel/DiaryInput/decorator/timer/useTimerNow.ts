import { useEffect, useState } from 'react';

/** Refresh the displayed clock without writing a message every second. */
export const useTimerNow = (active: boolean): number => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [active]);

  return now;
};
