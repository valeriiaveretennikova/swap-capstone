import { ImportantIcon } from './icons';
import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  id: string;
  variant: 'insufficient-funds' | 'rate-error';
  onRetry?: () => void;
}

const MESSAGES: Record<ErrorBannerProps['variant'], string> = {
  'insufficient-funds': 'There are insufficient funds in your account. Please top up your balance.',
  'rate-error': 'Unable to load exchange rates. Check your connection and try again.',
};

/** SPEC §6.1 — role="alert", rendered and unrendered (never hidden). */
export function ErrorBanner({ id, variant, onRetry }: ErrorBannerProps) {
  return (
    <div id={id} className={styles.banner} role="alert">
      <ImportantIcon className={styles.icon} />
      <p className={styles.text}>
        {MESSAGES[variant]}
        {onRetry && (
          <button type="button" className={styles.retry} onClick={onRetry}>
            Retry
          </button>
        )}
      </p>
    </div>
  );
}
