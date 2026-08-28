import { ASSETS } from '../constants';
import type { Asset } from '../types';

/**
 * U+2265 GREATER-THAN OR EQUAL TO — a single character (SPEC §9.2).
 * The minimum is inclusive, so this is the only truthful sign for the
 * placeholders. The character ">" must never reach the UI.
 */
const GREATER_OR_EQUAL = '≥';

const plainFormatters = new Map<number, Intl.NumberFormat>();
const groupedFormatters = new Map<number, Intl.NumberFormat>();

function plainFormatter(decimals: number): Intl.NumberFormat {
  const cached = plainFormatters.get(decimals);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    useGrouping: false,
  });
  plainFormatters.set(decimals, formatter);
  return formatter;
}

function groupedFormatter(decimals: number): Intl.NumberFormat {
  const cached = groupedFormatters.get(decimals);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals });
  groupedFormatters.set(decimals, formatter);
  return formatter;
}

const rateFormatter = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 });
const integerFormatter = new Intl.NumberFormat('en-US', { useGrouping: false });
const twoDigitFormatter = new Intl.NumberFormat('en-US', {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

function trimTrailingZeros(value: string): string {
  if (!value.includes('.')) return value;
  return value.replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Plain (never exponential) decimal string for a finite number, rounded to 15
 * significant digits so double-precision noise does not survive. Used only as
 * an intermediate step for truncation — never rendered directly.
 */
function toPlainDecimal(value: number): string {
  const precise = value.toPrecision(15);
  const exponentIndex = precise.indexOf('e');
  if (exponentIndex === -1) return trimTrailingZeros(precise);

  const mantissa = precise.slice(0, exponentIndex);
  const exponent = Number(precise.slice(exponentIndex + 1));
  const negative = mantissa.startsWith('-');
  const unsigned = negative ? mantissa.slice(1) : mantissa;
  const digits = unsigned.replace('.', '');
  const integerLength = unsigned.split('.')[0].length;
  const pointPosition = integerLength + exponent;

  let expanded: string;
  if (pointPosition <= 0) {
    expanded = `0.${'0'.repeat(-pointPosition)}${digits}`;
  } else if (pointPosition >= digits.length) {
    expanded = `${digits}${'0'.repeat(pointPosition - digits.length)}`;
  } else {
    expanded = `${digits.slice(0, pointPosition)}.${digits.slice(pointPosition)}`;
  }

  return `${negative ? '-' : ''}${trimTrailingZeros(expanded)}`;
}

/** SPEC §8.2 — truncate toward zero to `decimals` fraction digits (never round). */
export function truncate(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  const plain = toPlainDecimal(value);
  const dotIndex = plain.indexOf('.');
  if (dotIndex === -1) return Number(plain);
  const cutLength = decimals === 0 ? dotIndex : dotIndex + 1 + decimals;
  return Number(plain.slice(0, cutLength));
}

/** Fixed notation, no grouping, trailing zeros trimmed — used for input values. */
export function formatPlain(value: number, decimals: number): string {
  return plainFormatter(decimals).format(value);
}

/** Fixed notation with grouping — passive field, modal and success screen. */
export function formatGrouped(value: number, decimals: number): string {
  return groupedFormatter(decimals).format(value);
}

/** SPEC §8.1 — rate display. */
export function formatRate(value: number): string {
  return rateFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatTwoDigits(value: number): string {
  return twoDigitFormatter.format(value);
}

/** Grouped display of a raw input string; partial input (`1.`) is left alone. */
export function formatRawGrouped(raw: string, decimals: number): string {
  if (raw === '') return '';
  if (!/^\d+(\.\d+)?$/.test(raw)) return raw;
  return formatGrouped(Number(raw), decimals);
}

/** `{amount} {TICKER}` with grouping — modal rows and success summary. */
export function formatAmountWithTicker(raw: string, asset: Asset): string {
  const { decimals, ticker } = ASSETS[asset];
  return `${formatRawGrouped(raw, decimals)} ${ticker}`;
}

/** SPEC §9.1 — balance row: grouped, trailing zeros trimmed. */
export function formatBalance(value: number, decimals: number): string {
  return formatGrouped(value, decimals);
}

/** SPEC §7 — minimum printed with no grouping and no trailing-zero padding. */
export function formatMinAmount(asset: Asset): string {
  const { minAmount, decimals } = ASSETS[asset];
  return formatPlain(minAmount, decimals);
}

/** SPEC §9.2 — the six canonical placeholder strings. */
export function formatPlaceholder(asset: Asset): string {
  return `${GREATER_OR_EQUAL}${formatMinAmount(asset)}`;
}

/** SPEC §8.1 — `1 {SEND} ≈ {RATE} {RECEIVE}`. */
export function formatRateText(rate: number, sendAsset: Asset, receiveAsset: Asset): string {
  return `1 ${ASSETS[sendAsset].ticker} ≈ ${formatRate(rate)} ${ASSETS[receiveAsset].ticker}`;
}

/** SPEC §8.7 — `DD.MM.YYYY, HH:mm`, local time, 24-hour, built from Date parts. */
export function formatDateTime(date: Date): string {
  const day = formatTwoDigits(date.getDate());
  const month = formatTwoDigits(date.getMonth() + 1);
  const year = formatInteger(date.getFullYear());
  const hours = formatTwoDigits(date.getHours());
  const minutes = formatTwoDigits(date.getMinutes());
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

/** SPEC §8.6 — `0:SS`, zero padded. */
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${formatInteger(minutes)}:${formatTwoDigits(seconds)}`;
}
