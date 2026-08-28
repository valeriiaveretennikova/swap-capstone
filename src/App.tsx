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
import { ConfirmModal } from './components/ConfirmModal';
import { StatusAnnouncer } from './components/StatusAnnouncer';
import { SuccessPanel } from './components/SuccessPanel';
import { SwapForm } from './components/SwapForm';
import type { ActiveSource, Asset, FormCore, Order, View } from './types';
import styles from './App.module.css';

export default function App() {
  const [view, setView] = useState<View>('form');
  const [core, setCore] = useState<FormCore>(INITIAL_CORE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [focusSendOnMount, setFocusSendOnMount] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const sendInputRef = useRef<HTMLInputElement>(null);

  const isPageHidden = usePageHidden();
  const { prices, status, isStale, refresh } = usePrices(
    isModalOpen || isPageHidden || view === 'success',
  );

  const formState = deriveFormState({ core, prices, ratesStatus: status });

  // SPEC §8.2 (b) — a price update recalculates the passive field only.
  useEffect(() => {
    setCore((current) => withPassive(current, prices));
  }, [prices]);

  const restoreFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      const cta = ctaRef.current;
      if (cta && !cta.disabled) {
        cta.focus();
        return;
      }
      sendInputRef.current?.focus();
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    restoreFocus();
  }, [restoreFocus]);

  // SPEC §8.6 — a refreshed rate that breaks validation closes the modal.
  useEffect(() => {
    if (!isModalOpen || isSubmitting || formState === 'valid') return;
    closeModal();
  }, [isModalOpen, isSubmitting, formState, closeModal]);

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
    setIsModalOpen(true);
  }, [formState]);

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
      setIsModalOpen(false);
      setIsSubmitting(false);
      setView('success');
      setAnnouncement('Exchange successful');
    }, SUBMIT_DELAY_MS);
  }, [isSubmitting, prices, core]);

  const handleRateUpdated = useCallback(() => setAnnouncement('Rate updated'), []);

  // SPEC §8.7 — Done is a full reset to Screen 1.
  const handleDone = useCallback(() => {
    setCore(INITIAL_CORE);
    setOrder(null);
    setIsSubmitting(false);
    setAnnouncement('');
    setFocusSendOnMount(true);
    setView('form');
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.content} ref={contentRef}>
        {view === 'form' && (
          <SwapForm
            core={core}
            formState={formState}
            prices={prices}
            ratesStatus={status}
            isStale={isStale}
            focusSendOnMount={focusSendOnMount}
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

        {view === 'success' && order && (
          <SuccessPanel order={order} onDone={handleDone} onAnnounce={setAnnouncement} />
        )}
      </div>

      {isModalOpen && prices !== null && (
        <ConfirmModal
          core={core}
          prices={prices}
          isSubmitting={isSubmitting}
          backgroundRef={contentRef}
          onBack={closeModal}
          onConfirm={handleConfirm}
          onRefresh={refresh}
          onRateUpdated={handleRateUpdated}
        />
      )}

      <StatusAnnouncer message={announcement} />
    </main>
  );
}
