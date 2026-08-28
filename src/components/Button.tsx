import type { ReactNode, Ref } from 'react';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/** SPEC §11.8 — Button / Style=Primary | Secondary, size lg. */
export function Button({
  variant,
  children,
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  ariaLabel,
  className,
  ref,
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {loading && <Spinner />}
      <span>{children}</span>
    </button>
  );
}
