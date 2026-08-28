import { useEffect, useId, useRef, useState } from 'react';
import { COPY_FEEDBACK_MS } from '../constants';
import { formatDateTime } from '../lib/format';
import { Button } from './Button';
import { SummaryRow } from './SummaryRow';
import { CheckIcon, CopyIcon } from './icons';
import type { Order } from '../types';
import styles from './SuccessPanel.module.css';

type CopyState = 'idle' | 'copied' | 'failed';

interface SuccessPanelProps {
  order: Order;
  onDone: () => void;
  onAnnounce: (message: string) => void;
}

export function SuccessPanel({ order, onDone, onAnnounce }: SuccessPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const orderIdId = useId();

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
    <section className={styles.card}>
      <span className={styles.badge} aria-hidden="true">
        <CheckIcon className={styles.badgeIcon} />
      </span>

      <h2 ref={headingRef} className={styles.title} tabIndex={-1}>
        Exchange successful
      </h2>

      <p className={styles.summaryLine}>
        {order.from} → {order.to}
      </p>

      <div className={styles.rows}>
        <SummaryRow label="Order ID">
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
            {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
          </button>
          {copyState !== 'idle' && (
            <span
              className={copyState === 'copied' ? styles.copiedLabel : styles.failedLabel}
            >
              {copyState === 'copied' ? 'Copied' : 'Copy failed'}
            </span>
          )}
        </SummaryRow>
        <SummaryRow label="Execution date" value={formatDateTime(order.date)} />
        <SummaryRow label="Fee" value={order.feeText} />
      </div>

      <Button variant="primary" onClick={onDone}>
        Done
      </Button>
    </section>
  );
}
