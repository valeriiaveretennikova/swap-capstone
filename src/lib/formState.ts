import { ASSETS, MOCK_BALANCES } from '../constants';
import { activeRawOf } from './exchange';
import { isPositiveAmount, parseAmount } from './sanitize';
import type { FormCore, FormState, Prices, RatesStatus } from '../types';

export interface FormStateInput {
  core: FormCore;
  prices: Prices | null;
  ratesStatus: RatesStatus;
}

/**
 * SPEC §6 — `FormState` is derived, never stored. First matching rule wins and
 * the rule order below is the rule order of the table.
 */
export function deriveFormState({ core, prices, ratesStatus }: FormStateInput): FormState {
  if (ratesStatus === 'error' && prices === null) return 'rate-error';

  if (core.sendRaw === '' && core.receiveRaw === '') return 'empty';

  if (!isPositiveAmount(activeRawOf(core))) return 'typing';

  if (prices === null) return 'rate-loading';

  const sendAmount = parseAmount(core.sendRaw);
  if (!Number.isFinite(sendAmount)) return 'typing';

  if (sendAmount > MOCK_BALANCES[core.sendAsset]) return 'insufficient-funds';

  // The minimum is INCLUSIVE (§6, RD-2): strictly "<", never "<=".
  if (sendAmount < ASSETS[core.sendAsset].minAmount) return 'below-min';

  return 'valid';
}
