import { useState } from 'react';
import { SwapIcon } from './icons';
import styles from './SwapArrowButton.module.css';

interface SwapArrowButtonProps {
  disabled: boolean;
  /** Helper text under the send card moves the seam down by the helper block. */
  hasHelperText: boolean;
  onClick: () => void;
}

/**
 * SPEC §8.3 — 40x40 icon button, absolutely positioned over the 8px seam so it
 * overlaps both amount cards and consumes no vertical space between them.
 */
export function SwapArrowButton({ disabled, hasHelperText, onClick }: SwapArrowButtonProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped((flipped) => !flipped);
    onClick();
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${hasHelperText ? styles.buttonShifted : ''}`}
      disabled={disabled}
      onClick={handleClick}
      aria-label="Swap direction"
    >
      <SwapIcon className={`${styles.icon} ${isFlipped ? styles.iconFlipped : ''}`} />
    </button>
  );
}
