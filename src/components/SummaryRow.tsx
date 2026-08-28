import type { ReactNode } from 'react';
import { CoinIcon } from './CoinIcon';
import type { Asset } from '../types';
import styles from './SummaryRow.module.css';

/** §11.10 — summary rows carry the coin icon at 22px. */
const ICON_SIZE = 22;

interface SummaryRowProps {
  label: string;
  value?: string;
  /** Only the confirm `From` / `To` rows show a coin icon before the amount. */
  asset?: Asset;
  children?: ReactNode;
}

/** SPEC §11.11a / §14 — a `dt` / `dd` pair, no divider line. */
export function SummaryRow({ label, value, asset, children }: SummaryRowProps) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>
        {asset && <CoinIcon asset={asset} size={ICON_SIZE} />}
        {value}
        {children}
      </dd>
    </div>
  );
}
