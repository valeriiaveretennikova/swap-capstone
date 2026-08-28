import { useId } from 'react';
import type { Asset } from '../types';
import styles from './CoinIcon.module.css';

/** Brand colours from the SPEC §5.1 asset table. */
const BRAND: Record<Asset, string> = {
  BTC: '#f7931a',
  ETH: '#393939',
  USDC: '#2775ca',
  SOL: 'gradient',
  XRP: '#262c32',
  TRX: '#ff060a',
};

const MONOGRAM: Record<Asset, string> = {
  BTC: 'B',
  ETH: 'E',
  USDC: '$',
  SOL: 'S',
  XRP: 'X',
  TRX: 'T',
};

interface CoinIconProps {
  asset: Asset;
  className?: string;
}

export function CoinIcon({ asset, className }: CoinIconProps) {
  const gradientId = useId();
  const isGradient = BRAND[asset] === 'gradient';

  return (
    <svg
      viewBox="0 0 24 24"
      className={className ? `${styles.icon} ${className}` : styles.icon}
      focusable="false"
      aria-hidden="true"
    >
      {isGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9945ff" />
            <stop offset="100%" stopColor="#14f195" />
          </linearGradient>
        </defs>
      )}
      <circle cx="12" cy="12" r="12" fill={isGradient ? `url(#${gradientId})` : BRAND[asset]} />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontFamily="inherit"
        fontSize="12"
        fontWeight="600"
      >
        {MONOGRAM[asset]}
      </text>
    </svg>
  );
}
