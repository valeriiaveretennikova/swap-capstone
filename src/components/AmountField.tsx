import { useId } from 'react';
import type { Ref } from 'react';
import { ASSETS } from '../constants';
import { formatBalance, formatPlaceholder } from '../lib/format';
import { TokenSelect } from './TokenSelect';
import { WalletIcon } from './icons';
import type { ActiveSource, Asset } from '../types';
import styles from './AmountField.module.css';

interface AmountFieldProps {
  kind: ActiveSource;
  label: string;
  asset: Asset;
  /** The opposite field's asset — locked in this field's dropdown. */
  lockedAsset: Asset;
  value: string;
  balance: number;
  disabled: boolean;
  hasError: boolean;
  isInvalid: boolean;
  helperText?: string;
  /** Id of the error banner, when one is rendered (send field only). */
  bannerId?: string;
  showMax: boolean;
  maxDisabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  onBlur: () => void;
  onAssetChange: (asset: Asset) => void;
  onMax?: () => void;
}

/** E8 — long values step the font size down. */
function valueSizeClass(value: string): string {
  if (value.length > 17) return styles.valueSm;
  if (value.length > 12) return styles.valueMd;
  return '';
}

export function AmountField({
  kind,
  label,
  asset,
  lockedAsset,
  value,
  balance,
  disabled,
  hasError,
  isInvalid,
  helperText,
  bannerId,
  showMax,
  maxDisabled = false,
  inputRef,
  onChange,
  onBlur,
  onAssetChange,
  onMax,
}: AmountFieldProps) {
  const inputId = useId();
  const labelId = useId();
  const balanceId = useId();
  const helperId = useId();

  const { ticker, decimals } = ASSETS[asset];
  const describedBy = [balanceId, helperText ? helperId : '', bannerId ?? '']
    .filter(Boolean)
    .join(' ');

  const cardClasses = [styles.card, hasError ? styles.cardError : '', disabled ? styles.cardDisabled : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <div className={cardClasses}>
        <div className={styles.topRow}>
          <label id={labelId} className={styles.label} htmlFor={inputId}>
            {label}
          </label>
          <div className={styles.balanceRow}>
            <WalletIcon className={styles.walletIcon} />
            <span id={balanceId} className={styles.balance}>
              {formatBalance(balance, decimals)} {ticker}
            </span>
            {showMax && (
              <button
                type="button"
                className={styles.maxChip}
                onClick={onMax}
                disabled={maxDisabled}
              >
                MAX
              </button>
            )}
          </div>
        </div>

        <div className={styles.bottomRow}>
          <TokenSelect
            value={asset}
            lockedAsset={lockedAsset}
            labelId={labelId}
            onSelect={onAssetChange}
          />
          <input
            id={inputId}
            ref={inputRef}
            className={`${styles.value} ${valueSizeClass(value)}`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={formatPlaceholder(asset)}
            value={value}
            disabled={disabled}
            aria-invalid={isInvalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            data-kind={kind}
          />
        </div>
      </div>

      {helperText && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
    </div>
  );
}
