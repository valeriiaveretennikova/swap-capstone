# SPEC — Swap (internal crypto exchange, 0% fee)

> Sources of truth, in priority order:
> 1. **Figma `Bw2TEVGyo2298cbcRUQKlc`** — for everything visual: layout, sizes, spacing, tokens, structure. The `Flow` frame `136:1942` holds all four assembled screens. See §11.
> 2. `BRIEF.md` — for numbers and logic: assets, minimums, decimals, formulas, rate direction, polling.
> 3. This SPEC resolves gaps and conflicts. Where a value is invented, it is tagged **[FALLBACK]**.
>
> **The numbers printed in the Figma mock are illustrative and must NOT be copied.** Balances, amounts, order id, date and the rate direction shown in the mock are placeholder content. All figures and calculation logic are already approved and come from `BRIEF.md`. See §11.11 for the explicit do-not-copy list.
>
> Target stack: **Vite + React + TypeScript**. No UI library, no state manager, no routing library, no Storybook.

---

## 1. What we are building

A single-page web app "Swap": an internal crypto exchange form for 6 assets with 0% service fee. The user picks a send asset and a receive asset, types an amount in either field, sees a live cross-rate polled from Binance every 10 s, confirms on a rate-locked confirmation step, and lands on a success step with an Order ID.

**All three steps happen inside one card.** There is no modal, no overlay and no dialog anywhere in this app — the card swaps its own contents (§8.6, §16.1 → RD-6).

This is a **page/application**, not a reusable published component. Balances are mocked in the client; there is no backend. The only real network call is the public Binance ticker endpoint.

---

## 2. Scope

### In scope
- **One card with three views** switched in place: `form` → `confirm` → `success`. No modal, no overlay, no dialog.
- 6 assets: BTC, ETH, USDC, SOL, XRP, TRX, with their real brand icons from Figma (§11.10).
- Live USD prices from Binance, 10 s polling, cross-rate math.
- Bidirectional amount calculation with `activeSource` lock.
- Swap-direction arrow overlapping the seam between the two amount cards, MAX chip, token dropdowns where every option is selectable and a collision auto-moves the opposite field (§8.5).
- Validation: below-minimum, insufficient funds (against mock balances).
- Confirm view with a 10 s quote-lock countdown and auto rate refresh, stacked `Confirm Exchange` / `Back` buttons.
- Rate line with an always-present **progress ring** that fills as the time to the next rate refresh runs out, positioned directly above the CTA.
- Success view with generated Order ID, copy-to-clipboard, timestamp, `Done` reset.
- **The top header bar** — `CLEAN WALLET` logo, total balance, wallet address, settings glyph. Added at the client's request; **static, non-interactive chrome** with one live value (the computed total balance). See §11.13 and RD-13.
- Full keyboard + screen-reader support, visible focus, responsive down to 320 px.
- Loading / error / offline handling for the rate feed.

### Explicitly NOT in scope
- Auth, wallets, sessions, user profile, any real backend or order submission.
- Persisting anything (no `localStorage`, no URL state). A page reload resets everything.
- Balance mutation after an exchange — mock balances are constant (see §5.2).
- Transaction history, order lookup, cancelling an order.
- Fiat-equivalent line under the amount (the Figma `Fiat Equivalent` component is unused).
- Network fee / `Total` summary row (the Figma `Summary Row / Emphasis=Total` variant is unused; the brief defines service fee = 0 only). See Open Question OQ-6.
- Search / filter inside the token dropdown.
- Dark theme, theming, i18n, RTL. Copy is English-only, LTR-only.
- Charts, price history, slippage, gas estimation, min/max on the *receive* side.
- Storybook, visual-regression tooling, e2e test suite.
- Animated screen transitions beyond the transitions listed in §12.
- **Modals, dialogs, overlays, backdrops, bottom sheets** — removed by client decision (RD-6). Nothing in this app renders on top of the page.
- **Any interactivity in the header** — no account menu opens, no settings panel, no address copy, no navigation. The header is in scope as static chrome only; every glyph in it is decorative (§11.13, RD-13).
- **An avatar, a wallet address and a dropdown chevron in the header** — all removed from the design by the client (RD-18). The header's right side is a wallet glyph, the total balance and a gear glyph, nothing else.

---

## 3. Screens & component tree

**One card, three views.** The card element is the same DOM node in all three states; only its children change. Nothing is ever portalled, positioned `fixed` or rendered above the page.

```
<App>                                      view: 'form' | 'confirm' | 'success'
 ├ <SiteHeader>                            1440x64 banner, static chrome (§11.13)
 │   ├ logo mark + "CLEAN WALLET" wordmark
 │   └ menu: total balance (computed) | wallet label | gear glyph
 │                                        zero interactive elements
 └ <main>                                  page background (§11.9)
    └ <ExchangeCard>                       460x480, one container for all views (§11.7)
       ├ view === 'form'
       │   ├ <TitleRow>       h1 "Exchange"
       │   ├ <Content>                     380x224
       │   │   ├ <AmountField kind="send">        380x84
       │   │   │   ├ label "You send"
       │   │   │   ├ <BalanceRow>          wallet icon + balance + <MaxChip>
       │   │   │   ├ <CurrencySelector>    coin 28 + ticker + chevron 24, NO border, NO fill
       │   │   │   │                       all 6 options selectable, none disabled (§8.5)
       │   │   │   ├ <input>               amount, right aligned, NO focus ring of its own
       │   │   │   └ helper text           conditional, §6
       │   │   ├ <AmountField kind="receive">     380x84, gap 8 from the field above
       │   │   └ <SwapArrowButton>         40x40, absolutely positioned OVER the 8px seam
       │   ├ <ErrorBanner>                 conditional, role="alert"
       │   └ <ActionBottom>                380x76
       │       ├ <RateLine>                "1 X ≈ Y Z" + 16px progress ring — ABOVE the CTA
       │       └ <PrimaryButton>           CTA, §7
       ├ view === 'confirm'
       │   ├ <TitleRow>       h1 "Confirm Exchange"
       │   ├ <SummaryList>                 380x192
       │   │   ├ From    label + coin 22 + "82,150 USDC"
       │   │   ├ To      label + coin 22 + "1 BTC"
       │   │   ├ Exchange rate
       │   │   └ Service fee
       │   └ <ActionBottom>                380x108, buttons STACKED
       │       ├ <PrimaryButton>   "Confirm Exchange (0:09)"   (top)
       │       └ <SecondaryButton> "Back"                      (below, gap 12)
       └ view === 'success'
           ├ <SuccessRing>                 96x96 green ring + check, centred
           ├ <TitleRow>       h1 "Exchange Successful", centred
           ├ <SummaryList>                 380x124
           │   ├ Order ID + <CopyButton> 24
           │   ├ Execution date
           │   └ Fee
           └ <ActionBottom>                380x48
               └ <PrimaryButton> "Done"
```

### 3.0 Shared card geometry (Figma `136:1942`)

Identical in all three views — this is what makes the transition feel like one card:

| Property | Value | Source |
| --- | --- | --- |
| Card size | `460 × 480` | Figma `133:1405` |
| Card padding | `40` on all sides | Figma (Title Row at x=40, y=40) |
| Inner content width | `380` (= 460 − 2×40) | Figma |
| Title Row height | `36` | Figma |
| Gap: title → content | `32` | Figma (76 → 108) |
| Gap: content → action block | `32` | Figma |
| Card background | `#ffffff` | Figma `bg/primary` |
| Card radius | `24` | Figma `Radius/XL` |
| Card shadow | `shadow/form`, 5 stacked drop shadows (§11.8) | Figma |
| Horizontal position | centred in the viewport | Figma (x=490, 1440−950=490) |

### 3.1 Screen 1 — Default Empty Form

| Element | Content | State |
| --- | --- | --- |
| Heading (`h1`) | `Exchange`, 28/36 SemiBold `#181818`, left aligned | — |
| You send card | label `You send`, balance row (wallet 16 + `92,514.3 USDC` + `MAX`), `CurrencySelector` `USDC`, input empty with placeholder `≥0.01` | input enabled, MAX enabled |
| Swap arrow | 40×40 white circle with `↓↑`, overlapping the seam, horizontally centred | enabled |
| You receive card | label `You receive`, balance row (wallet 16 + `0.0425 BTC`, **no MAX**), `CurrencySelector` `BTC`, input empty with placeholder `≥0.00000013` | input enabled |
| Error banner | not rendered | — |
| Rate line | `1 USDC ≈ 0.0000092 BTC` + 16px ring, centred, **directly above the CTA** with a `12` gap | ring present but static |
| CTA | `Continue` | **disabled** (`bg #e4e7ec`, text `#98a2b3`, `cursor: not-allowed`) |
| Helper text | not rendered (the `Helper Text` slot is `hidden` in the Figma default) | — |

Before the first successful price fetch, the rate line renders `Loading rate…` and the ring spins; the CTA is disabled (§7, state `rate-loading`).

### 3.2 Screen 2 — Valid Input

Reached when the form state is `valid` (§6). Layout identical to Screen 1.

- You send input holds the typed string exactly as typed, e.g. `100`.
- You receive input holds the computed, grouped value, e.g. `0.00092134`.
- Both cards keep the default border (`1px #0f143733`); no red border, no banner.
- Rate line shows the current rate; the ring is static unless a refresh is in flight.
- **CTA `Continue` is enabled**, `bg #2b7bea`, white text, hover `#276fd3`, pressed `#215eb3`.
- Clicking / pressing Enter or Space on the CTA switches `view` to `'confirm'` — **in place, in the same card**.

### 3.3 Screen 3 — Confirm Exchange (a view, not a modal)

The same card, same size, same position. The form's children unmount and the confirm children mount. **No overlay, no backdrop, no dialog role, no scroll lock, no focus trap** (RD-6).

| Row | Content example | Layout |
| --- | --- | --- |
| Title (`h1`) | **`Confirm Exchange`** | 380×36, left aligned |
| `From` | coin icon 22 + `82,150 USDC` | label left `#6b688c`, value right `#181818`, icon-to-text gap `8` |
| `To` | coin icon 22 + `1 BTC` | same, row gap `12` |
| `Exchange rate` | `1 USDC ≈ 0.0000092134 BTC` | no icon, row gap `12` |
| `Service fee` | `0 BTC` | no icon, row gap `12` |

- Summary List block is `380 × 192`, rows are `22` tall each with a `12` gap. **There is no divider line** between the rows in the redesign — the earlier divider requirement is dropped.
- Row labels: `body-md` 15/22 Regular `#6b688c`. Row values: `body-md` 15/22 Medium `#181818`.
- Only `From` and `To` carry a coin icon (22×22, `radius 999`), placed immediately before the amount.

Actions — `ActionBottom` is `380 × 108`, **buttons stacked vertically**:
- `Confirm Exchange (0:10)` — **top**, primary, full width `380 × 48`, label counts down every second.
- `Back` — **below it**, gap `12`, secondary, full width `380 × 48`, enabled except while submitting.

Disabled/paused sub-states are in §8.6.

### 3.4 Screen 4 — Exchange Successful

The same card again. Form and confirm children unmount; their values stay in state until `Done`.

| Element | Content example | Layout |
| --- | --- | --- |
| Success ring | 96×96 green **ring** (not a filled disc) with a check inside, `#22c55e` | centred horizontally, at the top of the card body |
| Heading (`h1`) | **`Exchange Successful`** | 380×36, **centred**, 28/36 SemiBold |
| `Order ID` | `7QK2M9XA4TB1` + 24×24 copy icon button at the far right | row 24 tall, copy button gap `4` from the value |
| `Execution date` | `28.08.2026, 14:07` | row gap `12` |
| `Fee` | `0 BTC` | row gap `12` |
| CTA | `Done`, primary, enabled, full width `380 × 48` | — |

- Gap: success ring → title `32`; title → summary list `32`; summary list → `Done` `32`.
- Summary List block is `380 × 124`.
- There is **no** `{SEND} → {RECEIVE}` summary line on this screen in the redesign — the Figma success frame shows only `Order ID`, `Execution date` and `Fee`. The earlier summary line requirement is dropped.
- Nothing on this screen is disabled. Rate polling is stopped while this view is mounted.

---

## 4. Data model

```ts
type Asset = 'BTC' | 'ETH' | 'USDC' | 'SOL' | 'XRP' | 'TRX';
type ActiveSource = 'send' | 'receive';
type RatesStatus = 'loading' | 'ready' | 'refreshing' | 'error';
type FormState =
  | 'empty' | 'typing' | 'valid'
  | 'below-min' | 'insufficient-funds'
  | 'rate-loading' | 'rate-error';

interface AssetSpec {
  ticker: Asset;
  name: string;          // 'Bitcoin'
  minAmount: number;
  decimals: number;
  binanceSymbol: string; // 'BTCUSDT'
}

interface AppState {
  view: 'form' | 'confirm' | 'success';
  sendAsset: Asset;          // default 'USDC'
  receiveAsset: Asset;       // default 'BTC'
  sendRaw: string;           // exactly what is in the send input
  receiveRaw: string;        // exactly what is in the receive input
  activeSource: ActiveSource;// default 'send'
  prices: Record<Asset, number> | null;
  ratesStatus: RatesStatus;
  consecutiveFetchFailures: number;
  isSubmitting: boolean;
  order: { id: string; date: Date; from: string; to: string; rateText: string } | null;
}
```

There is **no `isModalOpen`** flag — the confirm step is a value of `view`, not an overlay on top of another view. A single `view` variable drives which children the card renders.

`FormState` is **derived** (a pure function of the state above), never stored. No state manager: `useState` + `useEffect` + a couple of custom hooks (`usePrices`, `useCountdown`) are sufficient.

---

## 5. Constants

### 5.1 Asset table (from BRIEF §1)

| Asset | Name | Min amount | Decimals | Binance symbol | Brand colour (Figma) |
| --- | --- | --- | --- | --- | --- |
| BTC | Bitcoin | `0.00000013` | 8 | `BTCUSDT` | `#F7931A` |
| ETH | Ethereum | `0.000004` | 6 | `ETHUSDT` | `#393939` |
| USDC | USD Coin | `0.01` | 2 | `USDCUSDT` | `#2775CA` |
| SOL | Solana | `0.000094` | 6 | `SOLUSDT` | gradient |
| XRP | Ripple | `0.007` | 4 | `XRPUSDT` | `#262C32` |
| TRX | Tron | `0.03` | 2 | `TRXUSDT` | `#FF060A` |

Ticker for USD Coin is strictly `USDC` (BRIEF §4). Ticker for Tron is strictly `TRX` (BRIEF §1). Both are confirmed by the client and corrected in Figma — `TRC` no longer exists anywhere and must not appear in code (see §16 → RD-1).

### 5.2 Mock balances **[FALLBACK — not in BRIEF, not in Figma]**

Constant, never mutated (an exchange does not change them).

```ts
const MOCK_BALANCES: Record<Asset, number> = {
  BTC:  0.0425,
  ETH:  1.25,
  USDC: 92514.30,   // raised at the client's request — see RD-17
  SOL:  12.5,
  XRP:  300,
  TRX:  1500,
};
```

The USDC balance was raised from `2500` to **`92514.30`** at the client's request (RD-17). The other five are unchanged. The header total balance is derived from this map (§11.13), so it follows automatically — no separate figure to update.

Reproducible test cases these values guarantee:

| # | Setup | Input / action | Expected |
| --- | --- | --- | --- |
| B1 | `USDC → BTC` (default) | type `100000` in *You send* | **`insufficient-funds`** — above the `92514.30` USDC balance |
| B2 | **`BTC → USDC`** | type `0.05` in *You send* | **`insufficient-funds`** — above the `0.0425` BTC balance |
| B3 | `USDC → BTC` | type `0.005` | `below-min` (`Min amount is 0.01 USDC`) |
| B4 | `USDC → BTC` | type exactly `0.01` (= the USDC minimum) | **`valid`** — the minimum is inclusive (§6) |
| B5 | `USDC → BTC` | type `100` | `valid` |
| B6 | `USDC → BTC` | type `3000` | **`valid`** — this used to be the insufficient-funds case and is now well inside the balance |
| B7 | `USDC → BTC` | click `MAX` | *You send* becomes **`92514.3`** (ungrouped, trailing zero trimmed per §9.1) |
| B8 | `BTC → USDC` | click `MAX` | *You send* becomes `0.0425` |

**B2 is the durable insufficient-funds case.** It runs on the `BTC` balance, which is not expected to change, so it keeps working even if the USDC balance is adjusted again. Prefer it in tests; B1 is the USDC-side equivalent.

### 5.3 Defaults

- `sendAsset = 'USDC'`, `receiveAsset = 'BTC'` — matches both the BRIEF §7 example (`82,150 USDC → 1 BTC`) and the Figma `Default` frame `133:1403`. See OQ-2.
- `activeSource = 'send'`, both inputs empty.
- `POLL_INTERVAL_MS = 10_000`, `FETCH_TIMEOUT_MS = 8_000`, `QUOTE_LOCK_SECONDS = 10`.

