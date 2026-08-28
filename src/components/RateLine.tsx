import { crossRate } from '../lib/exchange';
import { formatRateText } from '../lib/format';
import { Spinner } from './Spinner';
import type { Asset, Prices, RatesStatus } from '../types';
import styles from './RateLine.module.css';

interface RateLineProps {
  sendAsset: Asset;
  receiveAsset: Asset;
  prices: Prices | null;
  status: RatesStatus;
  isStale: boolean;
  hasRateError: boolean;
}

/** SPEC §8.1 — not a live region: a 10 s poll would spam a screen reader. */
export function RateLine({
  sendAsset,
  receiveAsset,
  prices,
  status,
  isStale,
  hasRateError,
}: RateLineProps) {
  const isFetching = status === 'loading' || status === 'refreshing';

  const text = hasRateError
    ? 'Rate unavailable'
    : prices === null
      ? 'Loading rate…'
      : formatRateText(crossRate(prices, sendAsset, receiveAsset), sendAsset, receiveAsset);

  return (
    <div className={styles.wrapper}>
      <p className={styles.line}>
        {text}
        {isFetching && <Spinner />}
      </p>
      {isStale && <p className={styles.caption}>Rate may be outdated</p>}
    </div>
  );
}
