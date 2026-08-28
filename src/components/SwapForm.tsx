import { useEffect, useId } from 'react';
import type { RefObject } from 'react';
import { ASSETS, MOCK_BALANCES } from '../constants';
import { formatMinAmount, formatRawGrouped } from '../lib/format';
import { AmountField } from './AmountField';
import { Button } from './Button';
import { ErrorBanner } from './ErrorBanner';
import { RateLine } from './RateLine';
import { SwapArrowButton } from './SwapArrowButton';
import type { ActiveSource, Asset, FormCore, FormState, Prices, RatesStatus } from '../types';
import styles from './SwapForm.module.css';

interface SwapFormProps {
  core: FormCore;
  formState: FormState;
  prices: Prices | null;
  ratesStatus: RatesStatus;
  isStale: boolean;
  focusSendOnMount: boolean;
  ctaRef: RefObject<HTMLButtonElement | null>;
  sendInputRef: RefObject<HTMLInputElement | null>;
  onChangeAmount: (field: ActiveSource, value: string) => void;
  onBlurAmount: (field: ActiveSource) => void;
  onSelectAsset: (field: ActiveSource, asset: Asset) => void;
  onSwap: () => void;
  onMax: () => void;
  onRetry: () => void;
  onContinue: () => void;
}

/** SPEC §7 — the CTA label carries no comparison sign in any state. */
function ctaLabel(formState: FormState, sendAsset: Asset): string {
  if (formState === 'rate-error') return 'Rate unavailable';
  if (formState === 'below-min') {
    return `Min amount is ${formatMinAmount(sendAsset)} ${ASSETS[sendAsset].ticker}`;
  }
  return 'Continue';
}

export function SwapForm({
  core,
  formState,
  prices,
  ratesStatus,
  isStale,
  focusSendOnMount,
  ctaRef,
  sendInputRef,
  onChangeAmount,
  onBlurAmount,
  onSelectAsset,
  onSwap,
  onMax,
  onRetry,
  onContinue,
}: SwapFormProps) {
  const bannerId = useId();

  useEffect(() => {
    if (!focusSendOnMount) return;
    sendInputRef.current?.focus();
  }, [focusSendOnMount, sendInputRef]);

  const isRateError = formState === 'rate-error';
  const hasFundsError = formState === 'insufficient-funds';
  const isBelowMin = formState === 'below-min';

  const sendDisplay =
    core.activeSource === 'send'
      ? core.sendRaw
      : formatRawGrouped(core.sendRaw, ASSETS[core.sendAsset].decimals);
  const receiveDisplay =
    core.activeSource === 'receive'
      ? core.receiveRaw
      : formatRawGrouped(core.receiveRaw, ASSETS[core.receiveAsset].decimals);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formState !== 'valid') return;
    onContinue();
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.heading}>Exchange</h1>

      <div className={styles.fields}>
        <AmountField
          kind="send"
          label="You send"
          asset={core.sendAsset}
          lockedAsset={core.receiveAsset}
          value={sendDisplay}
          balance={MOCK_BALANCES[core.sendAsset]}
          disabled={isRateError}
          hasError={hasFundsError}
          isInvalid={hasFundsError || isBelowMin}
          helperText={
            isBelowMin
              ? `Minimum amount is ${formatMinAmount(core.sendAsset)} ${ASSETS[core.sendAsset].ticker}`
              : undefined
          }
          bannerId={hasFundsError || isRateError ? bannerId : undefined}
          showMax
          maxDisabled={MOCK_BALANCES[core.sendAsset] === 0 || isRateError}
          inputRef={sendInputRef}
          onChange={(value) => onChangeAmount('send', value)}
          onBlur={() => onBlurAmount('send')}
          onAssetChange={(asset) => onSelectAsset('send', asset)}
          onMax={onMax}
        />

        <SwapArrowButton disabled={isRateError} onClick={onSwap} />

        <AmountField
          kind="receive"
          label="You receive"
          asset={core.receiveAsset}
          lockedAsset={core.sendAsset}
          value={receiveDisplay}
          balance={MOCK_BALANCES[core.receiveAsset]}
          disabled={isRateError}
          hasError={false}
          isInvalid={false}
          showMax={false}
          onChange={(value) => onChangeAmount('receive', value)}
          onBlur={() => onBlurAmount('receive')}
          onAssetChange={(asset) => onSelectAsset('receive', asset)}
        />
      </div>

      {hasFundsError && <ErrorBanner id={bannerId} variant="insufficient-funds" />}
      {isRateError && <ErrorBanner id={bannerId} variant="rate-error" onRetry={onRetry} />}

      <RateLine
        sendAsset={core.sendAsset}
        receiveAsset={core.receiveAsset}
        prices={prices}
        status={ratesStatus}
        isStale={isStale}
        hasRateError={isRateError}
      />

      <Button
        ref={ctaRef}
        variant="primary"
        type="submit"
        disabled={formState !== 'valid'}
        loading={formState === 'rate-loading'}
      >
        {ctaLabel(formState, core.sendAsset)}
      </Button>
    </form>
  );
}
