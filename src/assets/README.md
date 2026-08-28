# Design assets

Original SVGs exported from Figma file `Bw2TEVGyo2298cbcRUQKlc`. They are the
**source** of the inline React components in `src/components/` — the app never
loads them at runtime except for the two logo files, which are imported by
`AppHeader` as image URLs.

Keeping the exports in the repo means an icon can be re-generated or diffed
against the design without re-opening Figma.

## `coins/` — asset brand marks (SPEC §11.10, Figma frame `136:2275`)

| File | Figma node | Inline component |
| --- | --- | --- |
| `btc.svg` | `7:5220` Bitcoin-coin | `src/components/coins/BtcIcon.tsx` |
| `eth.svg` | `7:6832` Ethereum-coin | `src/components/coins/EthIcon.tsx` |
| `usdc.svg` | `7:7063` USD-coin | `src/components/coins/UsdcIcon.tsx` |
| `sol.svg` | `7:7002` Solana-coin | `src/components/coins/SolIcon.tsx` |
| `xrp.svg` | `7:7085` XRP-coin | `src/components/coins/XrpIcon.tsx` |
| `trx.svg` | `7:7039` TRON-coin | `src/components/coins/TrxIcon.tsx` |

Each glyph is `40 × 40` and already contains its own circular background, so it
is never wrapped in an extra coloured circle. Rendered at `28` in the currency
selector, `24` in dropdown items and `22` in summary rows.

## `ui/` — success mark and header chrome

| File | Figma node | Used by |
| --- | --- | --- |
| `success.svg` | `133:1500` `success` | `src/components/SuccessIcon.tsx` |
| `logo-mark.svg` | `133:1419` logo | `AppHeader` (`<img>`) |
| `logo-wordmark.svg` | `133:1419` `CLEAN WALLET` | `AppHeader` (`<img alt="CLEAN WALLET">`) |
| `wallet.svg` | `133:1419` wallet glyph | `headerIcons.tsx` → `HeaderWalletIcon` |
| `settings.svg` | `133:1419` gear | `headerIcons.tsx` → `SettingsIcon` |

Notes:

- The client's header revision hid the avatar, the ellipse behind the wallet
  glyph and the dropdown arrow, so the right side is now wallet glyph → total
  balance → gear. `avatar-gradient.svg`, `wallet-circle.svg` and
  `chevron-down.svg` were deleted along with their inline components. The
  currency selector's chevron is unrelated: `icons.tsx` → `ChevronIcon`.
- `success.svg` still carries the canvas rectangle, the card path and the
  `shadow/form` filter of the frame it was exported from. Only the two paths of
  the `success` group (the `96 × 96` ring and the check) are inlined; the ring
  thickness therefore comes from the design instead of being measured off a
  render (OQ-14).
