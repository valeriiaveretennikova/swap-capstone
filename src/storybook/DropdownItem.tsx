import type { ReactNode } from 'react';
import { CheckGlyph } from './glyphs';
import styles from './DropdownItem.module.css';

export type DropdownItemState =
  | 'default'
  | 'hover'
  | 'pressed'
  | 'focus'
  | 'selected'
  | 'disabled';

export interface DropdownItemProps {
  /** Coin glyph, rendered in a 24px box (Figma `dd-item/icon-size: 24`). */
  icon: ReactNode;
  /** Asset symbol — Poppins Medium 15/22, `dd-item/text/ticker/default`. */
  ticker: string;
  /** Full asset name — Poppins Regular 14/20, `dd-item/text/name/default`. */
  name: string;
  /** Figma `State` variant axis. Every look is a class, never a pseudo-class. */
  state?: DropdownItemState;
}

/**
 * `default` and `selected` need no modifier: `default` is the base rule and
 * `selected` only adds the check, which the markup handles.
 */
const STATE_CLASS: Record<DropdownItemState, string> = {
  default: '',
  hover: styles.itemHover,
  pressed: styles.itemPressed,
  focus: styles.itemFocus,
  selected: '',
  disabled: styles.itemDisabled,
};

/**
 * Figma `7:8551` — Dropdown Item, `180 × 40`.
 *
 * Presentational only: no state, no handlers, no logic. The visual state is the
 * `state` prop, so a story is a fixed set of props and its snapshot does not
 * depend on a real pointer, a real focus, or on the document having focus at
 * all.
 *
 * The Figma frame nests a `Content Row` between the root and the icon/title.
 * Both levels use `gap: 8`, so the row is flattened here: `icon | title(flex:1)
 * | check` reproduces the same 8px gaps and the same `x=148` check position
 * with two fewer nodes.
 */
export function DropdownItem({ icon, ticker, name, state = 'default' }: DropdownItemProps) {
  // Figma draws the check in both `133:777` Selected (`icon/brand` #2b7bea) and
  // `7:8564` Disabled (`icon/disabled` #98a2b3), so Disabled is the selected row
  // switched off. `aria-selected` follows the check to keep ARIA and paint in sync.
  const showCheck = state === 'selected' || state === 'disabled';
  const className = [styles.item, STATE_CLASS[state]].filter(Boolean).join(' ');

  return (
    <div
      role="option"
      aria-selected={showCheck}
      aria-disabled={state === 'disabled' || undefined}
      // Roving focus: the owning listbox moves focus, Tab never lands here.
      tabIndex={-1}
      className={className}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.title}>
        <span className={styles.ticker}>{ticker}</span>
        <span className={styles.name}>{name}</span>
      </span>
      {showCheck && <CheckGlyph className={styles.check} />}
    </div>
  );
}
