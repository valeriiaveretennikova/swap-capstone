import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_CONSECUTIVE_FAILURES, POLL_INTERVAL_MS } from '../constants';
import { fetchPrices } from '../lib/binance';
import type { Prices, RatesStatus, RingPhase, RingProgress } from '../types';

export interface PricesFeed {
  prices: Prices | null;
  status: RatesStatus;
  /** Cached prices are in use but the last attempt failed, or we are offline. */
  isStale: boolean;
  /** One-off fetch used by the confirm view's quote lock and the Retry buttons. */
  refresh: () => Promise<boolean>;
  /**
   * §8.1 — the poll timer for the rate ring. It is published from here, not
   * measured again in the view, so pauses, aborts and retries move the ring and
   * the poll together by construction.
   */
  ring: RingProgress;
}

function elapsedInWindow(startedAt: number): number {
  if (startedAt === 0) return 0;
  return Math.min(POLL_INTERVAL_MS, Math.max(0, Date.now() - startedAt));
}

function ringPhase(paused: boolean, status: RatesStatus): RingPhase {
  if (paused) return 'frozen';
  return status === 'loading' || status === 'refreshing' ? 'indeterminate' : 'filling';
}

/**
 * SPEC §8.1 — self-rescheduling `setTimeout` poll (never overlapping), 8 s abort.
 *
 * `paused` (confirm view, hidden tab, success view) gates only the *scheduling*
 * of the next iteration. The very first fetch is never gated: §8.1 pauses polling,
 * not the initial load, and `rate-loading` is a transient state (§6.1) with no
 * user-facing escape, so a tab that mounts already hidden must still load once.
 */
export function usePrices(paused: boolean): PricesFeed {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [status, setStatus] = useState<RatesStatus>('loading');
  const [failures, setFailures] = useState(0);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  /** Start of the current fill window — the timestamp `scheduleNext` counts from. */
  const [pollStartedAt, setPollStartedAt] = useState(0);
  const [phaseElapsedMs, setPhaseElapsedMs] = useState(0);

  const pricesRef = useRef<Prices | null>(null);
  const pollStartedAtRef = useRef(0);
  const failuresRef = useRef(0);
  const busyRef = useRef(false);
  /** True once a fetch has actually settled — abandoned attempts do not count. */
  const hasSettledFirstFetch = useRef(false);

  /** §8.1 — the ring's phase changes exactly here, so it is timed exactly here. */
  const markPhaseStart = useCallback(() => {
    setPhaseElapsedMs(elapsedInWindow(pollStartedAtRef.current));
  }, []);

  const applySuccess = useCallback((next: Prices) => {
    pricesRef.current = next;
    failuresRef.current = 0;
    hasSettledFirstFetch.current = true;
    setPrices(next);
    setFailures(0);
    setStatus('ready');
    markPhaseStart();
  }, [markPhaseStart]);

  const applyFailure = useCallback(() => {
    failuresRef.current += 1;
    hasSettledFirstFetch.current = true;
    setFailures(failuresRef.current);
    if (pricesRef.current === null || failuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
      pricesRef.current = null;
      setPrices(null);
    }
    setStatus('error');
    markPhaseStart();
  }, [markPhaseStart]);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setStatus(pricesRef.current === null ? 'loading' : 'refreshing');

    const controller = new AbortController();
    try {
      applySuccess(await fetchPrices(controller));
      return true;
    } catch {
      applyFailure();
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [applySuccess, applyFailure]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let controller: AbortController | null = null;

    // Measured from request start, so the cadence stays at 10 s even though the
    // next request is only scheduled once the previous one has settled.
    const scheduleNext = (startedAt: number) => {
      if (cancelled || paused) return;
      const delay = Math.max(0, POLL_INTERVAL_MS - (Date.now() - startedAt));
      timer = window.setTimeout(() => {
        void tick();
      }, delay);
    };

    const tick = async () => {
      const startedAt = Date.now();
      // One assignment for both the reschedule and the ring: they can never
      // describe two different deadlines.
      pollStartedAtRef.current = startedAt;
      setPollStartedAt(startedAt);

      if (busyRef.current) {
        scheduleNext(startedAt);
        return;
      }

      busyRef.current = true;
      setStatus(pricesRef.current === null ? 'loading' : 'refreshing');
      controller = new AbortController();

      try {
        const next = await fetchPrices(controller);
        if (!cancelled) applySuccess(next);
      } catch {
        if (!cancelled) applyFailure();
      } finally {
        controller = null;
        // An abandoned request must not release a newer request's guard or
        // schedule a stray timer — the cleanup below already released it.
        if (!cancelled) {
          busyRef.current = false;
          scheduleNext(startedAt);
        }
      }
    };

    if (!paused || !hasSettledFirstFetch.current) void tick();

    return () => {
      cancelled = true;
      if (controller) {
        controller.abort();
        controller = null;
        // Our own request is abandoned right now, so the next effect instance
        // (StrictMode remount, resume) can fetch immediately instead of waiting.
        busyRef.current = false;
      }
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [paused, applySuccess, applyFailure]);

  // Declared after the poll effect so the first window already exists here.
  useEffect(() => {
    if (!paused) return;
    markPhaseStart();
  }, [paused, markPhaseStart]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void refresh();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  return {
    prices,
    status,
    isStale: prices !== null && (failures >= 1 || isOffline),
    refresh,
    ring: {
      phase: ringPhase(paused, status),
      startedAt: pollStartedAt,
      elapsedMs: phaseElapsedMs,
      durationMs: POLL_INTERVAL_MS,
    },
  };
}
