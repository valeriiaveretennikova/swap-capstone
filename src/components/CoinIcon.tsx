import type { ComponentType } from 'react';
import { BtcIcon } from './coins/BtcIcon';
import { EthIcon } from './coins/EthIcon';
import { SolIcon } from './coins/SolIcon';
import { TrxIcon } from './coins/TrxIcon';
import { UsdcIcon } from './coins/UsdcIcon';
import { XrpIcon } from './coins/XrpIcon';
import type { CoinGlyphProps } from './coins/types';
import type { Asset } from '../types';
import styles from './CoinIcon.module.css';

/**
 * SPEC §11.10 — the real brand marks from Figma `136:2275`, inline so they need
 * no network request. Each glyph already carries its own circular background;
 * it is never wrapped in an extra coloured circle.
 */
const GLYPHS: Record<Asset, ComponentType<CoinGlyphProps>> = {
  BTC: BtcIcon,
  ETH: EthIcon,
  USDC: UsdcIcon,
  SOL: SolIcon,
  XRP: XrpIcon,
  TRX: TrxIcon,
};

interface CoinIconProps {
  asset: Asset;
  /** 28 in the CurrencySelector, 24 in dropdown items, 22 in summary rows. */
  size: number;
}

export function CoinIcon({ asset, size }: CoinIconProps) {
  const Glyph = GLYPHS[asset];
  return <Glyph size={size} className={styles.icon} />;
}
