import { useEffect, useId, useRef, useState } from 'react';
import { COPY_FEEDBACK_MS } from '../constants';
import { formatDateTime } from '../lib/format';
import { Button } from './Button';
import { SummaryRow } from './SummaryRow';
import { CheckIcon, CopyIcon } from './icons';
import { SuccessIcon } from './SuccessIcon';
import type { Order } from '../types';
import styles from './SuccessView.module.css';

type CopyState = 'idle' | 'copied' | 'failed';

/** §11.11 — the success mark is 96x96 in the design. */
const SUCCESS_ICON_SIZE = 96;

interface SuccessViewProps {
  order: Order;
  onDone: () => void;
  onAnnounce: (message: string) => void;
}

/** SPEC §3.4 / §8.7 — the third view of the same card. */
export function SuccessView({ order, onDone, onAnnounce }: SuccessViewProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const orderIdId = useId();

  // §14 "View transitions" — focus moves to this view's heading on entry.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  /** E14 — a blocked clipboard must never surface an exception. */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopyState('copied');
      onAnnounce('Order ID copied');
    } catch {
      setCopyState('failed');
      onAnnounce('Copy failed');
    }
  };

  return (
    <section className={styles.view}>
      <SuccessIcon size={SUCCESS_ICON_SIZE} className={styles.successIcon} />

      <h1 ref={headingRef} className={styles.heading} tabIndex={-1}>
        Exchange Successful
      </h1>

      <dl className={styles.summary}>
        <SummaryRow label="Order ID">
          <span className={styles.orderIdGroup}>
            <span id={orderIdId} className={styles.orderId}>
              {order.id}
            </span>
            <button
              type="button"
              className={styles.copyButton}
              aria-label="Copy order ID"
              aria-describedby={orderIdId}
              onClick={() => void handleCopy()}
            >
              {copyState === 'copied' ? (
                <CheckIcon className={styles.copyIcon} />
              ) : (
                <CopyIcon className={styles.copyIcon} />
              )}
            </button>
            {copyState !== 'idle' && (
              <span className={copyState === 'copied' ? styles.copiedLabel : styles.failedLabel}>
                {copyState === 'copied' ? 'Copied' : 'Copy failed'}
              </span>
            )}
          </span>
        </SummaryRow>
        <SummaryRow label="Execution date" value={formatDateTime(order.date)} />
        <SummaryRow label="Fee" value={order.feeText} />
      </dl>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onDone}>
          Done
        </Button>
      </div>
    </section>
  );
}
