import type { ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary';

type ButtonState = 'default' | 'hover' | 'pressed' | 'focus' | 'disabled' | 'loading';

interface ButtonProps {
  variant?: ButtonVariant;
  state?: ButtonState;
  children?: ReactNode;
}

/**
 * The state is driven by this prop map, not by `:hover` / `:active` /
 * `:focus-visible`. A story is then a plain set of props: the rendered look
 * does not depend on a pointer, on real focus, or on whether the headless
 * browser considers the document focused.
 */
const STATE_CLASS: Record<ButtonState, string> = {
  default: '',
  hover: styles.isHover,
  pressed: styles.isPressed,
  focus: styles.isFocus,
  disabled: styles.isDisabled,
  loading: styles.isLoading,
};

/** Figma `7:9376` / `111:1302` — 24px arc, 1.5px stroke, round cap, `currentColor`. */
function Spinner() {
  return (
    <svg
      className={styles.spinner}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22 12C22 13.9778 21.4135 15.9112 20.3147 17.5557C19.2159 19.2002 17.6541 20.4819 15.8268 21.2388C13.9996 21.9957 11.9889 22.1937 10.0491 21.8078C8.10929 21.422 6.32746 20.4696 4.92894 19.0711C3.53041 17.6725 2.578 15.8907 2.19215 13.9509C1.8063 12.0111 2.00433 10.0004 2.76121 8.17316C3.51809 6.3459 4.79981 4.78412 6.4443 3.6853C8.08879 2.58649 10.0222 2 12 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Button — Figma `7:4069`, size lg. Presentational mirror of the Style × State
 * variant matrix; it holds no state and takes no handlers.
 *
 * In the `loading` variant Figma drops the label entirely and centres the
 * spinner, so the label is kept for assistive tech only.
 */
export function Button({ variant = 'primary', state = 'default', children = 'Button' }: ButtonProps) {
  const isLoading = state === 'loading';
  const classes = [styles.button, styles[variant], STATE_CLASS[state]].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={state === 'disabled' || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading && <Spinner />}
      <span className={isLoading ? styles.srOnly : styles.label}>{children}</span>
    </button>
  );
}
