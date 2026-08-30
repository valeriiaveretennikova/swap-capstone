import type { ReactNode } from 'react';
import styles from './ChipButton.module.css';

export type ChipButtonState = 'default' | 'hover' | 'pressed' | 'focus' | 'disabled';

interface ChipButtonProps {
  /** Figma `State` axis. The look comes from this prop, never from a pseudo-class. */
  state?: ChipButtonState;
  children: ReactNode;
}

const stateClass: Record<ChipButtonState, string> = {
  default: '',
  hover: styles.chipHover,
  pressed: styles.chipPressed,
  focus: styles.chipFocus,
  disabled: styles.chipDisabled,
};

/**
 * Figma `77:3399` — Chip Button, a 28x16 text pill (`MAX`).
 * Presentational only: no state, no handlers. Every visual state is a class,
 * so a story is a pure set of props and its snapshot is deterministic.
 */
export function ChipButton({ state = 'default', children }: ChipButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${stateClass[state]}`.trimEnd()}
      disabled={state === 'disabled'}
    >
      {children}
    </button>
  );
}
