import styles from './SummaryRow.module.css';

interface SummaryRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
}

/** Figma `Summary Row` — label left, value right. */
export function SummaryRow({ label, value, children }: SummaryRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {children}
      </span>
    </div>
  );
}
