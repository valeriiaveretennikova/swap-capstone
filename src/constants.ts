import type { Asset, AssetSpec, FormCore } from './types';

/** SPEC §5.1 — asset table. Tickers are strictly USDC and TRX (never TRC). */
export const ASSETS: Readonly<Record<Asset, AssetSpec>> = Object.freeze({
  BTC: { ticker: 'BTC', name: 'Bitcoin', minAmount: 0.00000013, decimals: 8, binanceSymbol: 'BTCUSDT' },
  ETH: { ticker: 'ETH', name: 'Ethereum', minAmount: 0.000004, decimals: 6, binanceSymbol: 'ETHUSDT' },
  USDC: { ticker: 'USDC', name: 'USD Coin', minAmount: 0.01, decimals: 2, binanceSymbol: 'USDCUSDT' },
  SOL: { ticker: 'SOL', name: 'Solana', minAmount: 0.000094, decimals: 6, binanceSymbol: 'SOLUSDT' },
  XRP: { ticker: 'XRP', name: 'Ripple', minAmount: 0.007, decimals: 4, binanceSymbol: 'XRPUSDT' },
  TRX: { ticker: 'TRX', name: 'Tron', minAmount: 0.03, decimals: 2, binanceSymbol: 'TRXUSDT' },
});

export const ASSET_LIST: readonly Asset[] = ['BTC', 'ETH', 'USDC', 'SOL', 'XRP', 'TRX'];

/** SPEC §5.2 — mock balances, constant for the whole session. */
export const MOCK_BALANCES: Readonly<Record<Asset, number>> = Object.freeze({
  BTC: 0.0425,
  ETH: 1.25,
  USDC: 92514.30,
  SOL: 12.5,
  XRP: 300,
  TRX: 1500,
});

export const DEFAULT_SEND_ASSET: Asset = 'USDC';
export const DEFAULT_RECEIVE_ASSET: Asset = 'BTC';

export const INITIAL_CORE: FormCore = {
  sendAsset: DEFAULT_SEND_ASSET,
  receiveAsset: DEFAULT_RECEIVE_ASSET,
  sendRaw: '',
  receiveRaw: '',
  activeSource: 'send',
};

export const POLL_INTERVAL_MS = 10_000;
export const FETCH_TIMEOUT_MS = 8_000;
export const QUOTE_LOCK_SECONDS = 10;

/** §8.1 — three consecutive background failures escalate to `rate-error`. */
export const MAX_CONSECUTIVE_FAILURES = 3;
/** §8.6 — two consecutive failures in the confirm view stall the quote lock. */
export const MAX_CONFIRM_FAILURES = 2;

export const SUBMIT_DELAY_MS = 600;
export const COPY_FEEDBACK_MS = 2000;

/** §9 rule 7 — integer part limit. */
export const MAX_INTEGER_DIGITS = 12;
