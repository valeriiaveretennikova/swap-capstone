import { useEffect, useId, useRef, useState } from 'react';
import { ASSETS, ASSET_LIST } from '../constants';
import { CoinIcon } from './CoinIcon';
import { ChevronIcon, CheckIcon } from './icons';
import type { Asset } from '../types';
import styles from './TokenSelect.module.css';

/** §11.10 — 28px inside the trigger's white logo box, 24px in the list. */
const TRIGGER_ICON_SIZE = 28;
const OPTION_ICON_SIZE = 24;

/** 6 items x 40px + list padding + gaps — used only to decide the flip side. */
const ESTIMATED_LIST_HEIGHT = 284;

interface TokenSelectProps {
  value: Asset;
  labelId: string;
  onSelect: (asset: Asset) => void;
}

/**
 * SPEC §11.7 CurrencySelector + §8.5 dropdown. RD-4: every one of the six
 * options is selectable and none is ever marked unavailable — the check mark on
 * the current asset is the only selection cue.
 */
export function TokenSelect({ value, labelId, onSelect }: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const selectedIndex = ASSET_LIST.indexOf(value);

  const open = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setDropUp(window.innerHeight - rect.bottom < ESTIMATED_LIST_HEIGHT);
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const close = (returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    optionRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleScroll = () => setIsOpen(false);

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  /** All 6 options take part in the roving focus and it wraps around (§14). */
  const step = (delta: number): number =>
    (activeIndex + delta + ASSET_LIST.length) % ASSET_LIST.length;

  const select = (asset: Asset) => {
    // E9a — a re-pick of the current asset closes the list and calls no setter.
    if (asset !== value) onSelect(asset);
    close(true);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    open();
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(step(1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(step(-1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(ASSET_LIST.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        select(ASSET_LIST[activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab':
        // Focus is moved to the trigger first, so the default Tab continues from there.
        close(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.logoBox}>
          <CoinIcon asset={value} size={TRIGGER_ICON_SIZE} />
        </span>
        <span className={styles.ticker}>{ASSETS[value].ticker}</span>
        <ChevronIcon direction={isOpen ? 'up' : 'down'} className={styles.chevron} />
      </button>

      {isOpen && (
        <div
          id={listId}
          ref={listRef}
          role="listbox"
          aria-labelledby={labelId}
          className={`${styles.list} ${dropUp ? styles.dropUp : ''}`}
          onKeyDown={handleListKeyDown}
        >
          {ASSET_LIST.map((asset, index) => (
            <div
              key={asset}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              tabIndex={-1}
              aria-selected={asset === value}
              className={styles.option}
              onClick={() => select(asset)}
            >
              <CoinIcon asset={asset} size={OPTION_ICON_SIZE} />
              <span className={styles.optionTicker}>{ASSETS[asset].ticker}</span>
              <span className={styles.optionName}>{ASSETS[asset].name}</span>
              {asset === value && <CheckIcon className={styles.check} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
