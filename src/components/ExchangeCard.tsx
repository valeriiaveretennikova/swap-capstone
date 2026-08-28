import type { ReactNode } from 'react';
import type { View } from '../types';
import styles from './ExchangeCard.module.css';

interface ExchangeCardProps {
  view: View;
  children: ReactNode;
}

/**
 * SPEC §3.0 / §11.8a — one 460x480 card for all three views. The box never
 * animates; only its contents cross-fade (§12), which is why the fade lives on
 * the inner layer keyed by `view`.
 */
export function ExchangeCard({ view, children }: ExchangeCardProps) {
  return (
    <div className={styles.card}>
      <div key={view} className={styles.body}>
        {children}
      </div>
    </div>
  );
}
