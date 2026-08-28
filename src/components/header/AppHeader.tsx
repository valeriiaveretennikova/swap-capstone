import { formatPortfolioUsd } from '../../lib/portfolio';
import logoMark from '../../assets/ui/logo-mark.svg';
import logoWordmark from '../../assets/ui/logo-wordmark.svg';
import { HeaderWalletIcon, SettingsIcon } from './headerIcons';
import type { Prices } from '../../types';
import styles from './AppHeader.module.css';

/** Shown until the first prices arrive — never a zero total. */
const NO_VALUE = '—';

interface AppHeaderProps {
  prices: Prices | null;
}

/**
 * Static page chrome from Figma `133:1419` (1440x64): logo left, then the wallet
 * glyph, the total balance and the gear flush right. It is deliberately
 * non-interactive: nothing here is a button or a link, because none of it has
 * behaviour, and a control that does nothing is worse than no control. Both
 * glyphs are decorative, so the balance keeps a visually hidden label — next to
 * a wallet icon a bare number says nothing on its own.
 */
export function AppHeader({ prices }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <span className={styles.logo}>
        <img src={logoMark} alt="" className={styles.logoMark} />
        <img src={logoWordmark} alt="CLEAN WALLET" className={styles.logoWordmark} />
      </span>

      <div className={styles.menu}>
        <div className={styles.balance}>
          <span className={styles.walletBadge}>
            <HeaderWalletIcon />
          </span>
          <span className={styles.balanceText}>
            <span className="sr-only">Total balance </span>
            {prices === null ? NO_VALUE : formatPortfolioUsd(prices)}
          </span>
        </div>

        <SettingsIcon className={styles.settings} />
      </div>
    </header>
  );
}
