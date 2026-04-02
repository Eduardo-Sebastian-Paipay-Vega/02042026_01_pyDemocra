import { useEffect, useState } from 'react';

const MIN_INTERVAL_SECONDS = 10;

export function useNow(updateIntervalSeconds = 60): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const safeInterval = Math.max(MIN_INTERVAL_SECONDS, updateIntervalSeconds);
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, safeInterval * 1000);

    return () => window.clearInterval(timer);
  }, [updateIntervalSeconds]);

  return now;
}
