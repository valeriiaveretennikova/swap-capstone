import { ASSETS, ASSET_LIST, FETCH_TIMEOUT_MS } from '../constants';
import type { Prices } from '../types';

const ENDPOINT = 'https://api.binance.com/api/v3/ticker/price';

function buildUrl(): string {
  const symbols = ASSET_LIST.map((asset) => ASSETS[asset].binanceSymbol);
  return `${ENDPOINT}?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
}

function isTickerRow(value: unknown): value is { symbol: string; price: string } {
  if (typeof value !== 'object' || value === null) return false;
  if (!('symbol' in value) || !('price' in value)) return false;
  return typeof value.symbol === 'string' && typeof value.price === 'string';
}

/** SPEC §8.1 — a row that is missing or parses to NaN/0 fails the whole fetch. */
function parsePrices(payload: unknown): Prices {
  if (!Array.isArray(payload)) throw new Error('Unexpected ticker payload');

  const bySymbol = new Map<string, number>();
  for (const row of payload) {
    if (isTickerRow(row)) bySymbol.set(row.symbol, Number(row.price));
  }

  const prices: Prices = { BTC: 0, ETH: 0, USDC: 0, SOL: 0, XRP: 0, TRX: 0 };
  for (const asset of ASSET_LIST) {
    const price = bySymbol.get(ASSETS[asset].binanceSymbol);
    if (price === undefined || !Number.isFinite(price) || price <= 0) {
      throw new Error(`Missing price for ${asset}`);
    }
    prices[asset] = price;
  }
  return prices;
}

/** The caller owns the controller so it can also abort on unmount or on pause. */
export async function fetchPrices(controller: AbortController): Promise<Prices> {
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(buildUrl(), {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Ticker request failed with ${formatStatus(response.status)}`);
    return parsePrices(await response.json());
  } finally {
    window.clearTimeout(timeout);
  }
}

function formatStatus(status: number): string {
  return new Intl.NumberFormat('en-US', { useGrouping: false }).format(status);
}
