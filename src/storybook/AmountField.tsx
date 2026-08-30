import { useId } from 'react';
// Read-only glyphs from the frozen app tree — no SVG is duplicated here.
import { CoinIcon } from '../components/CoinIcon';
import { ChevronIcon, WalletIcon } from '../components/icons';
import { DropdownItem } from './DropdownItem';
import { ChipButton } from './ChipButton';
import styles from './AmountField.module.css';

export type AmountFieldState =
  | 'default'
  | 'hover'
  | 'focusVisible'
  | 'focusInput'
  | 'focusSelectOpen'
  | 'filled'
  | 'disabled'
  | 'error';

/** The six assets of the Figma library. Declared here so nothing outside the
 *  icons has to be imported from the frozen `src/components` tree. */
export type AssetTicker = 'BTC' | 'ETH' | 'USDC' | 'SOL' | 'XRP' | 'TRX';

export interface AmountFieldProps {
  /** Figma `State` variant axis. Every look is a class, never a pseudo-class. */
  state?: AmountFieldState;
  /** Field label — Figma `104:779`. */
  label?: string;
  /** Available balance, already formatted — Figma `I104:780;79:593`. */
  balance?: string;
  /** Selected asset: drives the ticker and the coin glyph. */
  ticker?: AssetTicker;
  /** Typed amount. Empty means the placeholder shows instead. */
  value?: string;
  /** Shown while `value` is empty — Figma `104:784`, SPEC §9.2. */
  placeholder?: string;
  /** Text under the card. Empty means the helper slot is not rendered. */
  helperText?: string;
}

const STATE_CLASS: Record<AmountFieldState, string> = {
  // `default`, `filled` and `focusInput` need no card modifier: `default` is the
  // base rule, `filled` only differs by the `value` it is given, and the focus
  // border rule below is keyed on `focusInput` itself.
  default: '',
  hover: styles.hover,
  focusVisible: styles.focusVisible,
  focusInput: styles.focusInput,
  focusSelectOpen: styles.focusSelectOpen,
  filled: '',
  disabled: styles.disabled,
  error: styles.error,
};

/** Figma `86:1081` dropdown_list — the six assets in the order the design lists
 *  them, with `USDC` marked as the selected row. */
const OPTIONS: { ticker: AssetTicker; name: string }[] = [
  { ticker: 'BTC', name: 'Bitcoin' },
  { ticker: 'ETH', name: 'Ethereum' },
  { ticker: 'USDC', name: 'USD Coin' },
  { ticker: 'XRP', name: 'Ripple' },
  { ticker: 'SOL', name: 'Solana' },
  { ticker: 'TRX', name: 'Tron' },
];

/**
 * Figma `86:1040` — Amount Field, `380 × 102` (`380 × 84` without the helper).
 *
 * Presentational only: no state, no handlers, no logic, no validation. The
 * visual state is the `state` prop, so a story is a fixed set of props and its
 * snapshot depends neither on a real pointer, nor on a real focus, nor on the
 * document having focus at all. The caret of `focusInput` is drawn statically
 * for the same reason.
 *
 * The value is a text node rather than an `<input>`, exactly as Figma draws it:
 * a real input would either blink a caret or need real focus to show one. The
 * card is therefore a labelled `group`, which is what carries the label and the
 * helper text to assistive technology here. The shipped app keeps the real
 * input — this file is the library replica.
 */
export function AmountField({
  state = 'default',
  label = 'You send',
  balance = 'XX,XXX,XXX.XX USDC',
  ticker = 'USDC',
  value = '',
  placeholder = '≥0.01',
  helperText = 'Helper text',
}: AmountFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const helperId = `${id}-helper`;

  const isDisabled = state === 'disabled';
  const isOpen = state === 'focusSelectOpen';
  const className = [styles.field, STATE_CLASS[state]].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={helperText ? helperId : undefined}
        aria-disabled={isDisabled || undefined}
        aria-invalid={state === 'error' || undefined}
        className={styles.card}
      >
        <div className={styles.labelRow}>
          <p id={labelId} className={styles.label}>
            {label}
          </p>
          <div className={styles.balanceRow}>
            <WalletIcon className={styles.walletIcon} />
            <p className={styles.balance}>{balance}</p>
            <ChipButton state={isDisabled ? 'disabled' : 'default'}>MAX</ChipButton>
          </div>
        </div>

        <div className={styles.valueRow}>
          <button
            type="button"
            className={styles.selector}
            disabled={isDisabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={styles.crypto}>
              <span className={styles.logo}>
                <CoinIcon asset={ticker} size={28} />
              </span>
              <span className={styles.ticker}>{ticker}</span>
            </span>
            <ChevronIcon className={styles.chevron} direction={isOpen ? 'up' : 'down'} />
          </button>

          <p className={value ? styles.amount : `${styles.amount} ${styles.placeholder}`}>
            {value || placeholder}
            {state === 'focusInput' && <span aria-hidden="true" className={styles.caret} />}
          </p>
        </div>
      </div>

      {isOpen && (
        <div role="listbox" aria-label={label} className={styles.panel}>
          {OPTIONS.map((option) => (
            <DropdownItem
              key={option.ticker}
              icon={<CoinIcon asset={option.ticker} size={24} />}
              ticker={option.ticker}
              name={option.name}
              state={option.ticker === ticker ? 'selected' : 'default'}
            />
          ))}
        </div>
      )}

      {helperText && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
    </div>
  );
}
