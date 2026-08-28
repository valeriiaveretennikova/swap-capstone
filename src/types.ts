export type Asset = 'BTC' | 'ETH' | 'USDC' | 'SOL' | 'XRP' | 'TRX';

export type ActiveSource = 'send' | 'receive';

export type RatesStatus = 'loading' | 'ready' | 'refreshing' | 'error';

/** SPEC §8.1 — what the rate ring is showing right now. */
export type RingPhase =
  /** Filling towards the moment the next request is scheduled to fire. */
  | 'filling'
  /** A request is in flight: there is no time left to show, so the ring spins. */
  | 'indeterminate'
  /** Polling is paused: the fill holds at `value` and nothing moves. */
  | 'frozen'
  /** Nothing to visualise (rate error): the bare track. */
  | 'idle';

/**
 * The poll timer as the ring needs to draw it. It comes from `usePrices` so the
 * ring cannot drift from the poll it visualises: `startedAt` is the very
 * timestamp the next request is scheduled from.
 */
export interface RingProgress {
  phase: RingPhase;
  /** `Date.now()` of the current fill window's start. `0` before the first tick. */
  startedAt: number;
  /**
   * How far into the window this phase began. Measured once, when the phase
   * changes, so re-renders inside a window never move the running animation:
   * the fill resumes from here, and a frozen ring holds here.
   */
  elapsedMs: number;
  /** Length of the fill window in ms. */
  durationMs: number;
}

export type FormState =
  | 'empty'
  | 'typing'
  | 'valid'
  | 'below-min'
  | 'insufficient-funds'
  | 'rate-loading'
  | 'rate-error';

/** SPEC §3 — the single switch that drives which children the card renders. */
export type View = 'form' | 'confirm' | 'success';

export type Prices = Record<Asset, number>;

/** §14 — where focus lands when the form view mounts after a view change. */
export type FormFocusTarget = 'input' | 'cta' | null;

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
