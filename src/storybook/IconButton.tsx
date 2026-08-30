import type { ReactNode } from 'react';
import { ExchangeGlyph } from './glyphs';
import styles from './IconButton.module.css';

export type IconButtonState = 'default' | 'hover' | 'pressed' | 'focus' | 'disabled';

interface IconButtonProps {
  /** Figma `State` axis. The look comes from this prop, never from a pseudo-class. */
  state?: IconButtonState;
  /** Icon slot, rendered at 20x20 in the current state colour. */
  children?: ReactNode;
  'aria-label': string;
}

const stateClass: Record<IconButtonState, string> = {
  default: '',
  hover: styles.buttonHover,
  pressed: styles.buttonPressed,
  focus: styles.buttonFocus,
  disabled: styles.buttonDisabled,
};

/**
 * Figma `7:9618` — Icon Button / Style=Primary, 40x40 circular.
 * Presentational only: no state, no handlers. Every visual state is a class,
 * so a story is a pure set of props and its snapshot is deterministic.
 */
export function IconButton({
  state = 'default',
  children,
  'aria-label': ariaLabel,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${stateClass[state]}`.trimEnd()}
      aria-label={ariaLabel}
      disabled={state === 'disabled'}
    >
      {children ?? <ExchangeGlyph />}
    </button>
  );
}