---

## 6. Form state machine

`FormState` is computed by the first matching rule (top wins):

| # | Condition | State |
| --- | --- | --- |
| 1 | `ratesStatus === 'error' && prices === null` | `rate-error` |
| 2 | `sendRaw === '' && receiveRaw === ''` | `empty` |
| 3 | active field string is non-empty but not a finite positive number (`'0'`, `'0.'`, `'.'`, `'00'`) | `typing` |
| 4 | `prices === null` (first load not finished) | `rate-loading` |
| 5 | `sendAmount > balance[sendAsset]` | `insufficient-funds` |
| 6 | `sendAmount < minAmount[sendAsset]` | `below-min` |
| 7 | otherwise | `valid` |

`sendAmount = Number(sendRaw)` after normalisation (§9). Validation is **always evaluated on the send side**, regardless of `activeSource`. Rule 5 outranks rule 6 (relevant only when a balance is below the asset minimum).

**Boundary — the minimum is INCLUSIVE.** `sendAmount === minAmount[sendAsset]` is **`valid`**: the CTA reads `Continue` and is enabled. Only `sendAmount < minAmount[sendAsset]` is `below-min`. Implementation: the comparison operator in rule 6 is `<` — never `<=`.

Rationale (client decision, see §16 → RD-2): because amounts are truncated to the asset's decimals, a strict `>` comparison would push the real usable minimum one whole decimal step up (USDC `0.01` → `0.02`, TRX `0.03` → `0.04`), which contradicts the published minimums. Inclusive keeps the published number reachable.

Concrete boundaries per asset — the left value is the largest `below-min` amount, the right value is exactly the minimum and is **valid**:

| Asset | Largest `below-min` amount | Minimum — `valid` |
| --- | --- | --- |
| BTC | `0.00000012` | `0.00000013` |
| ETH | `0.000003` | `0.000004` |
| USDC | — none exists (see §6.2) | `0.01` |
| SOL | `0.000093` | `0.000094` |
| XRP | `0.0069` | `0.007` |
| TRX | `0.02` | `0.03` |

### 6.2 Reachability of `below-min` per asset

`below-min` requires a value that is **both** representable at the asset's `decimals` **and** strictly greater than zero **and** below the minimum. When `minAmount` equals one unit of the last decimal place, no such value exists and the state is unreachable by construction.

| Send asset | Decimals | Min | Smallest representable positive value | `below-min` reachable? | Example that triggers it |
| --- | --- | --- | --- | --- | --- |
| BTC | 8 | `0.00000013` | `0.00000001` | **yes** | `0.00000012` |
| ETH | 6 | `0.000004` | `0.000001` | **yes** | `0.000003` |
| USDC | 2 | `0.01` | `0.01` | **no** | — impossible |
| SOL | 6 | `0.000094` | `0.000001` | **yes** | `0.000093` |
| XRP | 4 | `0.007` | `0.0001` | **yes** | `0.0069` |
| TRX | 2 | `0.03` | `0.01` | **yes** | `0.02` (also `0.01`) |

- **USDC is the only asset where `below-min` cannot occur.** Its minimum *is* the smallest representable value, so anything smaller sanitises to `0.00` → parses to `0` → §6 rule 3 returns `typing`, never `below-min`. Any test case of the form "type `0.009` in USDC and expect `below-min`" is **invalid** — the sanitiser truncates `0.009` to `0.00` (§9 rule 6).
- This is a correct consequence of the asset table, **not a bug in the validation code**. Do not introduce an epsilon, a hidden extra decimal or a special-cased comparison to make the state appear for USDC.
- **TRX is reachable** despite also having `decimals: 2`, because its minimum (`0.03`) is three units of the last decimal place: `0.01` and `0.02` are both valid input and both `below-min`.
- The CTA label `Min amount is 0.01 USDC` therefore never renders in practice. That is acceptable: the code path is identical for all six assets and stays correct if the USDC minimum or its decimals ever change.

### 6.1 Per-state rendering contract

| State | Send card | Receive card | Banner | Helper under send card | Rate line | CTA |
| --- | --- | --- | --- | --- | --- | --- |
| `empty` | default border, placeholder `≥{MIN_send}` | default border, placeholder `≥{MIN_receive}` | — | — | rate or `Loading rate…` | `Continue`, disabled |
| `typing` | default border, typed chars | passive field cleared to `''` | — | — | rate | `Continue`, disabled |
| `valid` | default border | default border, computed value | — | — | rate | `Continue`, **enabled** |
| `below-min` | default border | computed value | — | `Minimum amount is {MIN} {SEND_ASSET}` in `#6b688c` | rate | `Min amount is {MIN} {SEND_ASSET}`, disabled |
| `insufficient-funds` | **2px `#FF4D4D` border** | default border, computed value | **visible**, below the receive card | — | rate | `Continue`, disabled |
| `rate-loading` | default border, inputs **enabled** | default border, inputs enabled | — | — | `Loading rate…` + spinner | `Continue`, disabled, 16px spinner before label |
| `rate-error` | default border, inputs **disabled** (`input-field/*-disabled` tokens) | disabled | **visible**, variant `rate-error` with a `Retry` text button | — | `Rate unavailable` | `Rate unavailable`, disabled |

#### Card border precedence (focus vs. error)

The amount card has exactly **one** border at a time. When conditions overlap, the first match wins:

| Priority | Condition | Card border |
| --- | --- | --- |
| 1 | `insufficient-funds` on the send card — **even while its input is focused** | `2px #FF4D4D` |
| 2 | The card's input is focused | `2px #2b7bea` |
| 3 | Disabled (`rate-error`) | `1px #e4e7ec` |
| 4 | Default | `1px #0f143733` |

**Red beats blue.** A focused card that is also in `insufficient-funds` shows the red border only — never blue, never both, never a blue ring around a red border. The error is the more important signal and must stay visible while the user edits the offending field.

The focus ring described in §11.6 is applied to the **card**, not to the `<input>` (see §11.7).

Error banner (`insufficient-funds`) — exactly per BRIEF §6A:
- container: `background #FFF0F0`, `border-radius 12px`, `padding 12px 16px`, `gap 8px`, `margin-top 8px`;
- icon: Figma `24/important` info-circle, `#D32F2F`, `aria-hidden="true"`;
- text: `#D32F2F`, 12/16 Poppins Regular, content **verbatim**: `There are insufficient funds in your account. Please top up your balance.`

Error banner (`rate-error`) **[FALLBACK — not in BRIEF]** — same container styling, text: `Unable to load exchange rates. Check your connection and try again.` plus a `Retry` text button (`#D32F2F`, underlined) that triggers an immediate fetch.

The below-min message is duplicated as helper text because the disabled CTA (`#98a2b3` on `#e4e7ec`, ~2.2:1) is not a WCAG-conformant carrier for information.

---

## 7. CTA button — exact behaviour

Component: Figma `Button / Style=Primary`, size lg (`height 48`, `padding-x 24`, `radius 8`, label Poppins Medium 16/24). Full width of the card.

| Form state | Label | `disabled` | Background | Label colour |
| --- | --- | --- | --- | --- |
| `empty` | `Continue` | `true` | `#e4e7ec` | `#98a2b3` |
| `typing` | `Continue` | `true` | `#e4e7ec` | `#98a2b3` |
| `rate-loading` | `Continue` (+ spinner) | `true` | `#e4e7ec` | `#98a2b3` |
| `rate-error` | `Rate unavailable` | `true` | `#e4e7ec` | `#98a2b3` |
| `insufficient-funds` | `Continue` | `true` | `#e4e7ec` | `#98a2b3` |
| `below-min` | `Min amount is {MIN} {SEND_ASSET}` | `true` | `#e4e7ec` | `#98a2b3` |
| `valid` | `Continue` | `false` | `#2b7bea` | `#ffffff` |

- `{MIN}` is printed exactly as in the asset table, no trailing-zero padding, no grouping: `Min amount is 0.00000013 BTC`, `Min amount is 0.01 USDC`, `Min amount is 0.03 TRX`.
- **The CTA label carries no comparison sign at all.** Because the minimum is inclusive (§6), `Min amount is >0.01 USDC` would be misinformation — `0.01` is accepted. The bare form `Min amount is 0.01 USDC` is already unambiguous, so no sign is added.
- **The character `>` must not appear anywhere in the UI copy** — not on the button, not in the helper text, not in a placeholder, not in the confirm view or the success view. The input placeholders use `≥` (U+2265) per the current Figma design; see §9.2 for the six exact strings. Any `>` found in a rendered string is a defect. The earlier instruction to preserve `>` in the placeholders is **cancelled** — it predates both the inclusive-minimum decision and the design fix.
- The label uses the **send** asset, always.
- Enabled interactions: hover `#276fd3`, active/pressed `#215eb3`, `transition: background-color 150ms ease`.
- `focus-visible`: `box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px #2b7bea` (Figma `focus/ring`: 4px ring + 2px gap), `outline: none`.
- Disabled: `pointer-events` stay on so the cursor shows `not-allowed`; the element is a real `<button disabled>` so it is removed from the tab order.
- Only in `valid` does a click switch `view` to `'confirm'`. There is no other side effect.

---

## 8. Behaviour

### 8.1 Rate feed

- Endpoint: `GET https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","USDCUSDT","SOLUSDT","XRPUSDT","TRXUSDT"]` (the endpoint from BRIEF §2, narrowed with the `symbols` param so the response is ~6 rows instead of ~3000).
- Response `[{ symbol, price }]` → `prices[asset] = Number(price)`. A row that is missing or parses to `NaN`/`0` makes the whole fetch a failure.
- Cross rate: `rate(A→B) = prices[A] / prices[B]`.
- Poll: first fetch on mount, then every **10 000 ms**. Implemented as a self-rescheduling `setTimeout` (never overlapping requests), aborted via `AbortController` after **8 000 ms**.
- Polling is **paused** while: `view === 'confirm'` (the confirm view owns its own refresh), `document.hidden === true`, or `view === 'success'`. On `visibilitychange → visible` and on `window online`, fire an immediate fetch and resume.
- A refresh **never** clears or rewrites typed input. Only the passive field is recomputed (§8.2).
- Status transitions:
  - first fetch in flight → `loading`; success → `ready`; failure → `error`.
  - later fetch in flight → `refreshing` (spinner visible, everything stays interactive); success → `ready`, `consecutiveFetchFailures = 0`; failure → `consecutiveFetchFailures++`.
  - `prices !== null && consecutiveFetchFailures >= 1` → keep the form fully usable, render `Rate may be outdated` under the rate line in `#6b688c` 12/16.
  - `consecutiveFetchFailures >= 3` (~30 s of failures) → set `prices = null` and `ratesStatus = 'error'` ⇒ form state `rate-error`.
- Rate line format: `1 {SEND_ASSET} ≈ {rate} {RECEIVE_ASSET}`, `rate` via `Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 })`. Text: `body-2sm` 12/16 Regular, `#6b688c` (Figma `133:1413`).

#### Rate ring — a PROGRESS indicator (Figma `133:1415`)

The ring is **not** a plain busy spinner. It **fills up as the time until the next rate refresh runs out**, so the user can see how fresh the displayed rate is and when it will change. A ring that only span during the request was the reported defect.

**Geometry (unchanged, from §11):** `16 × 16`, thickness `2`, track `#e0e0ec` (Figma `--rate-timer-ring-track`), progress `#2b7bea` (Figma `--rate-timer-ring-progress`), gap `8` after the rate text, positioned above the `Continue` button. Always rendered, in every rate state.

**Progress model:**

| Phase | Ring behaviour |
| --- | --- |
| Counting down to the next refresh | **Determinate fill `0% → 100%`** over `POLL_INTERVAL_MS` (`10 000 ms`), measured from the moment the *previous* request started |
| Request in flight (at `100%`) | **Indeterminate** — rotates. There is no remaining time left to represent, so a fill value would be meaningless |
| Successful response | Progress **resets to `0%`** and immediately begins filling again |
| Polling paused — `view === 'confirm'`, `document.hidden`, `view === 'success'` | **Frozen** at its current value. It neither rotates nor advances, because no refresh is coming. On resume it continues from the fresh cycle that the immediate refetch starts |
| `rate-error` | **Track only, no progress, no rotation.** Nothing is counting down, because there is no successful refresh cycle to count towards. A frozen or spinning ring here would imply an update is imminent, which is false |
| Background refresh failed but cached prices remain (`consecutiveFetchFailures >= 1`) | Treated like a normal cycle: progress resets to `0%` and counts towards the next retry, since a retry *is* scheduled |

**The progress value must come from the same source that drives the polling schedule.** A second, independent timer would drift and the indicator would stop matching reality — that is the specific failure mode to avoid. Concretely: the poll scheduler and the ring read the same cycle-start timestamp, so `progress = (now − cycleStartedAt) / POLL_INTERVAL_MS`, clamped to `[0, 1]`. The exact rendering technique is left to the builder (SVG `stroke-dasharray`, a conic gradient, or a CSS animation whose duration and play-state are bound to the scheduler) — only the timing contract is mandated.

**`prefers-reduced-motion: reduce`:**
- The **determinate fill is kept.** It conveys information — how stale the rate is — and is not decoration. It may be stepped rather than continuously interpolated (for example updated a few times per second instead of per frame), but it must still advance.
- The **indeterminate rotation is removed.** While a request is in flight the ring holds at `100%` instead of spinning.

`aria-hidden="true"` — the ring duplicates no unique information; the rate text next to it is the accessible content, and rate updates are deliberately not announced (§14 Live regions).

#### Position of the rate line

The rate line (text + ring) sits **directly above the CTA button**, inside the `ActionBottom` block:

- `ActionBottom` is `380 × 76`: rate row at `y = 0` (height 16), CTA at `y = 28` (height 48) ⇒ **gap 12** between them.
- The rate row is **horizontally centred** in the 380px content width (Figma: x = 111.5 for a 157px row).
- This order — rate above, button below — is mandatory. The rate line must not be placed above the amount cards, beside the CTA, or below it.

### 8.2 Bidirectional calculation

`activeSource` decides which field the user owns and which one the app writes.

```
activeSource === 'send'    → receiveRaw = trunc(sendAmount    * prices[send] / prices[receive], dec[receive])
activeSource === 'receive' → sendRaw    = trunc(receiveAmount * prices[receive] / prices[send], dec[send])
```

- `trunc(x, d)` = truncate toward zero to `d` fraction digits (not round). Applied consistently to both directions; the user is never shown more than the asset can hold.
- **The active field's string is never rewritten by a recalculation.** This is the only loop guard needed. Writing to the passive field must not set `activeSource`.
- Recalculation runs on: (a) the active input's `onChange`, (b) every successful price update, (c) a change of either asset, (d) the swap arrow, (e) `MAX`, (f) each quote refresh in the confirm view.
- If the active field is empty or unparseable, the passive field is set to `''` (never `NaN`, never `0`).
- If `prices === null`, the passive field stays `''` and the typed value is preserved; as soon as prices arrive, the passive field fills in.
- The passive field is displayed grouped (`Intl.NumberFormat('en-US', { maximumFractionDigits: dec })`); the active field is displayed exactly as typed (ungrouped). Editing the passive field flips `activeSource` on its first keystroke, at which point it becomes ungrouped. See OQ-4.

### 8.3 Swap arrow — the 4 steps of BRIEF §4

