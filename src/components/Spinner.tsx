import styles from './Spinner.module.css';

interface SpinnerProps {
  className?: string;
}

/** SPEC §11.8 — the 16px ring inside a loading button. Decorative. */
export function Spinner({ className }: SpinnerProps) {
  const classes = [styles.ring, className].filter(Boolean).join(' ');

  return <span className={classes} aria-hidden="true" />;
}
