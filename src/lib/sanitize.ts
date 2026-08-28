import { MAX_INTEGER_DIGITS } from '../constants';

function stripLeadingZeros(value: string): string {
  const leading = value.match(/^0+/);
  if (!leading) return value;
  const rest = value.slice(leading[0].length);
  if (rest.startsWith('.')) return `0${rest}`;
  return rest === '' ? '0' : rest;
}

/**
 * SPEC §9 — the seven sanitisation rules, in order. `previous` is returned when
 * the integer part would exceed the digit cap (rule 7).
 */
export function sanitizeAmount(input: string, decimals: number, previous: string): string {
  const withDots = input.replace(/,/g, '.');
  const digitsOnly = withDots.replace(/[^0-9.]/g, '');

  const firstDot = digitsOnly.indexOf('.');
  const singleDot =
    firstDot === -1
      ? digitsOnly
      : digitsOnly.slice(0, firstDot + 1) + digitsOnly.slice(firstDot + 1).replace(/\./g, '');

  const leadingZero = singleDot.startsWith('.') ? `0${singleDot}` : singleDot;
  const normalized = stripLeadingZeros(leadingZero);

  const dotIndex = normalized.indexOf('.');
  const truncated =
    dotIndex === -1
      ? normalized
      : normalized.slice(0, decimals === 0 ? dotIndex : dotIndex + 1 + decimals);

  const integerPart = truncated.includes('.') ? truncated.split('.')[0] : truncated;
  if (integerPart.length > MAX_INTEGER_DIGITS) return previous;

  return truncated;
}

/** A trailing dot is allowed while typing and normalised away on blur (§9). */
export function normalizeOnBlur(raw: string): string {
  return raw.endsWith('.') ? raw.slice(0, -1) : raw;
}

/** Re-truncate an existing raw value to a new asset's decimals (§8.3, §8.5). */
export function truncateRaw(raw: string, decimals: number): string {
  const dotIndex = raw.indexOf('.');
  if (dotIndex === -1) return raw;
  const integerPart = raw.slice(0, dotIndex);
  const fraction = raw.slice(dotIndex + 1, dotIndex + 1 + decimals).replace(/0+$/, '');
  return fraction === '' ? integerPart : `${integerPart}.${fraction}`;
}

/** Grouping separators only ever come from our own display formatting (§8.3). */
export function stripGrouping(value: string): string {
  return value.replace(/,/g, '');
}

export function parseAmount(raw: string): number {
  if (raw === '') return Number.NaN;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** SPEC §6 rule 3 — `''`, `'0'`, `'0.'`, `'00'` are all "not a positive number". */
export function isPositiveAmount(raw: string): boolean {
  const value = parseAmount(raw);
  return Number.isFinite(value) && value > 0;
}
