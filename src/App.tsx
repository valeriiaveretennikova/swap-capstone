import { useCallback, useEffect, useRef, useState } from 'react';
import { ASSETS, INITIAL_CORE, SUBMIT_DELAY_MS } from './constants';
import { usePageHidden } from './hooks/usePageHidden';
import { usePrices } from './hooks/usePrices';
import {
  applyAssetChange,
  applyBlur,
  applyMax,
  applySwap,
  applyTyping,
  crossRate,
  withPassive,
} from './lib/exchange';
import { formatAmountWithTicker, formatRateText } from './lib/format';
import { deriveFormState } from './lib/formState';
import { generateOrderId } from './lib/orderId';
import { AppHeader } from './components/header/AppHeader';
import { ConfirmView } from './components/ConfirmView';
import { ExchangeCard } from './components/ExchangeCard';
import { StatusAnnouncer } from './components/StatusAnnouncer';
import { SuccessView } from './components/SuccessView';
import { SwapForm } from './components/SwapForm';
import type { ActiveSource, Asset, FormCore, FormFocusTarget, Order, View } from './types';
import styles from './App.module.css';

export default function App() {
  const [view, setView] = useState<View>('form');
  const [core, setCore] = useState<FormCore>(INITIAL_CORE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [announcement, setAnnouncement] = useState({ text: '', nonce: 0 });
  const [formFocus, setFormFocus] = useState<FormFocusTarget>(null);

  const ctaRef = useRef<HTMLButtonElement>(null);
  const sendInputRef = useRef<HTMLInputElement>(null);

  /** §14 — every call is a new announcement, even with an unchanged message. */
  const announce = useCallback((text: string) => {
    setAnnouncement((current) => ({ text, nonce: current.nonce + 1 }));
  }, []);

  const isPageHidden = usePageHidden();
  // SPEC §8.1 — polling runs only in the form view of a visible tab.
  const { prices, status, isStale, refresh, ring } = usePrices(view !== 'form' || isPageHidden);

  const formState = deriveFormState({ core, prices, ratesStatus: status });

  // SPEC §8.2 (b) — a price update recalculates the passive field only.
  useEffect(() => {
    setCore((current) => withPassive(current, prices));
  }, [prices]);

  const backToForm = useCallback(() => {
    setFormFocus('cta');
    setView('form');
    announce('Exchange form');
  }, [announce]);

  // SPEC §8.6 — a refreshed rate that breaks validation returns to the form.
  useEffect(() => {
    if (view !== 'confirm' || isSubmitting || formState === 'valid') return;
    backToForm();
  }, [view, isSubmitting, formState, backToForm]);

  const handleChangeAmount = useCallback(
    (field: ActiveSource, value: string) => {
      setCore((current) => applyTyping(current, field, value, prices));
    },
    [prices],
  );

  const handleBlurAmount = useCallback((field: ActiveSource) => {
    setCore((current) => applyBlur(current, field));
  }, []);

  const handleSelectAsset = useCallback(
    (field: ActiveSource, asset: Asset) => {
      setCore((current) => applyAssetChange(current, field, asset, prices));
    },
    [prices],
  );

  const handleSwap = useCallback(() => {
    setCore((current) => applySwap(current, prices));
  }, [prices]);

  const handleMax = useCallback(() => {
    setCore((current) => applyMax(current, prices));
  }, [prices]);

  const handleRetry = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleContinue = useCallback(() => {
    if (formState !== 'valid') return;
    setView('confirm');
    announce('Confirm exchange step');
  }, [formState, announce]);

  const handleConfirm = useCallback(() => {
    if (isSubmitting || prices === null) return;
    setIsSubmitting(true);

    const nextOrder: Order = {
      id: generateOrderId(),
      date: new Date(),
      from: formatAmountWithTicker(core.sendRaw, core.sendAsset),
      to: formatAmountWithTicker(core.receiveRaw, core.receiveAsset),
      rateText: formatRateText(
        crossRate(prices, core.sendAsset, core.receiveAsset),
        core.sendAsset,
        core.receiveAsset,
      ),
      feeText: `0 ${ASSETS[core.receiveAsset].ticker}`,
    };

    window.setTimeout(() => {
      setOrder(nextOrder);
      setIsSubmitting(false);
      setView('success');
      announce('Exchange successful');
    }, SUBMIT_DELAY_MS);
  }, [isSubmitting, prices, core, announce]);

  const handleRateUpdated = useCallback(() => announce('Rate updated'), [announce]);

  // SPEC §8.7 — Done is a full reset to Screen 1.
  const handleDone = useCallback(() => {
    setCore(INITIAL_CORE);
    setOrder(null);
    setIsSubmitting(false);
    setFormFocus('input');
    setView('form');
    announce('Exchange form');
  }, [announce]);

  // A rate collapse while confirming lands on the form view in the same paint.
  const resolvedView: View = view === 'confirm' && prices === null ? 'form' : view;

  return (
    <>
      <AppHeader prices={prices} />

      <main className={styles.page}>
        <ExchangeCard view={resolvedView}>
          {resolvedView === 'form' && (
            <SwapForm
              core={core}
              formState={formState}
              prices={prices}
              ring={ring}
              isStale={isStale}
              focusTarget={formFocus}
              ctaRef={ctaRef}
              sendInputRef={sendInputRef}
              onChangeAmount={handleChangeAmount}
              onBlurAmount={handleBlurAmount}
              onSelectAsset={handleSelectAsset}
              onSwap={handleSwap}
              onMax={handleMax}
              onRetry={handleRetry}
              onContinue={handleContinue}
            />
          )}

          {resolvedView === 'confirm' && prices !== null && (
            <ConfirmView
              core={core}
              prices={prices}
              isSubmitting={isSubmitting}
              onBack={backToForm}
              onConfirm={handleConfirm}
              onRefresh={refresh}
              onRateUpdated={handleRateUpdated}
            />
          )}

          {resolvedView === 'success' && order && (
            <SuccessView order={order} onDone={handleDone} onAnnounce={announce} />
          )}
        </ExchangeCard>

        <StatusAnnouncer message={announcement.text} nonce={announcement.nonce} />
      </main>
    </>
  );
}
