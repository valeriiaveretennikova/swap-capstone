import { UsdcIcon } from '../components/coins/UsdcIcon';
import styles from './CurrencySelector.module.css';

/** Figma `86:612` ships a single USDC instance; the trigger is presentational. */
const TICKER = 'USDC';

/** Figma `86:615` — a 28px glyph centred in the 32px white logo box. */
const GLYPH_SIZE = 28;

/** The `State` variant property of Figma `86:612`, in the order it is drawn. */
export type CurrencySelectorState =
  | 'default'
  | 'hover'
  | 'pressed'
  | 'focus'
  | 'expanded'
  | 'disabled';

interface CurrencySelectorProps {
  /**
   * Paints one Figma state. It is a prop, not a pseudo-class: `hover` and
   * `pressed` are real classes, `focus` draws the ring without the element
   * being focused, so a snapshot never depends on the pointer, on the document
   * having focus, or on state left behind by the previously viewed story.
   */
  state?: CurrencySelectorState;
}

/** Figma `86:620` Dropdown / `86:660` Dropup — a solid caret, not a stroke. */
function Caret({ up }: { up: boolean }) {
  return (
    <svg
      className={styles.caret}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          up
            ? 'M12 11.8284L9.17154 14.6569L7.75732 13.2426L12 9L16.2426 13.2426L14.8284 14.6569L12 11.8284Z'
            : 'M12 15.0006L7.75732 10.758L9.17154 9.34375L12 12.1722L14.8284 9.34375L16.2426 10.758L12 15.0006Z'
        }
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Figma `86:612` CurrencySelector — the asset trigger alone: white round logo
 * plate, ticker, caret. 106x32, radius 12.
 *
 * No state, no handlers, no dropdown panel. Figma's Expanded variant is the
 * trigger with the caret turned up and nothing else, so no list is rendered.
 */
export function CurrencySelector({ state = 'default' }: CurrencySelectorProps) {
  const isExpanded = state === 'expanded';

  return (
    <button
      type="button"
      className={`${styles.selector} ${styles[state]}`}
      aria-haspopup="listbox"
      aria-expanded={isExpanded}
      disabled={state === 'disabled'}
    >
      <span className={styles.logo}>
        <UsdcIcon size={GLYPH_SIZE} className={styles.glyph} />
      </span>
      <span className={styles.ticker}>{TICKER}</span>
      <Caret up={isExpanded} />
    </button>
  );
}
