/**
 * Decorative glyphs of the static header chrome (Figma `133:1419`), exported to
 * `src/assets/ui/`. Both are `aria-hidden`: the header is not interactive, so
 * nothing here carries meaning of its own.
 */
interface HeaderIconProps {
  className?: string;
}

/** `wallet.svg` — 20x20, inset 6 in its 32x32 box. The circle behind it is gone. */
export function HeaderWalletIcon({ className }: HeaderIconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      focusable="false"
      aria-hidden="true"
    >
      <path
        d="M10.8333 7.5H5.83333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.3334 9.14164V10.8584C18.3334 11.3167 17.9667 11.6917 17.5 11.7083H15.8667C14.9667 11.7083 14.1417 11.05 14.0667 10.15C14.0167 9.62499 14.2167 9.13332 14.5667 8.79166C14.875 8.47499 15.3 8.29168 15.7667 8.29168H17.5C17.9667 8.30834 18.3334 8.68331 18.3334 9.14164Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5667 8.79166C14.2167 9.13332 14.0167 9.62499 14.0667 10.15C14.1417 11.05 14.9666 11.7083 15.8666 11.7083H17.5V12.9167C17.5 15.4167 15.8333 17.0833 13.3333 17.0833H5.83333C3.33333 17.0833 1.66667 15.4167 1.66667 12.9167V7.08333C1.66667 4.81667 3.03334 3.23333 5.15834 2.96666C5.375 2.93333 5.6 2.91667 5.83333 2.91667H13.3333C13.55 2.91667 13.7583 2.92499 13.9583 2.95832C16.1083 3.20832 17.5 4.8 17.5 7.08333V8.29168H15.7667C15.3 8.29168 14.875 8.47499 14.5667 8.79166Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** `settings.svg` — 24x24 gear. */
export function SettingsIcon({ className }: HeaderIconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      focusable="false"
      aria-hidden="true"
    >
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
