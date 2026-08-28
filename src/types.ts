export type Asset = 'BTC' | 'ETH' | 'USDC' | 'SOL' | 'XRP' | 'TRX';

export type ActiveSource = 'send' | 'receive';

export type RatesStatus = 'loading' | 'ready' | 'refreshing' | 'error';

export type FormState =
  | 'empty'
  | 'typing'
  | 'valid'
  | 'below-min'
  | 'insufficient-funds'
  | 'rate-loading'
  | 'rate-error';

export type View = 'form' | 'success';

export type Prices = Record<Asset, number>;

export interface AssetSpec {
  ticker: Asset;
  name: string;
  minAmount: number;
  decimals: number;
  binanceSymbol: string;
}

/**
 * The four values that describe the exchange form. `sendRaw` / `receiveRaw` are
 * always stored ungrouped; grouping of the passive field is a display concern.
 */
export interface FormCore {
  sendAsset: Asset;
  receiveAsset: Asset;
  sendRaw: string;
  receiveRaw: string;
  activeSource: ActiveSource;
}

export interface Order {
  id: string;
  date: Date;
  from: string;
  to: string;
  rateText: string;
  feeText: string;
}
