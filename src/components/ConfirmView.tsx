import { useCallback, useEffect, useRef, useState } from 'react';
import { ASSETS, MAX_CONFIRM_FAILURES, QUOTE_LOCK_SECONDS } from '../constants';
import { useCountdown } from '../hooks/useCountdown';
import { crossRate } from '../lib/exchange';
import { formatAmountWithTicker, formatClock, formatRateText } from '../lib/format';
import { Button } from './Button';
import { SummaryRow } from './SummaryRow';
import type { FormCore, Prices } from '../types';
import styles from './ConfirmView.module.css';

type QuotePhase = 'counting' | 'refreshing' | 'stalled';

interface ConfirmViewProps {
  core: FormCore;
  prices: Prices;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onRefresh: () => Promise<boolean>;
  onRateUpdated: () => void;
}

/**
 * SPEC §3.3 / §8.6 / RD-6 — the confirm step is a view swapped into the
 * exchange card. It is plain page content: nothing renders on top of the page
 * and no focus is captured, so it needs none of the machinery §14 forbids.
 */
export function ConfirmView({
  core,
  prices,
  isSubmitting,
  onBack,
  onConfirm,
  onRefresh,
  onRateUpdated,
}: ConfirmViewProps) {
  const [phase, setPhase] = useState<QuotePhase>('counting');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const failuresRef = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const { secondsLeft, restart } = useCountdown(
    QUOTE_LOCK_SECONDS,
    phase === 'counting' && !isSubmitting,
  );

  // §14 "View transitions" — focus moves to this view's heading on entry.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  /** SPEC §8.6 — pause, fetch, recalculate, restart. */
  const runRefreshCycle = useCallback(async () => {
    setPhase('refreshing');
    const succeeded = await onRefresh();

    if (succeeded) {
      failuresRef.current = 0;
      setRefreshFailed(false);
      onRateUpdated();
      restart();
      setPhase('counting');
      return;
    }

    failuresRef.current += 1;
    setRefreshFailed(true);

    if (failuresRef.current >= MAX_CONFIRM_FAILURES) {
      setPhase('stalled');
      return;
    }
    restart();
    setPhase('counting');
  }, [onRefresh, onRateUpdated, restart]);

  useEffect(() => {
    if (phase !== 'counting' || isSubmitting || secondsLeft > 0) return;
    void runRefreshCycle();
  }, [phase, isSubmitting, secondsLeft, runRefreshCycle]);

  const rate = crossRate(prices, core.sendAsset, core.receiveAsset);
  const isConfirmDisabled = isSubmitting || phase !== 'counting';

  const confirmLabel = isSubmitting
    ? 'Processing…'
    : phase === 'refreshing'
      ? 'Refreshing rate…'
      : phase === 'stalled'
        ? 'Rate unavailable'
        : `Confirm Exchange (${formatClock(secondsLeft)})`;

  return (
    <section className={styles.view}>
      <h1 ref={headingRef} className={styles.heading} tabIndex={-1}>
        Confirm Exchange
      </h1>

      <dl className={styles.summary}>
        <SummaryRow
          label="From"
          asset={core.sendAsset}
          value={formatAmountWithTicker(core.sendRaw, core.sendAsset)}
        />
        <SummaryRow
          label="To"
          asset={core.receiveAsset}
          value={formatAmountWithTicker(core.receiveRaw, core.receiveAsset)}
        />
        <SummaryRow
          label="Exchange rate"
          value={formatRateText(rate, core.sendAsset, core.receiveAsset)}
        />
        <SummaryRow label="Service fee" value={`0 ${ASSETS[core.receiveAsset].ticker}`} />
      </dl>

      {refreshFailed && (
        <p className={styles.notice}>Could not refresh rate, using last known rate</p>
      )}

      {phase === 'stalled' && (
        <button type="button" className={styles.retry} onClick={() => void runRefreshCycle()}>
          Retry
        </button>
      )}

      {/* §11.8 — stacked at every viewport: Confirm on top, Back below. */}
      <div className={styles.actions}>
        <Button
          variant="primary"
          disabled={isConfirmDisabled}
          loading={isSubmitting}
          aria-label="Confirm exchange"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" disabled={isSubmitting} onClick={onBack}>
          Back
        </Button>
      </div>
    </section>
  );
}
