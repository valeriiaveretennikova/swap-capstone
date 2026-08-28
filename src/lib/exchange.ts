import { ASSETS, ASSET_LIST, MOCK_BALANCES } from '../constants';
import { formatPlain, truncate } from './format';
import {
  isPositiveAmount,
  normalizeOnBlur,
  parseAmount,
  sanitizeAmount,
  stripGrouping,
  truncateRaw,
} from './sanitize';
import type { ActiveSource, Asset, FormCore, Prices } from '../types';

export function activeRawOf(core: FormCore): string {
  return core.activeSource === 'send' ? core.sendRaw : core.receiveRaw;
}

/** SPEC §8.1 — cross rate through USD prices. */
export function crossRate(prices: Prices, from: Asset, to: Asset): number {
  return prices[from] / prices[to];
}

function directionOf(core: FormCore): { from: Asset; to: Asset } {
  return core.activeSource === 'send'
    ? { from: core.sendAsset, to: core.receiveAsset }
    : { from: core.receiveAsset, to: core.sendAsset };
}

/** SPEC §8.2 — the passive amount, truncated to the target asset's decimals. */
export function computePassive(core: FormCore, prices: Prices | null): string {
  if (prices === null) return '';

  const activeRaw = activeRawOf(core);
  if (!isPositiveAmount(activeRaw)) return '';

  const { from, to } = directionOf(core);
  const converted = parseAmount(activeRaw) * crossRate(prices, from, to);
  if (!Number.isFinite(converted)) return '';

  const { decimals } = ASSETS[to];
  return formatPlain(truncate(converted, decimals), decimals);
}

/**
 * SPEC §8.2 loop guard — the single place where a calculated amount is written.
 * It touches exactly the passive field; the active field is never rewritten.
 */
export function withPassive(core: FormCore, prices: Prices | null): FormCore {
  const passive = computePassive(core, prices);

  if (core.activeSource === 'send') {
    return passive === core.receiveRaw ? core : { ...core, receiveRaw: passive };
  }
  return passive === core.sendRaw ? core : { ...core, sendRaw: passive };
}

function withActiveRaw(core: FormCore, field: ActiveSource, raw: string): FormCore {
  return field === 'send'
    ? { ...core, activeSource: 'send', sendRaw: raw }
    : { ...core, activeSource: 'receive', receiveRaw: raw };
}

/** SPEC §9 — typing sets `activeSource` first, then recalculates. */
export function applyTyping(
  core: FormCore,
  field: ActiveSource,
  inputValue: string,
  prices: Prices | null,
): FormCore {
  const asset = field === 'send' ? core.sendAsset : core.receiveAsset;
  const previous = field === 'send' ? core.sendRaw : core.receiveRaw;
  const wasPassive = core.activeSource !== field;
  const incoming = wasPassive ? stripGrouping(inputValue) : inputValue;
  const raw = sanitizeAmount(incoming, ASSETS[asset].decimals, previous);

  return withPassive(withActiveRaw(core, field, raw), prices);
}

export function applyBlur(core: FormCore, field: ActiveSource): FormCore {
  if (core.activeSource !== field) return core;
  const raw = normalizeOnBlur(activeRawOf(core));
  if (raw === activeRawOf(core)) return core;
  return withActiveRaw(core, field, raw);
}

/** SPEC §8.3 — the four swap steps. */
export function applySwap(core: FormCore, prices: Prices | null): FormCore {
  const sendAsset = core.receiveAsset;
  const receiveAsset = core.sendAsset;
  const sendRaw = truncateRaw(stripGrouping(core.receiveRaw), ASSETS[sendAsset].decimals);

  const swapped: FormCore = {
    sendAsset,
    receiveAsset,
    sendRaw,
    receiveRaw: core.sendRaw,
    activeSource: 'send',
  };

  return withPassive(swapped, prices);
}

/** SPEC §8.4 — MAX fills the send field with the whole balance. */
export function applyMax(core: FormCore, prices: Prices | null): FormCore {
  const { decimals } = ASSETS[core.sendAsset];
  const balance = MOCK_BALANCES[core.sendAsset];
  const sendRaw = formatPlain(truncate(balance, decimals), decimals);

  return withPassive(withActiveRaw(core, 'send', sendRaw), prices);
}

/** RD-4 — the collision fallback: always `BTC`, and `ETH` when `BTC` was picked. */
function firstAssetOtherThan(picked: Asset): Asset {
  const fallback = ASSET_LIST.find((asset) => asset !== picked);
  return fallback ?? picked;
}

/**
 * SPEC §8.5 / RD-4 — asset selection. No option is ever disabled: picking the
 * asset held by the opposite field moves that field to the first asset of
 * `ASSET_LIST` that differs from the pick, which keeps
 * `sendAsset !== receiveAsset` true without forbidding any selection.
 */
export function applyAssetChange(
  core: FormCore,
  field: ActiveSource,
  picked: Asset,
  prices: Prices | null,
): FormCore {
  const current = field === 'send' ? core.sendAsset : core.receiveAsset;
  // E9a — re-picking the asset already selected in this field is a pure no-op.
  if (picked === current) return core;

  const other = field === 'send' ? core.receiveAsset : core.sendAsset;
  const nextOther = other === picked ? firstAssetOtherThan(picked) : other;

  const withAssets: FormCore =
    field === 'send'
      ? { ...core, sendAsset: picked, receiveAsset: nextOther }
      : { ...core, receiveAsset: picked, sendAsset: nextOther };

  // The active field may be either of the two, so re-truncate whichever it is.
  const activeAsset =
    withAssets.activeSource === 'send' ? withAssets.sendAsset : withAssets.receiveAsset;
  const retruncated = truncateRaw(activeRawOf(withAssets), ASSETS[activeAsset].decimals);

  return withPassive(withActiveRaw(withAssets, withAssets.activeSource, retruncated), prices);
}