On click (or Enter/Space):
1. `[sendAsset, receiveAsset] = [receiveAsset, sendAsset]`.
2. `sendRaw = normalise(previous receiveRaw)` (strip grouping separators), `receiveRaw = previous sendRaw`.
3. `activeSource = 'send'`.
4. Recalculate `receiveRaw` from the new `sendRaw` with the new direction (this overwrites step 2's `receiveRaw`, which is intended — step 2 only guarantees the send field carries the previous receive value).

Then:
- Re-truncate `sendRaw` to the new send asset's `decimals` if it now has too many fraction digits.
- Re-derive `FormState` against the new send asset's balance and minimum — an insufficient-funds error can appear or disappear as a result.
- If both fields were empty: only the assets swap; both fields stay empty and the placeholders update.
- Icon rotates 180° over `transition: transform 200ms ease`; suppressed under `prefers-reduced-motion`.

#### Placement — overlays both cards (Figma `133:1408`)

The button is **not** a flow item between the two amount cards. It is absolutely positioned on top of the seam and visually overlaps both cards.

| Property | Value | Source |
| --- | --- | --- |
| Gap between the two amount cards | **exactly `8`** | Figma (field 1 ends at y=84, field 2 starts at y=92) |
| Button size | `40 × 40` | Figma `133:1411` |
| Button top offset within the `Content` block | `68` | Figma |
| Seam centre | `88` — the button's centre (68 + 20) sits exactly on it | derived |
| Overlap onto each card | `16` px above and `16` px below | derived (84 − 68 = 16; 108 − 92 = 16) |
| Horizontal | centred: `left: 50%; transform: translateX(-50%)` (Figma x=170 of 380) | Figma |

Implementation: the `Content` wrapper is `position: relative`; the button is `position: absolute; top: 68px; left: 50%; transform: translateX(-50%)`. It must **not** consume vertical space — the two cards stay `8` px apart regardless of the button.

Because it sits over the seam, it needs to read cleanly above both card edges:
- `z-index: 1` relative to the amount cards (which stay at the default stacking level). No other element in the card competes for stacking, so `1` is sufficient — do not introduce large arbitrary values.
- Opaque `background: #ffffff` (Figma `icon-button/bg/default`) so the card edges do not show through.
- `border: 1px solid #cccade` (Figma `icon-button/border/default-stroke`) so it separates from the `#f7f6fa` cards behind it.
- `border-radius: 999` (Figma `icon-button/radius/lg`).
- When the token dropdown is open, the dropdown list must render **above** the swap button — the list gets a higher stacking level than `1`.

Full button spec: `40 × 40`, `radius 999`, `bg #ffffff`, `border 1px #cccade`, icon `#181818` at `16 × 16` (Figma `Reverse` symbol); hover `bg #f7f6fa` / icon `#276fd3`; pressed `bg #e4e7ec` / icon `#215eb3`; focus ring per §11.6. Disabled only in `rate-error` (icon `#98a2b3`, border `#e4e7ec`).

### 8.4 MAX chip

Rendered only inside the **You send** card, in the balance row. Style: text-only chip, Poppins SemiBold 12/16, `#2b7bea`, `radius 999`, hover `#276fd3`, pressed `#215eb3`, disabled `#98a2b3`.

On click:
1. `activeSource = 'send'`.
2. `sendRaw = format(MOCK_BALANCES[sendAsset], dec[sendAsset])` — fixed notation, trailing zeros trimmed, **no grouping** (`92514.3`, `0.0425`).
3. Recalculate `receiveRaw` immediately.
4. Because `sendAmount === balance`, rule 5 of §6 no longer matches ⇒ an active `insufficient-funds` error and its red border and banner **disappear in the same render**. CTA validity is re-evaluated (it becomes `valid` unless the balance is strictly below the asset minimum, in which case `below-min` — the minimum itself is valid, §6).

Disabled when `MOCK_BALANCES[sendAsset] === 0` or form state is `rate-error`.

### 8.5 Token dropdowns

- Trigger: coin icon (24px, `radius 999`) + ticker (Poppins SemiBold 15/22, `#181818`) + chevron 24px. `bg #f7f6fa`, `radius 8`, hover `bg #f7f6fa`; chevron flips to the `Dropup` glyph while open.
- List: `bg #ffffff`, `border 1px #0f143733`, `radius 12`, `padding 12`, item gap 4, `box-shadow: 0 6px 8px #21201f0a`. Anchored below the trigger, `z-index` above the cards; if it would overflow the viewport bottom, it flips above.
- Item: `padding 8`, `radius 8`, `gap 8` — 24px coin icon, ticker `#181818` Medium 14/20, full name `#6b688c` Regular 14/20. Selected item shows a `#2b7bea` check at the right. Hover/focus background `#f7f6fa`.
#### No option is ever disabled

**All 6 options are always selectable in both dropdowns.** There is no disabled, greyed-out or unselectable option, and `aria-disabled` must not appear on any option under any circumstance. This **overrides BRIEF §4**, which required disabling the opposite field's asset (see §16.1 → RD-4).

- The asset selected in **this** field is marked with a `#2b7bea` check and `aria-selected="true"`, and stays fully clickable. The check alone communicates the selection; nothing is disabled.
- The asset selected in the **opposite** field is rendered exactly like any other option — normal colours, normal cursor, fully selectable.

#### Selecting an asset

Let `field` be the dropdown's own field (`send` or `receive`), `other` the opposite field, and `picked` the chosen asset.

1. **Re-pick of the same asset** — if `picked === asset[field]`: close the list, return focus to the trigger, **no-op otherwise**. No state change, no recalculation, no re-render of amounts, no form-state re-derivation.
2. **Collision — `picked === asset[other]`:** set `asset[field] = picked`, then **auto-move the opposite field** to the first asset in `ASSET_LIST` that is not `picked`:

   ```ts
   const ASSET_LIST: Asset[] = ['BTC', 'ETH', 'USDC', 'SOL', 'XRP', 'TRX']; // order from §5.1
   asset[other] = ASSET_LIST.find(a => a !== picked)!;
   ```

   The first candidate is therefore always `BTC`; if `BTC` is the asset just picked, the opposite field becomes `ETH`.
3. **No collision** — `picked` differs from both current assets: set `asset[field] = picked`; the opposite field is untouched.
4. In cases 2 and 3, then: re-truncate that field's raw value to the new `decimals` if the field is the active one → recalculate the passive field → re-derive form state (balance and minimum change) → update both placeholders (§9.2) → close the list and return focus to the trigger.

**Amounts behave exactly as in case 3** — the active field keeps the typed value, the passive field is recomputed at the new rate. The auto-move introduces **no** additional rule for amounts; it is the same asset-change path already described in step 4 and in §10 E9.

The rule is **symmetric**: a change in `You receive` shifts `You send` in exactly the same way.

#### Agreed examples (verbatim)

| Before | Action | After |
| --- | --- | --- |
| `USDC → BTC` | in `You send` pick `BTC` | `BTC → ETH` |
| `USDC → BTC` | in `You receive` pick `USDC` | `BTC → USDC` |
| `ETH → SOL` | in `You send` pick `SOL` | `SOL → BTC` |

#### Invariant

`sendAsset !== receiveAsset` always holds — an identical pair such as `BTC → BTC` is unreachable. **The mechanism has changed: the invariant is now maintained by the auto-move, not by forbidding the selection.** This is the main behavioural difference from BRIEF §4 and the single most important thing to get right in this section.

- Closes on: selection, re-pick of the same asset, `Esc`, `Tab`, outside click, scroll of the page.

### 8.6 Confirm view & quote-lock timer

**This is a view swap inside the card, not a modal.** Entering it means `view = 'confirm'`: the form children unmount, the confirm children mount in the same `<ExchangeCard>`. Explicitly **absent**: overlay element, backdrop, `role="dialog"`, `aria-modal`, focus trap, `inert` on anything, `body { overflow: hidden }`, portal, `position: fixed`. See RD-6.

Enter: only from an enabled CTA. On entry — snapshot the current amounts and rate into the confirm rows, pause background polling, move focus per §14 ("View transitions").

Countdown:
- Starts at `10`, label `Confirm Exchange (0:10)`, decrements once per second: `(0:09) … (0:01)`.
- Format is `0:SS` zero-padded (`0:09`, `0:10`).
- **At `0:00`:**
  1. **pause** — Confirm becomes `disabled`, label `Refreshing rate…`, `Back` stays enabled;
  2. **fetch a fresh rate** — one-off call to the same endpoint with the same 8 s timeout;
  3. **recalculate** — using the locked `activeSource`, recompute the passive amount and the displayed `From` / `To` / `Exchange rate` rows;
  4. **restart** — timer back to `10`, Confirm re-enabled, label `Confirm Exchange (0:10)`.
- Refresh failure: keep the previous rate, render `Could not refresh rate, using last known rate` below the rows in `#D32F2F` 12/16, and restart the timer anyway. After **2 consecutive** failures in this view: Confirm stays `disabled` with label `Rate unavailable`, the countdown stops, and a `Retry` text button appears below the rows.
- If the refreshed rate pushes the amount into `insufficient-funds` or `below-min`, the card returns to `view = 'form'` automatically and shows the corresponding error state. **[FALLBACK — not in BRIEF]**

`Back` (secondary button, rendered **below** Confirm):
- sets `view = 'form'`, clears the interval, resumes background polling;
- **all typed values, assets and `activeSource` are preserved** — the user is returned to Screen 2 exactly as they left it;
- focus returns to the form's `Continue` button;
- must be reachable and activatable by keyboard (`Tab` to it, `Enter` / `Space`);
- `Esc` is **no longer required** — there is no dialog to dismiss. Implementing `Esc` as a shortcut for `Back` is allowed but optional, and its absence is not a defect.
- There is no backdrop, so there is no backdrop-click behaviour to implement.

`Confirm Exchange` (primary button, rendered **above** `Back`):
1. guard: ignore if `isSubmitting` is already `true`;
2. `isSubmitting = true` — Confirm and Back both become `disabled`, Confirm shows a spinner and the label `Processing…`, the countdown stops;
3. generate the order (`id`, `date = new Date()`, frozen `from` / `to` / `rateText` strings);
4. after a **600 ms [FALLBACK]** simulated delay: `view = 'success'`, `isSubmitting = false`.

A second click, a double click, or `Enter` held down cannot produce a second order — the button is `disabled` and the `isSubmitting` guard runs first.

### 8.7 Success view

- **Success ring**: `96 × 96` inline SVG from Figma `133:1500` — a filled annulus (outer r `40`, inner r `36`, thickness `4`) with the check baked into the same vector, coloured `#22c55e` via `currentColor` — see §11.11. Not a filled disc.
- **Title**: `Exchange Successful` (title case), `h1` 28/36 SemiBold, centred.
- **Order ID**: 12 characters from `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`, generated with `crypto.getRandomValues`. Rendered `#181818`, 15/22 Medium. Example: `7QK2M9XA4TB1`. (The mock's `123456789` is illustrative — §11.12.)
- **Copy**: a `24 × 24` icon button (Figma `24/copy`) with `aria-label="Copy order ID"`, placed at the far right of the Order ID row with a `4` gap after the value.
  - success → the icon swaps to `24/check`, an adjacent label reads `Copied`, `#22c55e` (Figma `icon/success`); reverts after **2000 ms**;
  - `navigator.clipboard` unavailable or rejected → label `Copy failed`, `#D32F2F`, reverts after 2000 ms;
  - a visually-hidden `role="status"` announces `Order ID copied` / `Copy failed`.
- **Execution date**: `DD.MM.YYYY, HH:mm` — local time, 24-hour, zero-padded day/month/hour/minute, comma + space separator. Example: `28.08.2026, 14:07`. Formatted manually from `Date` parts (not via a locale-dependent `toLocaleString`).
- **Fee**: literally `0 {RECEIVE_ASSET}`, e.g. `0 BTC`.
- **`Done`** performs a **full reset to Screen 1**:
  `sendRaw = ''`, `receiveRaw = ''`, `activeSource = 'send'`, `sendAsset = 'USDC'`, `receiveAsset = 'BTC'`, `order = null`, `isSubmitting = false`, all error state cleared, `view = 'form'`, polling resumes with an immediate fetch, focus moves to the *You send* input.
  Mock balances are unchanged (§5.2).

---

## 9. Input validation & sanitisation

Both amount inputs are `<input type="text" inputMode="decimal">` (not `type="number"` — no spinners, no locale comma issues, full control of the string).

`onChange` runs the raw string through `sanitizeAmount(value, decimals)` in this exact order:

| # | Rule | `abc` → | `1,5` → | `1..2` → | `007` → | `.5` → | `1.23456` (dec 2) → |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | replace every `,` with `.` | | `1.5` | | | | |
| 2 | delete every character that is not `0-9` or `.` (letters, spaces, `-`, `+`, `e`, `E`) | `''` | | | | | |
| 3 | keep the first `.`, delete all later ones | | | `1.2` | | | |
| 4 | if it starts with `.`, prefix `0` | | | | | `0.5` | |
| 5 | strip leading zeros unless followed by `.` (`007`→`7`, `00`→`0`, `0.5` kept) | | | | `7` | | |
| 6 | truncate the fraction part to `decimals` characters | | | | | | `1.23` |
| 7 | reject (keep the previous value) if the integer part exceeds **12** digits | | | | | | |

- An empty string is always allowed — that is how the field is cleared.
- A trailing `.` is allowed while typing (`1.`) and normalised away on `blur`.
- Paste goes through the same sanitiser (handled by `onChange`, not a separate `onPaste`).
- The sanitised string is what is stored in `sendRaw` / `receiveRaw`; there is no separate "display value" for the active field.
- Typing in a field sets `activeSource` to that field **before** the recalculation runs.

### 9.1 Number formatting rules (display)

Never use `String(n)` / `n.toString()` for a number the user sees — that is the only way `1e-7` can leak into the UI.

- Amounts: `trunc(n, decimals)` then `Intl.NumberFormat('en-US', { maximumFractionDigits: decimals })` — grouped, fixed notation, trailing zeros trimmed.
- Rate: `Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 })`.
- Balance in the balance row: grouped with exactly the asset's `decimals`, then trailing zeros trimmed (`92,514.3`, `0.0425`).
- Values pasted into an input are ungrouped; grouping only appears in the passive field, the confirm view and the success view.

### 9.2 Placeholder strings (canonical)

Format: **`≥{MIN_AMOUNT}`** — the sign is `≥`, **U+2265 GREATER-THAN OR EQUAL TO**. A single character: not `>=`, not `&ge;`, not `>`. Source it as the literal `≥` in a UTF-8 file, or as `'≥'`.

Each field shows the placeholder of **its own** asset. Exact expected strings, byte for byte:

| Asset | Placeholder |
| --- | --- |
| BTC | `≥0.00000013` |
| ETH | `≥0.000004` |
| USDC | `≥0.01` |
| SOL | `≥0.000094` |
| XRP | `≥0.007` |
| TRX | `≥0.03` |

- No space between `≥` and the number. No grouping separators. No trailing-zero padding — the number is copied verbatim from the `minAmount` column of §5.1.
- The placeholder updates immediately when that field's asset changes.
- **Why `≥` and not `>`:** the minimum is inclusive (§6) — `0.01` USDC *is* accepted. A `>` placeholder would state a rule the app does not enforce, and would be exactly as untrue as `Min amount is >0.01 USDC` would be on the button. `≥` is the only technically correct sign.
- **Source of truth:** `≥` **matches the current Figma design** — the client corrected the sign in the design file. This is not a deviation from the design and not a fallback value. The only thing it departs from is the literal string `>{MIN_AMOUNT}` in **BRIEF §3, which is now stale**: the brief lags behind the updated design, not the other way round. Where the brief and the current Figma design disagree on this sign, the design wins (see §16 → RD-2).
- Placeholder, helper text, CTA label and the `<` comparison in code are now mutually consistent.
- Screen readers announce `≥` as "greater than or equal to", which is the intended reading; no `aria-label` override or visually-hidden duplicate is needed on the input for the sign.

---

## 10. Edge cases

| # | Case | Required behaviour |
| --- | --- | --- |
| E1 | **Binance fetch fails / times out on first load** | `rate-error`: both inputs disabled, rate line `Rate unavailable`, CTA `Rate unavailable` disabled, red banner with `Retry`. Polling keeps retrying every 10 s in the background. |
| E2 | **Binance fetch fails during polling** (prices cached) | Form stays fully usable with the last known prices. Caption `Rate may be outdated` under the rate line. After 3 consecutive failures → escalate to `rate-error`. |
| E3 | **Browser goes offline** | `window offline` → same caption as E2 immediately. `window online` → immediate refetch, caption cleared on success. |
| E4 | **User types before the first rate arrives** | Typing is allowed and preserved. Passive field stays empty; CTA stays disabled (`rate-loading`). When prices land, the passive field fills in and the CTA re-evaluates — the typed string is **not** touched. |
| E5 | **Poll lands while the user is mid-typing** | Only the passive field is rewritten. The active input's value, caret position and selection are untouched (no controlled-value churn on the focused element). |
| E6 | **Very large numbers** | Integer part capped at 12 digits by rule 7. Computed values render grouped (`82,150.5`) and never in exponent notation. If a computed value exceeds 12 integer digits it is still rendered via `Intl` (grouped, no truncation of the integer part). |
| E7 | **Very small numbers / scientific notation** | All display goes through `Intl.NumberFormat`, which never emits `e-`. If a computed amount truncates to `0` at the target decimals, the passive field shows `0` and, when it is the send side, the form is `below-min`. |
| E8 | **Long value overflows the input** | Input font-size steps down: `> 12` chars → 16/24, `> 17` chars → 14/20. The input scrolls horizontally natively; the balance row above it truncates with `text-overflow: ellipsis` and keeps `MAX` visible. |
| E9 | **Changing an asset with an amount already entered** | Amount is kept, re-truncated to the new decimals if it is the active field, passive field recomputed, form state re-derived. It is normal for `valid` to become `insufficient-funds` or `below-min`. |
| E9a | **Re-picking the asset already selected in the same field** | Pure no-op: the list closes, focus returns to the trigger, and nothing else happens — no state write, no recalculation, no form-state re-derivation, no placeholder update, no extra render of the amount fields. Verifiable by the absence of any setter call on this path. |
| E9b | **Picking the asset currently used by the opposite field** | Allowed — no option is ever disabled. The opposite field auto-moves to `ASSET_LIST.find(a => a !== picked)` per §8.5; amounts follow the normal E9 path. Both directions behave identically. `BTC → BTC` remains unreachable. |
| E10 | **Swapping with an amount entered** | §8.3. Values move across, state re-derived. |
| E11 | **Double click on `Confirm Exchange`** | Exactly one order. Guarded by `isSubmitting` **and** the `disabled` attribute set in the same handler. |
| E12 | **Timer hits 0:00 while the tab is backgrounded** | `setInterval` drift is corrected against `Date.now()`; on return to the tab the remaining time is recomputed and, if it is ≤ 0, the refresh cycle runs once (not N times). |
| E13 | **Confirm view active when a refresh would fire** | Background polling is paused while `view === 'confirm'`; the confirm view's own countdown owns the only refresh. |
| E14 | **`navigator.clipboard` blocked** (insecure context, denied permission) | No exception surfaces; `Copy failed` label + `role="status"` announcement. The Order ID text itself is selectable so a manual copy is possible. |
| E15 | **Mobile viewport (320–767 px)** | Layout per §13. The dropdown list is width-matched to the card; all three views stay inside the same card; buttons are full width. **No bottom sheet** — there is no overlay to turn into one. No horizontal page scroll at 320 px. |
| E16 | **Both fields empty + swap arrow** | Assets swap, both fields stay empty, placeholders update, CTA stays disabled. |
| E17 | **Balance is 0 for the selected send asset** | `MAX` is disabled. Any positive amount yields `insufficient-funds` (rule 5 outranks rule 6). |
| E18 | **User deletes the whole active field** | Passive field is cleared to `''`, all errors clear, state returns to `empty`. |
| E19 | **`prefers-reduced-motion: reduce`** | The rate ring's **determinate fill is kept** (it is information, not decoration) though it may advance in steps; its **indeterminate rotation is removed** and it holds at `100%` while a request is in flight. The swap-arrow rotation and the view cross-fade are removed; state changes are instant. |
| E29 | **Rate ring drifts out of sync with the polling schedule** | Must be impossible by construction: the ring's progress and the poll scheduler read the **same** cycle-start timestamp (§8.1). A separate `setInterval` for the animation is a defect. Verifiable by leaving the app open for several minutes and confirming the ring still reaches `100%` exactly when a request fires. |
| E30 | **Tab backgrounded mid-cycle, then restored** | Polling is paused while `document.hidden`, so the ring **freezes** rather than continuing to fill against a schedule that is not running. On return an immediate refetch starts a fresh cycle and the ring resets to `0%`. It never shows a stale `100%` that never resolves, and it never jumps backwards mid-fill. |
| E20 | **RTL** | Not supported and not required (see §2). No RTL-specific code. |
| E21 | **Amount exactly equal to the minimum** | The minimum is **inclusive** (§6). Entering exactly `minAmount[sendAsset]` (e.g. `0.01` for USDC, `0.00000013` for BTC, `0.03` for TRX) yields **`valid`**: CTA `Continue` enabled, no helper text, no banner, no red border. The largest rejected amount is one unit of the last decimal below the minimum (see the boundary table in §6). This is the classic off-by-one spot — the operator must be `<`, not `<=`. Comparison uses the parsed `Number` with no epsilon tolerance. |
| E22 | **Minimum boundary reached indirectly** | The same inclusive rule applies when the send amount lands exactly on the minimum via `MAX` (balance equals the minimum), via a swap, via an asset change, or via a poll-driven recalculation of the send field — in all four paths the state is `valid`, not `below-min`. |
| E23 | **`below-min` is unreachable for USDC by construction** | USDC has `decimals: 2` and `minAmount: 0.01`, so the only representable value below the minimum is `0.00`, which parses to `0` and is caught earlier by §6 rule 3 (`typing`). Therefore `below-min` **can never be shown while the send asset is USDC**, and no `0.009`-style test case exists for it. This is correct behaviour, **not a defect** — do not add an epsilon, a special case or a sub-decimal input path to force the state to appear. See §6.2 for the per-asset reachability table. |
| E24 | **Input focused while `insufficient-funds` is active** | The card shows the **red** `2px #FF4D4D` border only. No blue border, no blue focus ring on the card, no ring inside the input. Red wins (§6.1 precedence table). When the error clears while focus stays in the field, the border switches to the blue focus state in the same render. |
| E25 | **Token dropdown open over the swap button** | The dropdown list renders above the swap arrow button, which itself sits above the card seam. Stacking order bottom-to-top: amount cards → swap button (`z-index: 1`) → dropdown list. The list is never clipped by the card and never appears underneath the swap button. |
| E26 | **View switch while a rate request is in flight** | The in-flight request is aborted via its `AbortController`; no state is written after the switch. Switching `form → confirm → form` rapidly never produces a stale rate write or a React "update on unmounted component" warning. |
| E27 | **Long values in the confirm and success rows** | Row values are right-aligned and may be long (e.g. a 21-character amount). The label shrinks first (`min-width: 0`, `flex-shrink: 1`), then the value wraps to a second line inside the row rather than overflowing the 380px content width. The coin icon never shrinks below 22×22 and never wraps away from its amount. |
| E28 | **Card height differs between views** | The Figma card is `480` tall in all three views, but real content can be shorter or taller (e.g. the error banner in `form`, a wrapped value in `confirm`). The card uses `min-height` rather than a fixed `height`, so it grows when needed and never clips or scrolls internally. Its width and horizontal centring never change between views. |

---

## 11. Design tokens

Values marked **(Figma)** were read from the file `Bw2TEVGyo2298cbcRUQKlc`. Values marked **[FALLBACK]** are not in the Figma file and were chosen here.

> **The four screens now exist in Figma** as the `Flow` frame **`136:1942`**:
> - `133:1403` — `Exchange_Desktop / Default`
> - `133:1420` — `Exchange_Desktop / Filled`
> - `133:1474` — `Exchange_Desktop / Redesign — Confirm`
> - `133:1496` — `Exchange_Desktop / Redesign — Success`
>
> All layout, sizes and spacing in §3 and §11 are now **read from these frames**, not reconstructed. Supporting nodes: crypto icons `136:2275`, Amount Field states `86:1040`, swap-button overlay `133:1408`.

### 11.1 Colour (Figma)

```css
--bg-page:            #f7f6fa;
--bg-primary:         #ffffff;
--bg-input:           #e0e0ec;
--border-primary:     #cccade;
--border-subtle:      #0f143733;  /* 1px card/input border */
--text-primary:       #181818;
--text-secondary:     #6b688c;
--text-inverted:      #ffffff;
--text-disabled:      #98a2b3;
--text-placeholder:   #b8b6d2;
--accent:             #2b7bea;
--accent-hover:       #276fd3;
--accent-pressed:     #215eb3;
--border-focus:       #2b7bea;
--disabled-bg:        #e4e7ec;
```

### 11.2 Error / status colours

```css
--error-border:  #FF4D4D;  /* BRIEF §6A — send-card border, 2px */
--error-bg:      #FFF0F0;  /* BRIEF §6A — banner background */
--error-text:    #D32F2F;  /* BRIEF §6A — banner text + icon */
--success:       #22c55e;  /* (Figma) icon/success — success ring + check */
--ring-track:    #e0e0ec;  /* (Figma) --rate-timer-ring-track */
--ring-progress: #2b7bea;  /* (Figma) --rate-timer-ring-progress */
```

Figma also defines `input-field/border/error = #f20f0f`. **The BRIEF values win** (`#FF4D4D` / `#FFF0F0` / `#D32F2F`) because they are an explicit client requirement. See OQ-5.

The success colour is now a **real Figma token** — `icon/success = #22c55e`, read from frame `133:1496`. The earlier `#12B76A` fallback is retired and **OQ-8 is closed** (§16.1 → RD-8).

### 11.3 Typography (Figma)

Family: **Poppins**, loaded from Google Fonts (400, 500, 600) with `font-display: swap`.
Stack: `'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.

| Role | Size / line-height | Weight | Used for |
| --- | --- | --- | --- |
| `h1` | **28 / 36** (Figma `typography/size/h1`, `lineheight/h1`) | 600 SemiBold | all three card titles: `Exchange`, `Confirm Exchange`, `Exchange Successful` |
| `body-lg` | 20 / 30 | 600 | amount input value |
| `body-md` | 15 / 22 | 600 | token ticker |
| `body-md` | 15 / 22 | 400 Regular | confirm/success **row labels** (`#6b688c`) |
| `body-md` | 15 / 22 | 500 Medium | confirm/success **row values** (`#181818`), Order ID |
| `body-sm` | 14 / 20 | 400/500 | dropdown item |
| `body-2sm` | 12 / 16 | 400 | balance row, rate line (`#6b688c`) |
| `body-2sm` | 12 / 16 | 600 | MAX chip |
| `caption-sm` | 12 / 16 | 400 | field label, helper text, banner text |
| `button-lg` | 16 / 24 | 500 Medium | all button labels |

- `h1` **28 / 36 SemiBold** is now confirmed from Figma (`133:1403`, `133:1496`) — the earlier `[FALLBACK]` tag is removed.
- **There is no `h2`.** All three views use a single `h1`-sized title in the same Title Row slot, so the previous `h2 20/30 [FALLBACK]` row is deleted. Semantically each view still renders exactly one heading element (§14).
- Letter-spacing: `0` everywhere (Figma `typography/letterspacing/default`).

### 11.4 Spacing scale (Figma)

`4, 8, 12, 16, 20, 24, 32, 40` px. Nothing outside this scale.

Where each step is used, per the Figma frames:

| Step | Used for |
| --- | --- |
| `4` | label row → value row inside a card; card → helper text; Order ID value → copy button |
| `8` | **gap between the two amount cards**; coin logo → ticker; balance text → `MAX`; rate text → ring; wallet icon → balance text |
| `12` | rate line → CTA; `Confirm` → `Back`; summary row → summary row |
| `16` | amount card inner padding |
| `24` | button horizontal padding |
| `32` | title → content; content → action block; success ring → title |
| `40` | **card padding** on all four sides |

### 11.5 Radius (Figma)

`S = 8`, `M = 12`, `L = 16`, `XL = 24`, `Full = 999`.
Buttons `8`, amount cards / dropdown list / banner `12`, **exchange card `24` (Figma `Radius/XL`, confirmed from `133:1405`)**, chips / icon button / coin logos / success ring `999`.

### 11.6 Focus ring (Figma `focus/ring`)

Ring width `4`, gap `2`, colour `#2b7bea`:
```css
:focus-visible { outline: none; box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px #2b7bea; }
```
Applied to: the **amount card** (not the inner `<input>` — see §11.7), both `CurrencySelector` triggers, dropdown options, MAX chip, swap arrow, all buttons, the copy button and the banner `Retry` link.

### 11.7 Amount Field (Figma `86:1040`, instance `133:1409`)

#### Geometry (all from Figma)

| Part | Value |
| --- | --- |
| Card | `380 × 84` (helper hidden) → `380 × 102` with helper visible; fluid width in this layout, `min-height 84` |
| Padding | `16` |
| Label row | `348 × 16` at (16, 16) |
| Gap label row → value row | `4` |
| Value row | `348 × 32` at (16, 36) |
| `CurrencySelector` | `106 × 32`, left-aligned in the value row |
| Amount input | right-aligned, `text-align: right`, `body-lg` 20/30 |
| Helper text slot | `380 × 14`, `margin-top 4`, `padding-inline 16`, **hidden by default** |
| Radius | `12` |

Balance row (`153 × 16`, right-aligned in the label row):

| Part | Value |
| --- | --- |
| Wallet icon | `16 × 16` |
| Gap icon → balance text | `8` |
| Balance text | `body-2sm` 12/16 `#6b688c` |
| Gap text → `MAX` | `8` |
| `MAX` chip | `28 × 16`, `body-2sm` 12/16 SemiBold `#2b7bea`, `radius 999` |

#### States

- Default: `background #f7f6fa`, `border 1px #0f143733`.
- Hover: `background #f7f6fa` (unchanged), border unchanged.
- **Focus (input focused): `border 2px #2b7bea` on the CARD.**
- Error: `border 2px #FF4D4D` on the card, helper text `#D32F2F`.
- Disabled: `background #f7f6fa`, `border 1px #e4e7ec`, label `#98a2b3`, value `#98a2b3`.
- Precedence when focus and error coincide: **red wins** — see §6.1.

#### Focus indication lives on the card, never inside the input

The `<input>` itself must render **no** focus affordance of its own:

```css
.amountField input { border: none; outline: none; box-shadow: none; background: transparent; }
.amountField:focus-within { border-color: #2b7bea; border-width: 2px; }
```

- No `outline`, no `border`, no `box-shadow`, no background change on the input in any state.
- The blue `2px` indication appears exactly once, on the card, via `:focus-within` (or an equivalent focus-tracking state).
- The reported defect was a **double ring** — one on the card and one inside the input. Exactly one indicator is allowed.
- Use `border-width: 2px` on focus with a compensating layout so the card does not shift by 1px when the border thickens (e.g. keep a `2px` transparent border at rest, or use `box-shadow: inset 0 0 0 2px` for the focus state).

#### CurrencySelector — no border, no fill (Figma `133:1409` → `104:783`)

The trigger has **no border and no background of its own**. In Figma it is a bare auto-layout row with no fill and no stroke, sitting directly on the amount card's `#f7f6fa`.

| Part | Value |
| --- | --- |
| Total | `106 × 32` (auto width) |
| Crypto logo box | `32 × 32`, `background #ffffff` (Figma `tc/logo-bg`), `radius 999` |
| Coin glyph inside it | `28 × 28`, centred (2px inset) |
| Gap logo box → ticker | `8` (Figma `tc/gap/crypto`) |
| Ticker | `body-md` 15/22 SemiBold `#181818` |
| Chevron | `24 × 24`, `#181818`, immediately after the ticker |
| Border | **none** |
| Background | **none** (transparent) |
| Radius | `8` — applies only to the hover background and the focus ring |

- The `1px solid #cccade` border previously added to the trigger is **removed**. It is not in the design.
- The control does not disappear against the card, because the **white `#ffffff` logo box** provides the contrast — that is the design's affordance, together with the chevron. This is why no compromise border is needed.
- Hover: `background #f7f6fa` is a no-op on the card; use the Figma `tc/bg/hover` value `#f7f6fa` as specified and accept that the visible hover cue is the cursor plus the chevron. If a stronger hover cue is wanted, that is a design change and must be requested — do not invent one.
- Focus-visible: the ring from §11.6 on the trigger, `border-radius: 8`.

Placeholder colour `#b8b6d2` (Figma `input-field/text/placeholder`); the placeholder **string** is `≥{MIN_AMOUNT}` — see §9.2 for the six exact values.

### 11.8 Buttons (Figma component `7:4069`)

| | Primary | Secondary |
| --- | --- | --- |
| default | bg `#2b7bea`, text `#ffffff` | bg `#ffffff`, border `1px #cccade`, text `#6b688c` |
| hover | bg `#276fd3` | border `#b8b6d2` |
| pressed | bg `#215eb3` | text `#565475`, border `#9996be` |
| focus | + focus ring | + focus ring |
| disabled | bg `#e4e7ec`, text `#98a2b3` | border `#e4e7ec`, text `#98a2b3` |
| loading | spinner replaces/precedes label, button `disabled` | same |

Size lg: `height 48`, `padding-x 24`, `radius 8`, `gap 8`. In this layout every button is **full width** of the 380px content column (Figma: all button instances are `380 × 48`).

Stacking, per Figma:
- `form` — one button (`Continue`).
- `confirm` — two buttons **stacked vertically**, gap `12`: `Confirm Exchange (0:SS)` primary on **top**, `Back` secondary **below**. Never side by side, at any viewport.
- `success` — one button (`Done`).

### 11.8a Exchange card container (Figma `133:1405`)

| Property | Value |
| --- | --- |
| Size | `460 × 480` (implement as `width: 460`, `min-height: 480` — see §10 E28) |
| Padding | `40` |
| Background | `#ffffff` |
| Radius | `24` |
| Shadow | Figma `shadow/form` — five stacked drop shadows |

```css
box-shadow:
  0 12px  27px rgba(0,0,0,0.10),
  0 49px  49px rgba(0,0,0,0.09),
  0 109px 65px rgba(0,0,0,0.05),
  0 194px 78px rgba(0,0,0,0.01);
```

The fifth shadow in the Figma token is fully transparent (`#00000000`, `0 303px 85px`) and is omitted. The four remaining offsets, blurs and alphas are the Figma values (`#0000001A`, `#00000017`, `#0000000D`, `#00000003`).

### 11.9 Page background

Figma `background` (`75:460`, 1440×1024): flat `#f7f6fa` with two large soft radial ellipses. Implementation: `background: #f7f6fa` plus two `radial-gradient` blobs, `pointer-events: none`, hidden below 768 px (flat `#f7f6fa` on mobile) **[FALLBACK simplification of the gradient geometry — the flat base colour and the presence of two blobs are from Figma]**.

### 11.10 Cryptocurrency icons (Figma `136:2275`)

The six coin icons are **real brand marks in the design file**, not letter monograms. The current monogram placeholders (a coloured circle with a letter) are a defect and must be replaced.

Figma nodes — each is a vector symbol with a native size of `40 × 40`:

| Asset | Figma node | Appearance |
| --- | --- | --- |
| BTC | `7:5220` `Bitcoin-coin` | orange `#F7931A` disc, white `₿` |
| ETH | `7:6832` `Ethereum-coin` | light grey `#ECEFF0` disc, dark `#393939` diamond |
| USDC | `7:7063` `USD-coin` | blue `#2775CA` disc, white `$` in a ring |
| SOL | `7:7002` `Solana-coin` | near-black disc, gradient bars |
| XRP | `7:7085` `XRP-coin` | `#262C32` disc, white `✕` mark |
| TRX | `7:7039` `TRON-coin` | red `#FF060A` disc, white TRON mark |

**How they are supplied:** export each node as **SVG** and commit it as an **inline React component** (one file per coin, e.g. `src/icons/BtcIcon.tsx`), rendered with `width`/`height` props and `aria-hidden="true"`. Inline SVG is required rather than `<img>` or a sprite so the icons scale crisply at 22/24/28 px, carry no network request, and need no build-time asset pipeline. Each glyph already contains its own circular background — do **not** wrap it in an extra coloured circle.

Required render sizes:

| Context | Size |
| --- | --- |
| `CurrencySelector` in an amount card | `28 × 28`, inside a `32 × 32` white `radius 999` box |
| Dropdown list item | `24 × 24` (Figma `dd-item/icon-size`) |
| `From` / `To` rows in the confirm view | `22 × 22` (Figma `133:1484`, `133:1489`) |

**What I could not extract:** the SVG path data itself. The metadata tools return node geometry and names, not vector bytes. The builder must export the six nodes above — via the Figma MCP `get_design_context` on each node id (it returns asset download URLs) or via Figma's own SVG export — and commit the results. The node ids, native size, per-asset brand colours and the three required render sizes are all captured above, so nothing else is needed from a human.

### 11.11 Success ring (Figma `133:1500`)

The success indicator is an **outlined green ring with a check inside** — **not** a filled disc. The current filled circle is a defect.

| Property | Value | Source |
| --- | --- | --- |
| Box | `96 × 96` | Figma `133:1500` |
| Shape | **filled annulus** — outer radius `40`, inner radius `36` ⇒ ring thickness **`4`** | Figma `133:1500` |
| Check glyph | part of the same vector, centred inside the annulus | Figma `133:1500` |
| Colour | `#22c55e`, applied via `currentColor` from the `--success` token | Figma token `icon/success` |
| Position | horizontally centred in the card, `32` above the title | Figma (x=182 of 460; 136 → 168) |

**Implementation: a single inline SVG exported from `133:1500`**, not a CSS border.

- The ring is an even-odd filled annulus (two concentric circles, r `40` and r `36`), not a stroked circle — so it never renders as a filled disc and never depends on `border-radius`.
- The check mark is baked into the same vector; there is no separate glyph element to align.
- The SVG paths use `fill="currentColor"`, and the wrapper sets `color: var(--success)`. Changing the token recolours both the ring and the check.
- `aria-hidden="true"` — decorative (§14).

The earlier CSS approach (`border: 3px solid #22c55e` plus a separate stroked check) is **superseded**. The `3px` figure in it was eyeballed off a render; the real thickness is `4px` and comes from the design. **OQ-14 is closed** (RD-14).

### 11.11a Summary rows (confirm and success views)

| Property | Value | Source |
| --- | --- | --- |
| Row height | `22` | Figma |
| Row gap | `12` | Figma |
| Label | `body-md` 15/22 **Regular** `#6b688c` | Figma `text/secondary`, `typography/body/md/regular` |
| Value | `body-md` 15/22 **Medium** `#181818` | Figma `text/primary`, `typography/body/md/medium` |
| Layout | label left, value right, `justify-content: space-between` | Figma |
| Coin icon (From / To only) | `22 × 22`, gap `8` before the amount | Figma |
| Copy button (Order ID row) | `24 × 24`, gap `4` after the value, at the far right | Figma `133:1507` |
| Divider | **none** — no divider line in either view | Figma |

### 11.12 Illustrative values in the mock — do NOT copy

The client stated explicitly that the figures in the mock are placeholder content and that all numbers and calculation logic are already approved. The following appear in the Figma frames and **must be ignored** — the SPEC values win:

| Mock shows | Do NOT change | Authoritative source |
| --- | --- | --- |
| `1 BTC ≈ 82,150.00 USDC` for a `USDC → BTC` pair | The rate direction. It stays `1 {SEND_ASSET} ≈ {rate} {RECEIVE_ASSET}` — **base is always the send asset** | BRIEF §2, §8.1 |
| `92,845.34 USDC` in the amount-card balance row | Mock balances come from §5.2 (`USDC 92514.30`, etc.) | §5.2 |
| `82,150 USDC` / `1 BTC` in the confirm rows | Amounts come from the user's input and the live rate | §8.2 |
| `123456789` as Order ID | Order ID stays a 12-character uppercase alphanumeric string | §8.7 |
| `26.08.2026, 16:41` | Format is right (`DD.MM.YYYY, HH:mm`); the value is `new Date()` at confirm time | §8.7 |
| `≈` vs `=` | The separator is `≈`, never `=` | BRIEF §2 |
| `$346,788.072` in the header | The header balance is **computed** from `MOCK_BALANCES` × live prices; this figure is never hard-coded | §11.13 |
| `$346,788.72` in the header (newer screenshot) | Same — the client said outright «сумма не соответствует, это пример» | §11.13 |
| `0x...E0EEd` as the header text node name | The Figma node keeps this name from an older revision. The slot now holds the **balance**, not a wallet address. Node names do not track content — do not render an address | §11.13 |

A reviewer must not raise these as mismatches, and a builder must not "correct" the app to match them.

### 11.13 Header (Figma `133:1419`)

Static chrome at the top of the page, above the exchange card. Present on all three views and identical in each.

The right-hand side was **redesigned by the client** (RD-18). It is now three elements only. The avatar, the wallet address, the circular background behind the wallet glyph and the dropdown chevron are all **gone** — they are `hidden` in the Figma node and must not be built.

#### Geometry

| Property | Value | Source |
| --- | --- | --- |
| Header | `1440 × 64`, full-bleed | Figma |
| `padding-inline` | **`132`** | Figma (logo at x=132; menu right edge at `1136 + 172 = 1308 = 1440 − 132`) |
| Layout | logo left / menu right via `justify-content: space-between`, `align-items: center` | Figma |
| Background | `#ffffff` | Figma |
| Text | Poppins **Medium 14**, line-height `21`, `#181818` | Figma `Body/Body2*Medium`, `Main Colors/Secondary` |

Logo block — **unchanged**, `198 × 32` at `x: 132, y: 16`:

| Part | Value |
| --- | --- |
| Mark | `30.46 × 28.95`, gradient |
| Gap | `8` |
| Wordmark `CLEAN WALLET` | `158.4 × 12.95` |

Menu block — **`172 × 32` at `x: 1136`** (previously `327 × 32` at `x: 981`). Exactly three elements, flush right:

| # | Element | Geometry |
| --- | --- | --- |
| 1 | Wallet glyph `vuesax/linear/wallet-2` | `20 × 20`, inside a `32 × 32` box at inset `6`. **No circular background** — the `Ellipse 341` behind it is hidden in the design |
| 2 | **Total balance** text | at `x: 40` from the start of the block ⇒ gap `8` after the `32` box; `84 × 21` in the design |
| 3 | Settings gear | `24 × 24` at `x: 148` from the start of the menu ⇒ gap `24` after the `124`-wide wallet block |

Arithmetic check: `124 (wallet block) + 24 (gap) + 24 (gear) = 172` ✓.

**Removed from the design and therefore from the build:**

| Was | Figma node | Status |
| --- | --- | --- |
| `Balance` block with an avatar | `31:2519` | `hidden` — **the avatar no longer exists at all** |
| Secondary `Avator` inside the wallet block | `31:2512` | `hidden` |
| `Ellipse 341` — circular background under the wallet glyph | `35:2944` | `hidden` — glyph now sits on the white header with no disc |
| `Arrows/drop` — dropdown chevron | `32:2685` | `hidden` — **no dropdown affordance** |

The text slot's Figma node is still **named** `0x...E0EEd` because layer names do not follow content. It now holds the **computed total balance**, not a wallet address. There is no wallet address anywhere in the header (§11.12).

The logo mark uses the Figma `Gradient` / `Additional Colors/Gradient` tokens. Those are gradient fills, so the MCP variable API returns an empty value for them — the exact stops are **not extractable** and are implemented from the rendered design. See OQ-15.

#### Balance is computed, never hard-coded

```
headerBalanceUsd = Σ over all 6 assets of ( MOCK_BALANCES[asset] × prices[asset] )
```

- Rendered via `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
- Uses the **same** `MOCK_BALANCES` (§5.2) and the **same** `prices` map (§8.1) as the rest of the app. No second source of truth, no separate fetch.
- While `prices === null` (first load pending, or `rate-error`) the header shows an **em dash `—`**. It never shows `$0`, `$0.00`, `NaN` or a spinner — a zero balance would be a factual lie.
- It updates on every successful poll, like any other price-derived value.
- With the §5.2 balances the figure lands in the high hundreds of thousands of dollars, but **no specific total is expected or asserted anywhere** — it moves with the live Binance prices. Neither the SPEC nor any test fixes an exact amount.
- Both figures shown in the design, `$346,788.072` and `$346,788.72`, are illustrative (§11.12). The client said outright «сумма не соответствует, это пример». Neither may appear as a literal.

#### No wallet address in the header

There is **no `HEADER_WALLET_LABEL` constant and no wallet address string.** The slot that used to hold `0x...E0EEd` now holds the computed balance (RD-18). Since nothing static is copied from the design any more, the do-not-copy rule (criterion 131) applies to the header without exception — the earlier carve-out for that constant is removed along with the constant itself.

There are no wallets, addresses or accounts in this app (§2), so nothing in the header refers to one.

---

## 12. Motion

| Element | Transition |
| --- | --- |
| Button background | `background-color 150ms ease` |
| Card border colour | `border-color 150ms ease` |
| Swap arrow icon | `transform 200ms ease` (180° rotate on click) |
| Dropdown open | `opacity 120ms ease, transform 120ms ease` (translateY -4px → 0) |
| **View switch** (`form` ↔ `confirm` ↔ `success`) | `opacity 150ms ease` cross-fade on the card's **contents only**. The card box — its size, position, background, radius and shadow — does not animate, so the container reads as stationary while its contents change. |
| Rate progress ring — fill | Determinate `0% → 100%` over `POLL_INTERVAL_MS` (`10 000 ms`), driven by the poll scheduler's cycle-start timestamp. **Kept** under `prefers-reduced-motion` (may be stepped). |
| Rate progress ring — in flight | Indeterminate `spin 800ms linear infinite`. **Removed** under `prefers-reduced-motion`; the ring holds at `100%` instead. |
| Error banner appear | `opacity 120ms ease` — no height animation |

There is no backdrop animation and no panel slide/scale, because there is no modal (RD-6).

All of the above are disabled under `@media (prefers-reduced-motion: reduce)` **with one deliberate exception: the rate ring's determinate fill survives**, because it carries information about rate staleness rather than being decorative. Only its indeterminate rotation is dropped.

---

## 13. Responsive

Figma provides **only the 1440 × 1024 desktop frames**. The desktop column below is from Figma; the breakpoint values and the mobile adaptations are **[FALLBACK]** (see OQ-13).

| Range | Behaviour |
| --- | --- |
| `≥ 768px` | Exchange card **`460` wide** (Figma), `min-height 480`, `padding 40`, `radius 24`, `background #ffffff`, `shadow/form`. Centred horizontally. Decorative background blobs visible. Content column `380`. Confirm buttons stay **stacked** with a `12` gap — they are stacked at every viewport, not only on mobile. |
| `< 768px` **[FALLBACK]** | Card `width: 100%` with `16px` page padding, `padding: 24` (reduced from 40), `radius 24`, top-aligned with a `24px` top offset. Background flat. Amount value drops to `18/26`. Amount cards stay `8` apart and the swap button keeps overlapping the seam. Dropdown list matches the card width. All buttons full width. **No bottom sheet, no overlay** — the three views still swap inside the card. |
| `< 360px` **[FALLBACK]** | Card `padding: 16`. Amount value drops to `16/24`. Balance row text truncates with an ellipsis; the `MAX` chip never shrinks or wraps. Page padding `12px`. |

Invariant across all viewports: the `8px` gap between the amount cards, the swap-button overlap, the stacked confirm buttons, and the rate-line-above-CTA order never change.

#### Header responsive behaviour **[FALLBACK]**

Figma has **no mobile header frame**, so everything below is an engineering choice, not a design decision (OQ-13).

| Range | Header |
| --- | --- |
| `≥ 768px` | Full header: `padding-inline 132`, logo left, wallet glyph + balance + gear right. |
| `< 768px` **[FALLBACK]** | `padding-inline` drops to `16`. The **wallet glyph and the balance are hidden**; only the logo and the gear glyph remain. |
| `< 360px` **[FALLBACK]** | `padding-inline` drops to `12`. Logo and gear only. |

**Updated arithmetic after the header redesign (RD-18).** The menu shrank from `327` to `172`, so the intrinsic width is now:

```
132 (pad) + 198 (logo) + 24 (min gap) + 172 (menu) + 132 (pad) = 658
```

`658 < 768`, so the full desktop header **does fit** at 768 px and no longer forces a horizontal scrollbar there. The earlier overflow (`813 > 768`) is resolved by the redesign itself.

This does **not** relax anything:
- Criterion 116 — no horizontal scroll at **any** width from `320` to `1440` — remains in force. `658` still exceeds `320`–`657`, so the padding reduction and the menu collapse are still required at the low end.
- The **proportional padding** the builder implemented **stays**. It is what keeps the range between `658` and `768` clean and gives margin if the menu ever grows again. Do not revert it.

Hiding the balance on small screens is acceptable because it is decorative chrome — no unique information is lost, and the exchange itself never depends on it.

#### Hard requirements

- **No horizontal scrollbar at any viewport width from `320px` to `1440px`** — not just at the two tested endpoints. `document.scrollingElement.scrollWidth` never exceeds `clientWidth`. Verify by sweeping widths, e.g. every 8 px across the range.
  - The header is the known trap: its `padding-inline: 132` plus its intrinsic content is what previously overflowed at `768px`. After the header redesign (RD-18) the intrinsic width is `658`, so `768` is safe — but every width below `658` still needs the padding reduction and the menu collapse to have already engaged. They must kick in **before** the content stops fitting, not exactly on a breakpoint.
  - This criterion is a **range check by design**: the original `320px`-only check passed while `768px` was broken, which is exactly the failure it now prevents.
- All interactive targets ≥ **40×40 px** (the MAX chip gets an invisible padded hit area to reach 40px height).

---

## 14. Accessibility

### Semantics
- `<header>` is the page's banner landmark, a sibling of `<main>` — not inside it. `<main>` wraps the exchange card. **Each view renders exactly one `<h1>`** in the card's Title Row — `Exchange`, `Confirm Exchange` or `Exchange Successful`. Only one view is mounted at a time, so there is never more than one `<h1>` in the document. There is no `<h2>` anywhere.
- Each amount input has a real `<label htmlFor>` — `You send` / `You receive` — visible, not a placeholder.
- Balances are plain text inside the card, associated with the input via `aria-describedby`.
- The `form` view's body is a `<form>` with `onSubmit` → `view = 'confirm'`, so Enter in an input advances when the state is `valid` (and does nothing otherwise). The confirm and success views are plain `<section>`s, **not** forms and **not** dialogs.
- Confirm and success summary rows are a `<dl>` with `<dt>` labels and `<dd>` values, so the label/value pairing is programmatic and not purely visual.

### Inputs
- `type="text"`, `inputMode="decimal"`, `autoComplete="off"`, `spellCheck={false}`, `enterKeyHint="done"`.
- `aria-describedby` points at the balance text id and, when present, the helper-text id and the error banner id.
- `aria-invalid="true"` on the send input in `insufficient-funds` and `below-min`.
- Inputs get `disabled` only in `rate-error`.

### Error announcement
- The insufficient-funds banner has `role="alert"` (implicit `aria-live="assertive"`), is rendered/unrendered rather than hidden, and its icon is `aria-hidden="true"`.
- The banner id is referenced from `aria-describedby` on the send input.
- The below-min helper text is a normal `<p>` referenced via `aria-describedby` (not `role="alert"` — it would fire on every keystroke).

### Live regions
- The rate line is **not** a live region (a 10 s poll would spam a screen reader). The refresh ring is `aria-hidden="true"`.
- **One** visually-hidden `role="status"` element, mounted once at the app level, announces discrete events only: the **view change** (`Confirm exchange` / `Exchange successful` / `Back to exchange form`), `Rate updated` (after a confirm-view refresh), `Order ID copied`, `Copy failed`.
- Because the step change is not a dialog opening, the `role="status"` announcement is what tells a screen-reader user that the content changed. It is required, not optional.
- The countdown is plain text inside the button label with `aria-live="off"`; the accessible name of the button is kept stable via `aria-label="Confirm exchange"` so the seconds are not re-announced every tick.

### Token dropdown
- Trigger: `<button aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}>`.
- List: `role="listbox"` with `aria-labelledby` pointing at the field label; options `role="option"` with `aria-selected` (`"true"` on this field's current asset, `"false"` on the other five).
- **No option carries `aria-disabled`** — every option is selectable, including the one currently used by the opposite field (§8.5). `aria-disabled` must not appear anywhere in the dropdown markup.
- Because there are no disabled options, roving focus **does not need to skip anything**: `ArrowUp` / `ArrowDown` visit all 6 options in order, wrapping at both ends. There is no "unreachable option" case to announce or work around.
- Keyboard: `Enter` / `Space` / `ArrowDown` opens and focuses the currently selected option; `ArrowUp` / `ArrowDown` move through all 6 (wrapping); `Home` / `End` jump to first / last; `Enter` / `Space` select; `Esc` closes and returns focus to the trigger; `Tab` closes and moves on.
- Selecting the already-selected option is a no-op that just closes the list and restores focus to the trigger — no announcement is fired, because nothing changed.
- When a collision auto-moves the opposite field (§8.5), that field's trigger changes its accessible name (the ticker). The change is conveyed by the trigger's own name on next focus; **no live region announces it** — a `role="status"` here would fire on every asset change and add noise. The visible check mark and the two triggers remain the source of truth.

### View transitions (replaces the former "Modal" rules)

The confirm step is a view swap, so **none of the dialog machinery applies**. The following must **not** exist anywhere in the app:

`role="dialog"` · `aria-modal` · focus trap · `inert` · `aria-hidden` on the page background · `body { overflow: hidden }` · portal · backdrop · required `Esc` handler.

What is required instead, on every `view` change:

1. **Move focus deliberately.** On entering a view, focus moves to that view's `<h1 tabIndex={-1}>`. Focus is never left on a button that has just unmounted, and never silently reset to `<body>`.
   - `form → confirm`: focus → `<h1>Confirm Exchange</h1>`.
   - `confirm → success`: focus → `<h1>Exchange Successful</h1>`.
   - `confirm → form` (via `Back`): focus → the form's `Continue` button, because that is where the user came from.
   - `success → form` (via `Done`): focus → the *You send* input.
2. **Announce the change** via the shared `role="status"` (see Live regions).
3. **Keep the tab order natural.** With only one view mounted, `Tab` walks the card's controls and then continues to the rest of the page. Nothing is trapped and nothing is skipped.
4. **`Back` must be keyboard-operable** — it is a real `<button>`, reachable by `Tab` and activated by `Enter` / `Space`.
5. `Esc` is **not** required in the confirm view. Implementing it as a shortcut for `Back` is permitted; its absence is not a defect and must not be flagged as one.

### Success view
- On mount, focus moves to the `<h1 tabIndex={-1}>Exchange Successful</h1>`.
- The success ring is decorative (`aria-hidden="true"`); the heading carries the meaning.
- Copy button `aria-label="Copy order ID"`; the Order ID text is selectable.
- `Done` returns focus to the *You send* input after the reset.

### Header
- `<header>` is the banner landmark. It contains **no headings**, so it never competes with the card's `<h1>`.
- **Zero interactive elements.** No `<button>`, no `<a>`, no `onClick`, no `tabIndex`, no `role="button"`, no `cursor: pointer`. Because nothing in the header does anything, shipping controls there would create focusable affordances that respond to nothing — worse than having none. The wallet glyph and the settings gear are **decorative glyphs**, not controls.
- Consequence: the header adds **nothing to the tab order**. `Tab` from the address bar lands on the first control inside the card.
- Both glyphs — the wallet icon and the gear — are `aria-hidden="true"`. There is no avatar, no dropdown triangle and no wallet address to annotate (RD-18).
- Logo: two images. The mark is decorative → `alt=""`. The wordmark carries the product name → `alt="CLEAN WALLET"`. Exactly one of the two has a non-empty `alt`, so the name is announced once.
- The balance figure has a **visually-hidden label** so the bare number is not announced without context: `<span class="visuallyHidden">Total balance</span>` followed by the computed amount. When the value is `—`, the accessible text reads `Total balance unavailable`.
- The balance is the header's **only** text content besides the logo wordmark.
- Contrast: `#181818` on `#ffffff` = 17.1:1 ✓. The logo's gradient mark is decorative, so it is exempt from contrast requirements.

### Visuals
- `:focus-visible` ring per §11.6 on every interactive element; `:focus` without `:focus-visible` shows no ring.
- The below-min requirement is never communicated *only* by the low-contrast disabled CTA — it is duplicated as helper text in `#6b688c` (§6.1).
- Placeholders (`#b8b6d2`) never carry unique information; the minimum is also in the helper text and the CTA label.
- Contrast (passing): `#181818` on `#f7f6fa` = 15.6:1 ✓; `#6b688c` on `#f7f6fa` = 4.9:1 ✓; `#6b688c` on `#ffffff` = 5.2:1 ✓; `#D32F2F` on `#FFF0F0` = 5.0:1 ✓; `#181818` on `#ffffff` = 17.1:1 ✓.
- The success ring is decorative, so its `#22c55e` on `#ffffff` (2.3:1) is exempt — the meaning is carried by the `Exchange Successful` heading, which is `#181818` on `#ffffff`. Do not raise this as a contrast failure.
- The `CurrencySelector` has no border by design (§11.7). Its non-text contrast is carried by the white `#ffffff` logo box on the `#f7f6fa` card and by the `#181818` ticker and chevron, both well above 3:1.

### 14.1 Accepted contrast waiver (client-approved — NOT a defect)

The client has reviewed and **knowingly accepted** two WCAG 2.1 AA 1.4.3 (Contrast Minimum) failures. The accent colour `#2b7bea` stays exactly as it is. Neither colour, font size nor font weight may be changed to "fix" these.

| Element | Foreground / background | Measured | AA requirement | Status |
| --- | --- | --- | --- | --- |
| Primary CTA label (Poppins Medium **16px** — not "large text", which needs ≥18.66px bold or ≥24px) | `#ffffff` on `#2b7bea` | **4.1:1** | 4.5:1 | **Waived by client** |
| `MAX` chip label (Poppins SemiBold **12px**) | `#2b7bea` on `#f7f6fa` | **3.8:1** | 4.5:1 | **Waived by client** |

Consequences for implementation and review:
- Do **not** darken the accent (a `#1c62c4`-style change was rejected), do not enlarge the CTA label, do not add a text shadow or an outline as a workaround.
- A reviewer must **not** mark the build FAIL because of these two specific measurements. They are the only accepted contrast exceptions.
- **Every other accessibility requirement in §14 remains mandatory in full** — semantics, one `<h1>` per view, labels, `inputMode`, `role="alert"`, `aria-describedby`, `aria-invalid`, the deliberate focus move on every view change, the `role="status"` announcement, keyboard-only completability, and the visible `:focus-visible` ring. Any other contrast pair not listed in the waiver table above must still meet AA (4.5:1 for normal text, 3:1 for UI-component boundaries and the focus ring). Note that focus-trap and `Esc` are **not** on this list — they were dialog requirements and no longer apply (RD-6).
- The waiver does not weaken §6.1: information carried by a disabled control is still duplicated as helper text, and placeholders still carry no unique information.

---

## 15. Acceptance criteria

A reviewer marks PASS only if every line below is true.

**Setup**
1. Project is Vite + React + TypeScript; `npx tsc --noEmit` and `npm run build` both pass with zero errors.
2. `package.json` dependencies are `react`, `react-dom` only (plus Vite/TS/ESLint dev deps). No UI kit, no state manager, no date/number library.
3. No `any` in `src/`; every component has an explicit props `interface`/`type`.

**Assets & constants**
4. All 6 assets exist with exactly the minimums and decimals of §5.1.
5. USD Coin's ticker renders as `USDC` everywhere; Tron's as `TRX` (never `TRC`, never `USDC.e`).
6. `MOCK_BALANCES` matches §5.2 exactly and is never mutated (balances are identical before and after a completed exchange).
7. Default pair on first paint is `USDC → BTC` with both inputs empty.

**Rates**
8. A request to `api.binance.com/api/v3/ticker/price` fires on mount and then every 10 s (±200 ms) while `view === 'form'`.
9. Requests carry an `AbortController` and abort after 8 s.
10. Polling stops while `view === 'confirm'`, while `document.hidden`, and while `view === 'success'`; it resumes with an immediate fetch on `visibilitychange → visible` and on `online`.
11. Rate line reads `1 {SEND} ≈ {RATE} {RECEIVE}` — **base is the send asset**, separator is `≈` — and updates when either asset changes. The mock's `1 BTC ≈ 82,150.00 USDC` for a `USDC → BTC` pair is illustrative and must **not** be reproduced (§11.12).
12. A background refresh never clears, rewrites or re-formats the field the user is typing in, and never moves the caret.
13. **The rate ring is always present** next to the rate text, in every rate state, and is never unmounted.
14. **The ring is a determinate PROGRESS indicator, not a plain spinner.** It fills `0% → 100%` over `POLL_INTERVAL_MS` (`10 000 ms`), measured from the start of the previous request, and visibly advances while the app idles. A ring that only spins during the request, or that never animates, is a defect.
15. Ring state machine matches §8.1: fills while counting down · **indeterminate rotation** while a request is in flight at `100%` · resets to `0%` on a successful response · **frozen** at its current value while polling is paused (`view === 'confirm'`, `document.hidden`, `view === 'success'`) · **track only, no progress and no rotation** in `rate-error`.
16. **The progress value derives from the same cycle-start timestamp that drives the poll scheduler** — verifiable in code: there is no second, independent timer for the animation. The ring reaching `100%` coincides with a request firing, and still does after several minutes of idling.
17. The ring is `16 × 16`, thickness `2`, track `#e0e0ec`, progress `#2b7bea`, `radius 999`, gap `8` after the rate text, `aria-hidden="true"`.
18. Under `prefers-reduced-motion: reduce` the **fill is kept** (it is information, and may be stepped) while the **indeterminate rotation is removed** — the ring holds at `100%` during a request.
19. **The rate line sits directly above the CTA**, inside the action block, horizontally centred, with a `12` gap to the button. It is not above the amount cards, not beside the CTA and not below it.

**Calculation**
20. Typing in *You send* sets `activeSource = 'send'` and writes only *You receive*, using `send * P_send / P_receive`.
21. Typing in *You receive* sets `activeSource = 'receive'` and writes only *You send*, using `receive * P_receive / P_send`.
22. There is no infinite update loop: the active field is never written by the calculation effect (verifiable in code — the effect writes exactly one of the two setters, chosen by `activeSource`).
23. Computed values are **truncated**, not rounded, to the target asset's decimals.
24. Clearing the active field clears the passive field to `''` (never `NaN`, `0` or `undefined`).

**Form state machine**
25. `FormState` is derived by a pure function, not stored in `useState`.
26. All 7 states of §6 are reachable and each renders exactly the row of the §6.1 table.
27. `insufficient-funds` shows a `2px #FF4D4D` border on the *You send* card only.
28. The error banner uses `#FFF0F0` background, `#D32F2F` text, an info-circle icon and the verbatim string `There are insufficient funds in your account. Please top up your balance.`
29. The banner is rendered **below the You receive container**.
30. `below-min` CTA label is exactly `Min amount is {MIN} {ASSET}` with **no comparison sign** — e.g. `Min amount is 0.01 USDC` for USDC and `Min amount is 0.00000013 BTC` for BTC.
31. Input placeholders use `≥` (U+2265, a single character — not `>=`, not `&ge;`, not `>`), no space before the number, as in the current Figma design. All six strings match **exactly**, character for character: BTC `≥0.00000013`, ETH `≥0.000004`, USDC `≥0.01`, SOL `≥0.000094`, XRP `≥0.007`, TRX `≥0.03`. (BRIEF §3 still shows `>{MIN_AMOUNT}` — that string is stale and must not be followed.)
32. The character `>` appears **nowhere** in rendered UI copy — not in a placeholder, the CTA, the helper text, the banner, the confirm view or the success view. (`grep -n '>' ` over the JSX string literals returns no comparison sign in user-facing text.)
33. `below-min` also renders helper text under the send card in `#6b688c`.
34. `insufficient-funds` takes precedence over `below-min` when both conditions hold.
35. The minimum is **inclusive**: the below-min condition is `sendAmount < minAmount[sendAsset]`. The operator is `<`; there is **no `<=`** in the minimum check anywhere in the code.
36. **Boundary (off-by-one check):** entering exactly the minimum yields state **`valid`** — CTA is `Continue`, **enabled**, with no helper text, no banner and no red border. Verified on assets where both sides of the boundary are representable: BTC (`0.00000012` ⇒ `below-min`, `0.00000013` ⇒ `valid`), TRX (`0.02` ⇒ `below-min`, `0.03` ⇒ `valid`), XRP (`0.0069` ⇒ `below-min`, `0.007` ⇒ `valid`). For USDC only the valid side is checked (`0.01` ⇒ `valid`) — see criterion 37.
37. **`below-min` is unreachable for USDC and that is correct.** With `decimals: 2` and `minAmount: 0.01`, no positive value below the minimum can be typed (`0.009` sanitises to `0.00` ⇒ `typing`, per §9 rule 6 and §6 rule 3). A reviewer must **not** require a `0.009 ⇒ below-min` USDC case and must **not** treat the unreachable state as a defect. No epsilon, hidden decimal or special-cased comparison may be added to force it. TRX, despite also having `decimals: 2`, **is** reachable (`0.01` and `0.02`), so the shared code path is still exercised. See §6.2.
38. The placeholder sign `≥`, the CTA label without a sign, the helper text without a sign and the `<` operator in code all agree with each other — no combination states a rule the app does not enforce.
39. **Border precedence:** a send card that is focused *and* in `insufficient-funds` shows the red `2px #FF4D4D` border only — no blue border and no blue ring. Red beats blue (§6.1).

**CTA**
40. The CTA is enabled *only* in state `valid`; it is a real `<button disabled>` in every other state (not tab-focusable).
41. CTA colours match the §7 table for default/hover/pressed/disabled.
42. Clicking the enabled CTA is the only way to reach `view === 'confirm'`.

**Swap arrow**
43. Clicking it swaps the assets, moves the previous *receive* value into *send*, sets `activeSource = 'send'`, and recalculates — in that order.
44. Insufficient-funds / below-min state is re-derived against the new send asset after a swap.
45. With both fields empty, a swap only exchanges the assets and placeholders (including the `≥` sign and the new minimums); both fields stay empty.
46. **The gap between the two amount cards is exactly `8` px**, and the swap button does not consume vertical space between them.
47. **The swap button overlaps both cards**: `40 × 40`, absolutely positioned, centred horizontally, `top: 68` within the content block, so its centre lands on the seam at `88` and it overlaps `16` px onto each card.
48. The swap button is opaque `#ffffff` with a `1px #cccade` border and `radius 999`, and renders above both card edges (`z-index: 1`); the open dropdown list renders above the swap button.

**MAX**
49. `MAX` exists only in the *You send* card.
50. Clicking `MAX` sets `sendRaw` to the send asset's balance (ungrouped, asset decimals) and recalculates the receive field. With the §5.2 balances: `92514.3` for USDC, `0.0425` for BTC.
51. Clicking `MAX` while `insufficient-funds` is active clears the red border and the banner in the same render and re-evaluates the CTA.
52. `MAX` is disabled when the balance is 0 or the state is `rate-error`.

**CurrencySelector**
53. The `CurrencySelector` trigger has **no border and no background of its own** — no `1px solid #cccade`, no fill. Grep-checkable: no border declaration on the trigger.
54. Its parts match Figma: crypto logo box `32 × 32` white `#ffffff` `radius 999`, coin glyph `28 × 28` inside it, gap `8` to the ticker, ticker `body-md` 15/22 SemiBold `#181818`, chevron `24 × 24` `#181818`.

**Dropdowns**
55. Both dropdowns list all 6 assets with icon + ticker + full name.
56. **Every option is selectable in both dropdowns.** No option is greyed out, `cursor: not-allowed`, non-clickable or skipped by arrow-key navigation — including the asset currently used by the opposite field. `ArrowUp` / `ArrowDown` visit all 6 options and wrap.
57. **The string `aria-disabled` does not appear anywhere in the dropdown markup** (nor `disabled` on any option element). Grep-checkable across the dropdown components.
58. The asset selected in **this** field shows a check mark and `aria-selected="true"` and remains clickable; the other five carry `aria-selected="false"`.
59. **Auto-move on collision:** picking the asset currently held by the opposite field moves that opposite field to `ASSET_LIST.find(a => a !== picked)` with `ASSET_LIST = ['BTC','ETH','USDC','SOL','XRP','TRX']`. Verified against all three agreed cases: `USDC → BTC` + pick `BTC` in **send** ⇒ **`BTC → ETH`**; `USDC → BTC` + pick `USDC` in **receive** ⇒ **`BTC → USDC`**; `ETH → SOL` + pick `SOL` in **send** ⇒ **`SOL → BTC`**.
60. The auto-move is **symmetric** — it fires identically from the `You receive` dropdown and from the `You send` dropdown.
61. `sendAsset !== receiveAsset` holds after every possible selection; `BTC → BTC` (or any identical pair) is unreachable, and it is the auto-move that guarantees this, not a blocked option.
62. Re-picking the asset already selected in the same field is a **no-op**: the list closes, focus returns to the trigger, and no state setter, recalculation or form-state re-derivation runs.
63. Selecting a *different* asset re-truncates the active value, recomputes the passive field, re-derives the state, updates the placeholder(s), closes the list and returns focus to the trigger.
64. `Esc`, outside click and `Tab` all close the list.

**Confirm view (not a modal)**
65. **There is no modal anywhere in the app.** Grep-checkable: the strings `role="dialog"`, `aria-modal`, `createPortal`, `inert`, `backdrop` and any `body.style.overflow` manipulation appear **nowhere** in `src/`. There is no focus-trap implementation.
66. The confirm step is `view === 'confirm'` rendered **inside the same `<ExchangeCard>`**; the card's position, width, background, radius and shadow are unchanged from the form view.
67. The confirm title is exactly **`Confirm Exchange`** (title case), rendered in the same Title Row slot as `Exchange`.
68. The confirm view shows `From`, `To`, `Exchange rate` and `Service fee` with `Service fee` always `0 {RECEIVE_ASSET}`, and **no divider line** between rows.
69. `From` and `To` each render the asset's **coin icon at `22 × 22`** immediately before the amount, gap `8`. `Exchange rate` and `Service fee` have no icon.
70. **Buttons are stacked vertically**, gap `12`: `Confirm Exchange (0:SS)` primary on top, `Back` secondary below. They are never side by side, at any viewport width.
71. The Confirm label counts `(0:10) → (0:01)` in 1 s steps, format `0:SS`.
72. At `0:00` the button is disabled with label `Refreshing rate…`, a fresh rate is fetched, amounts and the rate row are recalculated, and the timer restarts at `0:10`.
73. A failed refresh keeps the previous rate, shows `Could not refresh rate, using last known rate`, and restarts the timer; two consecutive failures leave Confirm disabled with `Rate unavailable` and show a `Retry`.
74. `Back` sets `view = 'form'` and Screen 2 is restored with the typed values, assets and `activeSource` unchanged; focus returns to the `Continue` button.
75. `Back` is a real `<button>`, reachable by `Tab` and activated by `Enter` / `Space`. `Esc` is **not required** and its absence must not be flagged.
76. Double-clicking `Confirm Exchange` creates exactly one order (guard is verifiable in code: `if (isSubmitting) return;` plus `disabled`).
77. Background polling is paused for the whole time `view === 'confirm'`.

**Success**
78. The success indicator is a **`96 × 96` inline SVG** exported from Figma `133:1500`: a filled annulus with outer radius `40` and inner radius `36` (thickness **`4`**), with the check mark baked into the same vector. It is **not** a filled disc and **not** a CSS `border` ring. The paths use `fill="currentColor"` and the wrapper sets `color: var(--success)`, so recolouring the token recolours ring and check together.
79. The success colour is `#22c55e` (Figma `icon/success`); `#12B76A` appears nowhere.
80. The success title is exactly **`Exchange Successful`** (title case, capital S), centred.
81. Order ID is a 12-character uppercase alphanumeric string generated per exchange (two exchanges give different ids).
82. Copy button (`24 × 24`, gap `4` after the value) writes the id to the clipboard, shows `Copied` for 2 s, and reverts; a clipboard failure shows `Copy failed` instead of throwing.
83. Execution date renders as `DD.MM.YYYY, HH:mm` with zero-padded parts, 24-hour clock.
84. `Fee` reads `0 {RECEIVE_ASSET}`.
85. `Done` resets inputs, `activeSource`, both assets (back to `USDC → BTC`), the order and all errors, and returns the user to Screen 1 with polling resumed and both placeholders back to `≥0.01` / `≥0.00000013`.

**Validation**
86. Letters, spaces, `-`, `+`, `e` are stripped on input and on paste.
87. A comma is converted to a dot; only the first dot survives.
88. Leading zeros are stripped (`007` → `7`), `.5` becomes `0.5`, `00` becomes `0`.
89. Fraction input is capped at the asset's decimals (typing a 3rd decimal in USDC does nothing).
90. The integer part is capped at 12 digits.

**Balances**
91. `MOCK_BALANCES` matches §5.2 exactly, including **`USDC: 92514.30`**. The old `2500` appears nowhere.
92. All eight §5.2 test cases (B1–B8) reproduce as specified. In particular **`3000` USDC is now `valid`, not `insufficient-funds`**, and the durable insufficient-funds case is **B2** (`BTC → USDC`, type `0.05`, balance `0.0425`).

**Edge cases**
93. Every case E1–E19 and E21–E30 of §10, plus E9a and E9b, is implemented and reproducible (E20 / RTL is explicitly out of scope and is not checked).
94. No number reaches the DOM via `String(n)` / `.toString()`; all displayed numbers go through `Intl.NumberFormat` — `1e-7` never appears on screen.
95. Failing the first fetch (e.g. offline in DevTools) produces the `rate-error` screen; going back online recovers automatically.

**A11y**
96. Each input has a programmatically associated **visible `<label>`** (`You send` / `You receive`), `inputMode="decimal"`, and `aria-describedby` covering balance / helper / banner as applicable. The placeholder is never the accessible name.
97. The minimum is available **outside the placeholder**: the `below-min` helper text is linked via `aria-describedby`, and the CTA label repeats it. Clearing the field or ignoring the placeholder never hides the constraint.
98. The insufficient-funds banner is `role="alert"`.
99. The send input carries `aria-invalid="true"` in `insufficient-funds` and `below-min`.
100. **Each view renders exactly one `<h1>`** and there is no `<h2>`; only one view is mounted at a time.
101. **On every view change, focus moves deliberately**: `form → confirm` → the `Confirm Exchange` heading; `confirm → success` → the `Exchange Successful` heading; `Back` → the `Continue` button; `Done` → the *You send* input. Focus is never left on an unmounted element and never falls back to `<body>`.
102. **Every view change is announced** through the single shared visually-hidden `role="status"` element.
103. **No dialog machinery exists**: no `role="dialog"`, no `aria-modal`, no focus trap, no `inert`, no `aria-hidden` on the page background, no body scroll lock, no portal. A reviewer must verify these are *absent* — their presence is the defect.
104. The whole flow — pick asset, type, swap, MAX, continue, confirm, copy, done, and `Back` — is completable with the keyboard only, with no trapped focus.
105. A visible focus ring (`0 0 0 2px #fff, 0 0 0 6px #2b7bea`) appears on every interactive element via `:focus-visible`.
106. The amount `<input>` renders **no focus affordance of its own** — no `outline`, no `border`, no `box-shadow` in any state. The blue `2px` focus indication appears exactly once, on the card. No double ring.
107. The below-min minimum is never communicated only by the disabled CTA.
108. **Contrast waiver (§14.1):** the CTA label (`#ffffff` on `#2b7bea`, 4.1:1) and the `MAX` chip label (`#2b7bea` on `#f7f6fa`, 3.8:1) are client-accepted AA exceptions — a reviewer must **not** FAIL the build on these two, and the accent must still be exactly `#2b7bea`. The decorative success ring (`#22c55e` on white, 2.3:1) is likewise exempt. Every *other* contrast pair meets AA (4.5:1 normal text, 3:1 UI boundaries / focus ring), and every other §14 requirement is checked in full.

**Icons**
109. All six coin icons are the **real brand marks** exported from Figma `136:2275` as inline SVG React components. **No letter monograms**, no coloured circle with a character in it.
110. Coin icon render sizes are exactly: `28 × 28` in the `CurrencySelector` (inside a `32 × 32` white `radius 999` box), `24 × 24` in dropdown items, `22 × 22` in the confirm `From` / `To` rows.
111. Each coin SVG carries its own circular background; it is not wrapped in an additional coloured circle. Icons are `aria-hidden="true"`.

**Header**
112. The header renders as a `<header>` banner landmark, `64` tall, full-bleed, `background #ffffff`, `padding-inline 132` at desktop, logo left / menu right via `space-between`.
113. Logo block matches Figma: `198 × 32` at `x: 132, y: 16` — gradient mark `30.46 × 28.95` + gap `8` + wordmark `CLEAN WALLET` `158.4 × 12.95`.
114. **Menu block is `172 × 32` at `x: 1136`** (right edge `1308 = 1440 − 132`) and contains **exactly three elements**, flush right:
     - wallet glyph `vuesax/linear/wallet-2` `20 × 20` in a `32 × 32` box at inset `6`, **with no circular background**;
     - the total balance text at `x: 40` from the block start (gap `8` after the `32` box), Poppins Medium `14`/`21` `#181818`;
     - the gear glyph `24 × 24` at `x: 148` from the menu start (gap `24` after the `124`-wide wallet block).
     Arithmetic: `124 + 24 + 24 = 172`.
115. **The header contains no avatar, no wallet address and no dropdown chevron.** All three are `hidden` in the Figma node (RD-18) and must not exist in the markup. There is no `HEADER_WALLET_LABEL` constant and no `0x…` string anywhere in `src/`.
116. **The header balance is computed, not hard-coded:** `Σ (MOCK_BALANCES[asset] × prices[asset])` over all 6 assets, formatted with `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`. It reads the same `MOCK_BALANCES` and `prices` as the rest of the app — no second source, no separate fetch. Neither `$346,788.072` nor `$346,788.72` appears as a literal, and no exact total is asserted anywhere.
117. **While `prices === null` the header balance shows an em dash `—`** — never `$0`, `$0.00`, `NaN`, `undefined` or a spinner. It fills in on the first successful poll and updates on every later one.
118. **The header contains zero interactive elements:** no `<button>`, no `<a>`, no `onClick`, no `tabIndex`, no `role="button"`, no `cursor: pointer`. It contributes nothing to the tab order — `Tab` from the address bar lands on the first control inside the card.
119. Both header glyphs (wallet, gear) are `aria-hidden="true"`. The logo is two images: mark `alt=""`, wordmark `alt="CLEAN WALLET"` — exactly one non-empty `alt`.
120. The balance figure carries a visually-hidden `Total balance` label; when the value is `—`, the accessible text reads `Total balance unavailable`.
121. Below `768px` the wallet glyph and the balance are hidden and only the logo and gear remain, with `padding-inline` reduced to `16`; below `360px` `padding-inline` is `12`.

**Responsive & design**
122. **No horizontal scrollbar at any viewport width in the range `320px` – `1440px`**, verified by sweeping the range (e.g. every 8 px) rather than only checking the endpoints. `document.scrollingElement.scrollWidth` never exceeds `clientWidth`. This is a **range** check by design: the earlier `320px`-only check passed while `768px` was broken. After the header redesign the intrinsic header width is `132 + 198 + 24 + 172 + 132 = 658`, so `768` now fits — but every width below `658` still requires the padding reduction and menu collapse to have already engaged. The builder's proportional padding **stays**; do not revert it.
123. At `≥ 768px` the card is `460` wide with `padding 40`, `radius 24`, `background #ffffff` and the `shadow/form` stack; the content column is `380`.
124. Below 768 px the card goes full width with `16px` page padding and `padding 24`; **no bottom sheet and no overlay is introduced** — the three views still swap inside the card.
125. The confirm buttons remain stacked with a `12` gap at every viewport width.
126. All interactive targets are at least 40×40 px on mobile.
127. Card geometry matches §3.0 and §11.8a: padding `40`, title height `36`, title→content `32`, content→action `32`, amount-card gap `8`, rate→CTA `12`, summary row gap `12`, button height `48`.
128. Colours, radii, spacing, font sizes and weights match §11; no hard-coded value outside the token set. All three titles are `h1` **28 / 36 SemiBold**.
129. Poppins is loaded and applied; a system-font fallback is declared, and the fallback also renders `≥` (U+2265) correctly.
130. All motion listed in §12 is disabled under `prefers-reduced-motion: reduce`, including the view cross-fade and the rate ring's indeterminate rotation — **with the single documented exception of the ring's determinate fill**, which is kept (criterion 18).
131. None of the illustrative mock values from §11.12 are hard-coded in the app: no `92,845.34`, no `82,150`, no `123456789`, no `26.08.2026`, no `$346,788.072`, no `$346,788.72`, no `0x...E0EEd`, and the rate line is not inverted to `1 BTC ≈ … USDC` for a `USDC → BTC` pair. There are **no exemptions** to this criterion — the earlier carve-out existed only for the wallet-address constant, which no longer exists.

---

## 16. Decisions & open questions

### 16.1 Resolved decisions (client-approved — treat as requirements, do not re-litigate)

**RD-1 — Tron ticker: `TRX`.** Confirmed by the client. The Figma design has been corrected; `TRC` no longer exists in the design file and must not appear in code, copy, tests or fixtures. USD Coin remains strictly `USDC`. Enforced by §5.1 and criterion 5.

**RD-2 — The minimum is INCLUSIVE, and the CTA label drops the `>`.** Final client decision (a mid-review swing to a strict comparison was reverted).

- **Rule:** `sendAmount < minAmount[sendAsset]` ⇒ `below-min`. Exactly the minimum is **valid**. Operator is `<`, never `<=`. This matches BRIEF §6B literally.
- **Why:** amounts are truncated to the asset's decimals, so a strict `>` comparison would move the real usable minimum a whole decimal step above the published one (USDC `0.01` → `0.02`, TRX `0.03` → `0.04`). The client saw that side effect and chose inclusive so the published minimum stays reachable.
- **CTA copy:** `Min amount is {MIN} {ASSET}` — **without** the `>` sign (e.g. `Min amount is 0.01 USDC`). With an inclusive minimum, `Min amount is >0.01 USDC` would be actively misleading, since `0.01` is accepted. Client-approved deviation from the BRIEF §6B string.
- **Placeholders use `≥`:** the format is `≥{MIN_AMOUNT}` — `≥0.01`, `≥0.00000013`, `≥0.03` and so on (all six strings in §9.2), with `≥` = U+2265 as a single character. With an inclusive minimum, `≥` is the only technically truthful sign; a `>` placeholder would misstate the rule exactly as `Min amount is >0.01 USDC` would on the button.
- **`≥` matches the current Figma design** — the client corrected the sign in the design file, so this is neither a deviation from the design nor a fallback value. The only source it departs from is the literal `>{MIN_AMOUNT}` string in **BRIEF §3, which is now stale**; the brief lags behind the design. On this sign, the current design wins over the brief.
- **The earlier "keep `>` in the placeholders" rule is cancelled.** It predates both this decision and the design fix. The character `>` must not appear in rendered UI copy anywhere.
- **Helper text** under the send card is `Minimum amount is {MIN} {SEND_ASSET}` — no sign.
- Enforced by §6 rule 6 + the boundary table, §6.1, §7, §9.2, §10 E21/E22, and criteria 30, 31, 32, 35, 36 and 38.

**RD-3 — Accent `#2b7bea` stays; two contrast failures are waived.** Confirmed by the client as a deliberate trade-off, not a defect: CTA label `#ffffff` on `#2b7bea` = **4.1:1** and `MAX` chip label `#2b7bea` on `#f7f6fa` = **3.8:1**, both below the WCAG 2.1 AA 1.4.3 threshold of 4.5:1 for non-large text. No colour, font size or font weight may be changed to compensate, and no workaround (text shadow, outline, overlay) may be added. A reviewer must not FAIL the build on these two measurements. All other accessibility requirements, including every other contrast pair, remain mandatory in full. Documented in §14.1 and enforced by criterion 108.

**RD-4 — No dropdown option is ever disabled; collisions auto-move the opposite field.** Client decision that **overrides BRIEF §4**, which required `disabled: true` on the opposite field's asset.

- **Cancelled:** the disabled-option rule from BRIEF §4. No option is greyed out, blocked or skipped, and `aria-disabled` must not appear on any option. Any leftover disabled-option logic is a defect.
- **This field's current asset** is shown with a check mark and `aria-selected="true"` and stays clickable. The client's wording: the check mark is enough, there is no need to disable anything. Re-picking it is a pure no-op that only closes the list.
- **The opposite field's asset is fully selectable.** Picking it auto-moves the opposite field to `ASSET_LIST.find(a => a !== picked)` over `['BTC','ETH','USDC','SOL','XRP','TRX']` — so the first candidate is always `BTC`, and `ETH` when `BTC` is the one just picked.
- **Symmetric:** the same rule fires from either dropdown.
- **Amounts:** no new rule. The active field keeps its typed value, the passive field is recomputed at the new rate — the existing asset-change path (§8.5 step 4, §10 E9).
- **Invariant unchanged, mechanism changed:** `sendAsset !== receiveAsset` still always holds and `BTC → BTC` is still unreachable, but it is now guaranteed by the auto-move rather than by forbidding a selection. **This is the key behavioural difference from BRIEF §4** and the most likely place for a stale implementation to survive.
- Agreed cases: `USDC → BTC` + pick `BTC` in send ⇒ `BTC → ETH`; `USDC → BTC` + pick `USDC` in receive ⇒ `BTC → USDC`; `ETH → SOL` + pick `SOL` in send ⇒ `SOL → BTC`.
- Documented in §2, §3, §8.5, §10 E9a/E9b, §14 "Token dropdown"; enforced by criteria 56–64.

**RD-5 — `below-min` is unreachable for USDC, and that is correct.** The client confirmed the validation code is right and the old test expectation was wrong.

- USDC has `decimals: 2` and `minAmount: 0.01`, so the minimum *is* the smallest representable value. Anything smaller sanitises to `0.00` (§9 rule 6), parses to `0`, and is caught by §6 rule 3 as `typing` — never `below-min`.
- The retired expectation `0.009 ⇒ below-min` for USDC was **invalid by construction**: `0.009` cannot be entered at all.
- **Not a defect.** Do not add an epsilon, an extra hidden decimal, a `toFixed` round-trip or a USDC special case to make the state appear.
- **TRX is reachable** even though it also has `decimals: 2`, because its minimum `0.03` is three units of the last decimal: `0.01` and `0.02` both trigger `below-min`. The shared code path therefore remains covered by tests.
- USDC is the **only** asset with this property; the full reachability matrix is in §6.2.
- Raising the USDC balance to `92514.30` (RD-17) does **not** affect this: reachability depends on `decimals` and `minAmount`, not on the balance.
- Documented in §6 boundary table, §6.2, §10 E23; enforced by criteria 36 and 37.

**RD-6 — Confirm Exchange is a VIEW inside the card, not a modal.** The single largest structural change in this revision, and a deliberate cancellation of the brief.

- **What BRIEF §7 said:** the step was called "Confirm Exchange **Modal**", and `Back` was specified as a button that "closes modal and restores Screen 2".
- **What the client decided:** «все переходы и состояния происходят внутри формы», «зачем нам лишние оверлеи и модалки». The modal is **cancelled**. All three steps happen inside the one card, which swaps its own contents.
- This is **not a forgotten rudiment of the brief** — it is a conscious replacement. If a future reader finds `role="dialog"` in the code and BRIEF §7 saying "Modal", the SPEC is the tie-breaker: there is no modal.
- Consequences, all mandatory:
  - **Removed:** overlay, backdrop, `role="dialog"`, `aria-modal`, focus trap, `inert`, `aria-hidden` on the background, `body { overflow: hidden }`, portal, `position: fixed`, backdrop-click handling, the required `Esc` handler, and the mobile bottom-sheet variant.
  - **Added:** `view: 'form' | 'confirm' | 'success'` as the single switch; `isModalOpen` is deleted from state.
  - Card title changes `Exchange` → **`Confirm Exchange`** in the same Title Row.
  - Buttons are **stacked**, `Confirm Exchange (0:SS)` above `Back`, gap `12`, at every viewport.
  - `From` and `To` rows gain a `22 × 22` **coin icon** before the amount.
  - A11y switches from dialog semantics to **view-transition semantics**: deliberate focus move to the new view's heading, announcement via the shared `role="status"`, natural tab order, keyboard-operable `Back`, `Esc` optional.
- **Unchanged:** the 10 s quote-lock timer and its `0:00` behaviour (pause → fresh rate → recalculate → restart), and `Back` preserving all typed values, assets and `activeSource`.
- Documented in §1, §2, §3, §3.3, §8.6, §10 E13/E15/E26, §12, §13, §14 "View transitions"; enforced by criteria 65–77 and 100–104.

**RD-7 — Amount Field: one focus indicator, on the card.** The `<input>` renders no `outline`, `border` or `box-shadow` of its own; the blue `2px #2b7bea` focus indication lives on the card via `:focus-within`. The previous double ring (card + input) is a defect. When focus and `insufficient-funds` coincide, **red wins** — the card shows only the `2px #FF4D4D` border. Documented in §6.1 and §11.7; enforced by criteria 39 and 106.

**RD-8 — Success colour is a real token; OQ-8 is closed.** Figma frame `133:1496` defines `icon/success = #22c55e`. The `#12B76A` fallback is retired and must not appear in the code. The indicator is a `96 × 96` **ring** with a check inside, not a filled disc. Documented in §11.2 and §11.11; enforced by criteria 78–79. Its exact geometry is settled in RD-14.

**RD-9 — The four screens now exist in Figma; layout is read, not reconstructed. OQ-9 is closed.** The `Flow` frame `136:1942` contains `Default`, `Filled`, `Redesign — Confirm` and `Redesign — Success`. Every size and spacing value in §3.0, §11.4, §11.7, §11.8, §11.8a and §11.11a is now taken from those frames. `[FALLBACK]` tags removed as a result: `h1 28/36`, the exchange-card radius `24`, the card padding, all internal gaps, and the success colour. Still `[FALLBACK]`: the **breakpoints and mobile adaptations** (Figma has desktop frames only — see OQ-13) and the page-background gradient geometry.

**RD-10 — Real coin icons replace the monograms.** Figma `136:2275` holds the six brand marks. Letter-monogram placeholders are a defect. They are supplied as inline SVG React components at `28 / 24 / 22` px depending on context. Documented in §11.10; enforced by criteria 109–111.

**RD-11 — CurrencySelector has no border and no fill.** Confirmed against Figma `133:1409` → `104:783`: the trigger is a bare row with no stroke and no background. The `1px solid #cccade` border previously added is removed. The control remains visible because of the **white `#ffffff` logo box** on the `#f7f6fa` card plus the `#181818` ticker and chevron — that is the design's affordance, so no compromise border is needed. Documented in §11.7; enforced by criteria 53–54.

**RD-12 — Mock figures are illustrative and must not be copied.** Client wording: «в макете цифры не точные, это просто показ дизайна, все цифры и логика подсчета утверждены, их менять не нужно», and for the header total specifically «сумма не соответствует, это пример». In particular the mock's `1 BTC ≈ 82,150.00 USDC` for a `USDC → BTC` pair does **not** change the rate direction — the base stays the **send** asset per BRIEF §2. Full do-not-copy list in §11.12; enforced by criteria 11 and 131.

**RD-13 — The header is IN scope, as static chrome. OQ-12 is closed.** The client asked for it after the previous SPEC revision: «это больше статическая часть просто "что б было"». It is **implemented**.

- **Reversal:** the header was previously listed under "Explicitly NOT in scope". That line is **removed**. A reader must not mistake the implemented header for scope creep, and a reviewer must not report it as a SPEC divergence.
- **What it is:** a static, non-interactive block — `CLEAN WALLET` logo on the left; wallet glyph, total balance and settings glyph on the right. Geometry from Figma `133:1419`, documented in §11.13. **Its right-hand side was subsequently redesigned — see RD-18 for the current contents.**
- **Zero interactivity.** No buttons, links, click handlers, `tabIndex` or `role="button"`; the glyphs are decorative. Rationale: nothing in the header has any behaviour, so shipping real controls would create focusable affordances that respond to nothing — worse for a keyboard or screen-reader user than having none. The header adds nothing to the tab order.
- **One live value:** the total balance is **computed** as `Σ (MOCK_BALANCES[asset] × prices[asset])` and formatted as USD via `Intl`. It reads the same balances and the same price map as the rest of the app. While `prices === null` it shows an em dash `—`, never a zero.
- **Mobile is `[FALLBACK]`** — no mobile header exists in Figma (§13, OQ-13).
- Documented in §2 (in scope), §11.13, §13, §14 "Header"; enforced by criteria 112–121.

**RD-14 — Success ring geometry comes from the design; OQ-14 is closed.** The indicator is now an **inline SVG exported from Figma `133:1500`**: a filled annulus with outer radius `40` and inner radius `36`, i.e. thickness **`4`**, with the check baked into the same vector and coloured through `currentColor` from `--success`. The earlier CSS `border: 3px solid #22c55e` approach and its eyeballed `3px` are superseded — the value is read from the design, not measured off a render. The only thing in §11 still taken from a render rather than a token is now the header's gradient stops (OQ-15). Documented in §8.7 and §11.11; enforced by criterion 78.

**RD-15 — Horizontal scroll must be checked across a range, not at a point.** Review found a real bug: at `768px` the then-current header's intrinsic width (`132 + 198 + 24 + 327 + 132 = 813`) overflowed the viewport and the document gained a horizontal scrollbar. The old criterion only asserted `320px` and so never caught it. The requirement is now **no horizontal scroll at any width from `320` to `1440`**, verified by sweeping the range. The header redesign (RD-18) reduced the intrinsic width to `658`, which removes the `768px` failure, but the range requirement stands on its own and the builder's proportional padding stays. Documented in §13; enforced by criterion 122.

**RD-16 — The rate ring is a determinate PROGRESS indicator.** Client wording: «иконка процесса сейчас не анимирована (нужно анимировать, она должна заполняться по мере истечения времени до обновления курса)».

- It **fills `0% → 100%`** over `POLL_INTERVAL_MS` (`10 000 ms`), measured from the start of the previous request, so the user can see how fresh the rate is and when it will change. The previous behaviour — spinning only during the request — is **superseded**.
- At `100%` the request fires and the ring goes **indeterminate** (rotating), because no remaining time is left to represent. On success it resets to `0%` and starts filling again.
- **Frozen** while polling is paused (`view === 'confirm'`, `document.hidden`, `view === 'success'`). **Track only, no progress and no rotation** in `rate-error`, because nothing is counting towards an update.
- **The progress value must come from the same source that schedules the polling.** A second, independent timer would drift and the indicator would stop matching reality. The rendering technique is left to the builder; only the timing contract is mandated.
- **`prefers-reduced-motion: reduce`:** the **determinate fill is kept** — it is information about rate staleness, not decoration, though it may be stepped. The **indeterminate rotation is removed** and the ring holds at `100%`. This is the single documented exception to the "all motion off" rule in §12.
- Geometry is unchanged from §11: `16 × 16`, thickness `2`, track `#e0e0ec`, progress `#2b7bea`, gap `8`, above the `Continue` button.
- Documented in §8.1, §10 E19/E29/E30, §12; enforced by criteria 13–19.

**RD-17 — USDC mock balance raised to `92514.30`.** Client wording: «нужно увеличить баланс для USDC (сейчас вижу 2,500, а нужно 92,514.30, соответственно нужно пересчитать общий баланс в хедере)».

- `MOCK_BALANCES.USDC` changes `2500` → **`92514.30`**. The other five balances are unchanged: `BTC 0.0425`, `ETH 1.25`, `SOL 12.5`, `XRP 300`, `TRX 1500`.
- The header total is **derived** from this map, so it recalculates automatically — there is no separate figure to edit, and no exact total is asserted anywhere.
- **The §5.2 test cases were rewritten**, because they were built on `2500`:
  - `3000` USDC is **no longer** `insufficient-funds` — it is now `valid`. The old example is retired.
  - `MAX` on USDC now fills `92514.3`, not `2500`.
  - The new USDC insufficient-funds example is `100000`.
  - A **second, durable case was added on BTC** (`BTC → USDC`, type `0.05` against the `0.0425` balance). It does not depend on the USDC balance, so it survives any further adjustment. Prefer it in tests.
- This does **not** affect RD-5: `below-min` reachability depends on `decimals` and `minAmount`, not on the balance.
- Documented in §5.2 (cases B1–B8), §3.1, §8.4, §9.1; enforced by criteria 91–92 and 50.

**RD-18 — Header right side redesigned: no avatar, no wallet address, no dropdown chevron.** The client changed the design; same node `133:1419`.

- **Menu shrank** from `327 × 32` at `x: 981` to **`172 × 32` at `x: 1136`**. `padding-inline: 132` is preserved on both sides (`1136 + 172 = 1308 = 1440 − 132`).
- **Now exactly three elements**, flush right: wallet glyph `20 × 20` in a `32 × 32` box at inset `6` **with no circular background** · the **total balance** text at gap `8` · the gear glyph `24 × 24` at gap `24`.
- **Removed** — all `hidden` in the Figma node and therefore absent from the build: the `Balance` block **with its avatar**, the secondary `Avator`, the `Ellipse 341` disc behind the wallet glyph, and `Arrows/drop` (the dropdown chevron).
- **The text slot now holds the balance, not a wallet address.** Its Figma node is still *named* `0x...E0EEd` because layer names do not track content — that name must not be read as a requirement to render an address.
- **`HEADER_WALLET_LABEL` is deleted.** There is no wallet-address constant and no `0x…` string in the app any more. The exemption that criterion 131 used to grant it is **removed with it**, so the do-not-copy rule now applies to the header without exception.
- **The "avatar is a gradient ellipse, not a photo" decision is now moot** — there is no avatar at all. It is preserved as a historical record in RD-19 so it does not look like a requirement was quietly dropped.
- `$346,788.72` (the figure in the newer screenshot) joins `$346,788.072` on the do-not-copy list. The client said outright «сумма не соответствует, это пример».
- Arithmetic consequence: the header's intrinsic width is now `132 + 198 + 24 + 172 + 132 = 658`, which **fits** in `768` — the overflow RD-15 recorded is resolved by the redesign. The range requirement and the proportional padding both stay.
- Documented in §2, §11.12, §11.13, §13, §14 "Header"; enforced by criteria 112–121 and 131.

**RD-19 — Historical record: the header avatar was never a photograph.** While an avatar existed in the design (before RD-18 removed it), this SPEC deliberately replaced the raster `Image` fill — a photograph of a person — with a gradient ellipse, on the grounds that a publicly reachable demo application should not ship a real person's face. That requirement is **no longer active**, because the avatar was removed from the design entirely. It is recorded here so the reasoning is not lost and so it is clear the rule was superseded by a design change rather than quietly dropped. If an avatar ever returns, the same rule applies again: gradient or generated placeholder, never a photograph.

### 16.2 Open questions (8 remaining — each already has a working default in this SPEC)

**OQ-2 — Default asset pair.** Not stated in the brief. This SPEC picks `USDC → BTC`, which now matches **both** the BRIEF §7 example (`82,150 USDC → 1 BTC`) and the Figma `Default` frame (`USDC` in *You send*, `BTC` in *You receive*). Two independent sources agree, so this is close to settled — confirm and it can move to §16.1.

**OQ-4 — Grouping inside the inputs.** Figma's `Amount Field / State=Filled` shows `2,000.00` — grouped, with padded decimals. Grouping a *focused, editable* field requires caret-position bookkeeping. This SPEC groups only the passive (computed) field, the confirm view and the success view, and keeps the actively-typed field ungrouped. Confirm this is acceptable, or budget for a masked input.

**OQ-5 — Which red?** BRIEF §6A gives `#FF4D4D` / `#FFF0F0` / `#D32F2F`; the Figma input tokens give `#f20f0f` for both border and text and no tinted background. This SPEC uses the BRIEF values and ignores `#f20f0f`. Confirm, or align the design system.

**OQ-6 — Network fee row.** The Figma `Summary Row` component ships `Network fee 0.0004 BTC` and a `Total` variant. The brief says the service fee is always `0` and never mentions a network fee. This SPEC omits both. Confirm.

**OQ-10 — Confirm delay.** There is no backend, so `Confirm` resolves after a simulated 600 ms. Confirm that a fake latency is wanted at all (the alternative is an instant transition).

**OQ-11 — Receive-side minimum.** The brief validates only the send side. A tiny send amount can produce a receive amount that truncates to `0` (e.g. `0.01 USDC → 0 BTC` is impossible in practice). This SPEC does not block it. Confirm whether the receive amount should also be validated against the receive asset's minimum.

**OQ-13 — Mobile design.** Figma has desktop frames only (`1440 × 1024`). The breakpoints (`768`, `360`), the reduced card padding, the amount-font step-downs, the mobile page padding and **the header collapse rules** in §13 are all **[FALLBACK]** engineering choices, not design decisions. The client asked for "адаптив, норм виглядає на телефоні", which these satisfy, but if a mobile frame exists or is wanted, §13 and §11.13's responsive table should be re-derived from it. In particular: confirm that hiding the header balance below `768px` is acceptable, rather than shrinking or wrapping it.

**OQ-15 — Header logo gradient stops.** The logo mark uses the Figma `Gradient` / `Additional Colors/Gradient` tokens. The variable API returns an empty value for gradient fills, so the exact stops are not extractable and are currently implemented from the rendered design. If the gradient needs to be exact, supply the stops (colours, angle) or export the mark as SVG. This is the only value in §11 still taken from a render rather than a token. (The gradient circle behind the wallet glyph is no longer relevant — it was removed by RD-18.)
