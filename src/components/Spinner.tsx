import styles from './Spinner.module.css';

interface SpinnerProps {
  className?: string;
}

/** SPEC §8.1 — 16px ring, decorative, static under prefers-reduced-motion. */
export function Spinner({ className }: SpinnerProps) {
  return <span className={className ? `${styles.spinner} ${className}` : styles.spinner} aria-hidden="true" />;
}
