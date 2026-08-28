import { useState } from 'react';
import { SwapIcon } from './icons';
import styles from './SwapArrowButton.module.css';

interface SwapArrowButtonProps {
  disabled: boolean;
  onClick: () => void;
}

/** SPEC §8.3 — 40x40 icon button that flips the exchange direction. */
export function SwapArrowButton({ disabled, onClick }: SwapArrowButtonProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped((flipped) => !flipped);
    onClick();
  };

  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.button}
        disabled={disabled}
        onClick={handleClick}
        aria-label="Swap direction"
      >
        <SwapIcon className={`${styles.icon} ${isFlipped ? styles.iconFlipped : ''}`} />
      </button>
    </div>
  );
}
