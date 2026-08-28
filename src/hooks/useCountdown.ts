import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 250;

export interface Countdown {
  secondsLeft: number;
  restart: () => void;
}

/**
 * Counts down to 0 and stops. The remaining time is always recomputed from
 * `Date.now()`, so a throttled background tab cannot make the timer drift (E12).
 */
export function useCountdown(seconds: number, running: boolean): Countdown {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const deadlineRef = useRef(0);

  const restart = useCallback(() => {
    deadlineRef.current = Date.now() + seconds * 1000;
    setSecondsLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    if (deadlineRef.current === 0) deadlineRef.current = Date.now() + seconds * 1000;

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    };

    tick();
    const interval = window.setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running, seconds]);

  return { secondsLeft, restart };
}
