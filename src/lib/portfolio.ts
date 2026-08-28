import { ASSET_LIST, MOCK_BALANCES } from '../constants';
import type { Prices } from '../types';

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * Header chrome only. The portfolio figure printed in the mock is illustrative
 * (SPEC §11.12) and would contradict the balances the form itself shows, so the
 * header derives the total from those same mock balances (§5.2) at the live
 * prices — one sum, no new data and no new logic. Never call this with
 * `prices === null`; the header renders a dash then.
 */
export function formatPortfolioUsd(prices: Prices): string {
  const total = ASSET_LIST.reduce(
    (sum, asset) => sum + MOCK_BALANCES[asset] * prices[asset],
    0,
  );
  return usdFormatter.format(total);
}
