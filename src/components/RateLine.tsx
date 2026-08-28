import { crossRate } from '../lib/exchange';
import { formatRateText } from '../lib/format';
import { RateRing } from './RateRing';
import type { Asset, Prices, RingProgress } from '../types';
import styles from './RateLine.module.css';

interface RateLineProps {
  sendAsset: Asset;
  receiveAsset: Asset;
  prices: Prices | null;
  ring: RingProgress;
  isStale: boolean;
  hasRateError: boolean;
}

/**
 * SPEC §8.1 — sits directly above the CTA, centred. Not a live region: a 10 s
 * poll would spam a screen reader. The ring is always rendered; it fills towards
 * the next price request and shows a bare track when there is no rate at all.
 */
export function RateLine({
  sendAsset,
  receiveAsset,
  prices,
  ring,
  isStale,
  hasRateError,
}: RateLineProps) {
  const text = hasRateError
    ? 'Rate unavailable'
    : prices === null
      ? 'Loading rate…'
      : formatRateText(crossRate(prices, sendAsset, receiveAsset), sendAsset, receiveAsset);

  return (
    <div className={styles.wrapper}>
      <p className={styles.line}>
        {text}
        <RateRing progress={hasRateError ? { ...ring, phase: 'idle' } : ring} />
      </p>
      {isStale && <p className={styles.caption}>Rate may be outdated</p>}
    </div>
  );
}
