import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { ASSETS, MAX_MODAL_FAILURES, QUOTE_LOCK_SECONDS } from '../constants';
import { useCountdown } from '../hooks/useCountdown';
import { crossRate } from '../lib/exchange';
import { formatAmountWithTicker, formatClock, formatRateText } from '../lib/format';
import { Button } from './Button';
import { SummaryRow } from './SummaryRow';
import type { FormCore, Prices } from '../types';
import styles from './ConfirmModal.module.css';

type QuotePhase = 'counting' | 'refreshing' | 'stalled';

interface ConfirmModalProps {
  core: FormCore;
  prices: Prices;
  isSubmitting: boolean;
  /** Page content that gets `inert` while the dialog is open. */
  backgroundRef: RefObject<HTMLElement | null>;
  onBack: () => void;
  onConfirm: () => void;
  onRefresh: () => Promise<boolean>;
  onRateUpdated: () => void;
}

const FOCUSABLE = 'button:not([disabled])';

export function ConfirmModal({
  core,
  prices,
  isSubmitting,
  backgroundRef,
  onBack,
  onConfirm,
  onRefresh,
  onRateUpdated,
}: ConfirmModalProps) {
  const [phase, setPhase] = useState<QuotePhase>('counting');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const failuresRef = useRef(0);

  const titleId = useId();
  const summaryId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const { secondsLeft, restart } = useCountdown(
    QUOTE_LOCK_SECONDS,
    phase === 'counting' && !isSubmitting,
  );

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

    if (failuresRef.current >= MAX_MODAL_FAILURES) {
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

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const background = backgroundRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    background?.setAttribute('inert', '');
    background?.setAttribute('aria-hidden', 'true');

    return () => {
      document.body.style.overflow = previousOverflow;
      background?.removeAttribute('inert');
      background?.removeAttribute('aria-hidden');
    };
  }, [backgroundRef]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
      return;
    }
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const index = active ? focusables.indexOf(active) : -1;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (index === -1) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (!event.shiftKey && index === focusables.length - 1) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && index === 0) {
      event.preventDefault();
      last.focus();
    }
  };

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
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onBack();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={summaryId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          Confirm exchange
        </h2>

        <div id={summaryId} className={styles.summary}>
          <SummaryRow label="From" value={formatAmountWithTicker(core.sendRaw, core.sendAsset)} />
          <SummaryRow label="To" value={formatAmountWithTicker(core.receiveRaw, core.receiveAsset)} />
          <div className={styles.divider} />
          <SummaryRow
            label="Exchange rate"
            value={formatRateText(rate, core.sendAsset, core.receiveAsset)}
          />
          <SummaryRow label="Service fee" value={`0 ${ASSETS[core.receiveAsset].ticker}`} />
        </div>

        {refreshFailed && (
          <p className={styles.warning}>Could not refresh rate, using last known rate</p>
        )}

        {phase === 'stalled' && (
          <button type="button" className={styles.retry} onClick={() => void runRefreshCycle()}>
            Retry
          </button>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" disabled={isSubmitting} onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            disabled={isConfirmDisabled}
            loading={isSubmitting}
            onClick={onConfirm}
            ariaLabel="Confirm exchange"
          >
            <span aria-live="off">{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
