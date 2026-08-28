import { useEffect, useId, useRef, useState } from 'react';
import { ASSETS, ASSET_LIST } from '../constants';
import { CoinIcon } from './CoinIcon';
import { ChevronIcon, CheckIcon } from './icons';
import type { Asset } from '../types';
import styles from './TokenSelect.module.css';

/** 6 items x 40px + list padding + gaps — used only to decide the flip side. */
const ESTIMATED_LIST_HEIGHT = 284;

interface TokenSelectProps {
  value: Asset;
  /** The asset picked in the opposite field: listed, but not selectable (§8.5). */
  lockedAsset: Asset;
  labelId: string;
  onSelect: (asset: Asset) => void;
}

export function TokenSelect({ value, lockedAsset, labelId, onSelect }: TokenSelectProps) {
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

  const nextEnabledIndex = (from: number, delta: number): number => {
    let index = from;
    for (let step = 0; step < ASSET_LIST.length; step += 1) {
      index = (index + delta + ASSET_LIST.length) % ASSET_LIST.length;
      if (ASSET_LIST[index] !== lockedAsset) return index;
    }
    return from;
  };

  const edgeIndex = (edge: 'first' | 'last'): number =>
    edge === 'first' ? nextEnabledIndex(ASSET_LIST.length - 1, 1) : nextEnabledIndex(0, -1);

  const select = (asset: Asset) => {
    if (asset === lockedAsset) return;
    onSelect(asset);
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
        setActiveIndex(nextEnabledIndex(activeIndex, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(nextEnabledIndex(activeIndex, -1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(edgeIndex('first'));
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(edgeIndex('last'));
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
        <CoinIcon asset={value} />
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
          {ASSET_LIST.map((asset, index) => {
            const isLocked = asset === lockedAsset;
            return (
              <div
                key={asset}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                tabIndex={-1}
                aria-selected={asset === value}
                aria-disabled={isLocked || undefined}
                className={`${styles.option} ${isLocked ? styles.optionLocked : ''}`}
                onClick={() => select(asset)}
              >
                <CoinIcon asset={asset} className={isLocked ? styles.lockedIcon : undefined} />
                <span className={styles.optionTicker}>{ASSETS[asset].ticker}</span>
                <span className={styles.optionName}>{ASSETS[asset].name}</span>
                {asset === value && <CheckIcon className={styles.check} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
