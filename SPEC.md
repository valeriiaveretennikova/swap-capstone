# SPEC — Swap (internal crypto exchange, 0% fee)

> Sources of truth, in priority order:
> 1. `BRIEF.md` (client requirements)
> 2. Figma `Bw2TEVGyo2298cbcRUQKlc` — **design-system library only** (tokens + components). See §11.
> 3. This SPEC resolves gaps and conflicts. Where a value is invented, it is tagged **[FALLBACK]**.
>
> Target stack: **Vite + React + TypeScript**. No UI library, no state manager, no routing library, no Storybook.

---

## 1. What we are building

A single-page web app "Swap": an internal crypto exchange form for 6 assets with 0% service fee. The user picks a send asset and a receive asset, types an amount in either field, sees a live cross-rate polled from Binance every 10 s, confirms in a rate-locked modal, and lands on a success screen with an Order ID.

This is a **page/application**, not a reusable published component. Balances are mocked in the client; there is no backend. The only real network call is the public Binance ticker endpoint.

---

## 2. Scope

### In scope
- One page with two views: `form` and `success`, plus one modal overlay `confirm`.
- 6 assets: BTC, ETH, USDC, SOL, XRP, TRX.
- Live USD prices from Binance, 10 s polling, cross-rate math.
- Bidirectional amount calculation with `activeSource` lock.
- Swap-direction arrow, MAX chip, token dropdowns with opposite-asset lock.
- Validation: below-minimum, insufficient funds (against mock balances).
- Confirm modal with a 10 s quote-lock countdown and auto rate refresh.
- Success screen with generated Order ID, copy-to-clipboard, timestamp, `Done` reset.
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

---

## 3. Screens & component tree

```
<App>                                     view: 'form' | 'success'
 └ <main>                                 page background (§11.9)
    ├ view === 'form'
    │   └ <ExchangeCard>                  h1 "Exchange"
    │      ├ <AmountField kind="send">
    │      │   ├ label "You send"
    │      │   ├ <BalanceRow>             wallet icon + balance + <MaxChip>
    │      │   ├ <TokenSelect>            coin icon + ticker + chevron -> <TokenDropdown>
    │      │   ├ <input>                  amount, right aligned
    │      │   └ helper text              conditional, §6
    │      ├ <SwapArrowButton>            40x40 icon button, overlaps the gap
    │      ├ <AmountField kind="receive"> same, no MaxChip
    │      ├ <ErrorBanner>                conditional, role="alert"
    │      ├ <RateLine>                   "1 X ≈ Y Z" + refresh spinner
    │      └ <PrimaryButton>              CTA, §7
    ├ view === 'form' && isModalOpen
    │   └ <ConfirmModal>                  role="dialog", focus trap
    │      ├ h2 "Confirm exchange"
    │      ├ <SummaryRow> x4              From / To / — divider — / Exchange rate / Service fee
    │      ├ <SecondaryButton> "Back"
    │      └ <PrimaryButton> "Confirm Exchange (0:10)"
    └ view === 'success'
        └ <SuccessPanel>
           ├ success check badge
           ├ h2 "Exchange successful"
           ├ summary + <OrderIdRow> with <CopyButton>
           └ <PrimaryButton> "Done"
```

### 3.1 Screen 1 — Default Empty Form

| Element | Content | State |
| --- | --- | --- |
| Heading | `Exchange` | — |
| You send card | label `You send`, balance `2,500.00 USDC`, `MAX`, token `USDC`, input empty with placeholder `≥0.01` | input enabled, MAX enabled |
| Swap arrow | `↓↑` icon | enabled |
| You receive card | label `You receive`, balance `0.0425 BTC`, token `BTC`, input empty with placeholder `≥0.00000013` | input enabled, no MAX chip |
| Error banner | not rendered | — |
| Rate line | `1 USDC ≈ 0.0000092 BTC` | visible once prices load; spinner while a refresh is in flight |
| CTA | `Continue` | **disabled** (`bg #e4e7ec`, text `#98a2b3`, `cursor: not-allowed`) |
| Helper text | not rendered | — |

Before the first successful price fetch, the rate line renders `Loading rate…` with the spinner, and the CTA is disabled (§7, state `rate-loading`).

### 3.2 Screen 2 — Valid Input

Reached when the form state is `valid` (§6).

- You send input holds the typed string exactly as typed, e.g. `100`.
- You receive input holds the computed, grouped value, e.g. `0.00092134`.
- Both cards have the default border (`1px #0f143733`); no red border, no banner.
- Rate line shows the current rate.
- **CTA `Continue` is enabled**, `bg #2b7bea`, white text, hover `#276fd3`, pressed `#215eb3`.
- Clicking / pressing Enter or Space on the CTA opens the Confirm modal.

### 3.3 Screen 3 — Confirm Exchange modal

Overlay on top of Screen 2. Background page is scroll-locked and `inert`.

| Row | Content example |
| --- | --- |
| Title (`h2`) | `Confirm exchange` |
| `From` | `100 USDC` |
| `To` | `0.00092134 BTC` |
| divider | 1px `#cccade` |
| `Exchange rate` | `1 USDC ≈ 0.0000092134 BTC` |
| `Service fee` | `0 BTC` |

Actions:
- `Back` — secondary button, always enabled except while submitting.
- `Confirm Exchange (0:10)` — primary, enabled, label counts down every second.

Disabled/paused sub-states are in §8.

### 3.4 Screen 4 — Exchange Successful

Replaces the form view entirely (form is unmounted; its values are kept in state until `Done`).

| Element | Content example |
| --- | --- |
| Badge | 64px circle, success green, 24px check icon |
| Heading (`h2`) | `Exchange successful` |
| Summary line | `100 USDC → 0.00092134 BTC` |
| `Order ID` | `7QK2M9XA4TB1` + copy icon button |
| `Execution date` | `28.08.2026, 14:07` |
| `Fee` | `0 BTC` |
| CTA | `Done`, primary, enabled, full width |

Nothing on this screen is disabled. Rate polling is stopped while this view is mounted.

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
  view: 'form' | 'success';
  sendAsset: Asset;          // default 'USDC'
  receiveAsset: Asset;       // default 'BTC'
  sendRaw: string;           // exactly what is in the send input
  receiveRaw: string;        // exactly what is in the receive input
  activeSource: ActiveSource;// default 'send'
  prices: Record<Asset, number> | null;
  ratesStatus: RatesStatus;
  consecutiveFetchFailures: number;
  isModalOpen: boolean;
  isSubmitting: boolean;
  order: { id: string; date: Date; from: string; to: string; rateText: string } | null;
}
```

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
  USDC: 2500,
  SOL:  12.5,
  XRP:  300,
  TRX:  1500,
};
```

Reproducible test cases these values guarantee:
- Default pair `USDC → BTC`: typing `3000` in *You send* ⇒ `insufficient-funds`.
- Default pair: typing `0.005` ⇒ `below-min` (`Min amount is 0.01 USDC`).
- Default pair: typing exactly `0.01` (= the USDC minimum) ⇒ **`valid`** — the minimum is inclusive (§6).
- Default pair: typing `100` ⇒ `valid`.
- `MAX` on default pair fills `2500`.

### 5.3 Defaults

- `sendAsset = 'USDC'`, `receiveAsset = 'BTC'` (derived from the BRIEF §7 modal example `82,150 USDC → 1 BTC`). See OQ-2.
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
| USDC | `0.00` … `0.009` (truncates to `0`) | `0.01` |
| SOL | `0.000093` | `0.000094` |
| XRP | `0.0069` | `0.007` |
| TRX | `0.02` | `0.03` |

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
- **The character `>` must not appear anywhere in the UI copy** — not on the button, not in the helper text, not in a placeholder, not in the modal or the success screen. The input placeholders use `≥` (U+2265) per the current Figma design; see §9.2 for the six exact strings. Any `>` found in a rendered string is a defect. The earlier instruction to preserve `>` in the placeholders is **cancelled** — it predates both the inclusive-minimum decision and the design fix.
- The label uses the **send** asset, always.
- Enabled interactions: hover `#276fd3`, active/pressed `#215eb3`, `transition: background-color 150ms ease`.
- `focus-visible`: `box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px #2b7bea` (Figma `focus/ring`: 4px ring + 2px gap), `outline: none`.
- Disabled: `pointer-events` stay on so the cursor shows `not-allowed`; the element is a real `<button disabled>` so it is removed from the tab order.
- Only in `valid` does a click open the modal. There is no other side effect.

---

## 8. Behaviour

### 8.1 Rate feed

- Endpoint: `GET https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","USDCUSDT","SOLUSDT","XRPUSDT","TRXUSDT"]` (the endpoint from BRIEF §2, narrowed with the `symbols` param so the response is ~6 rows instead of ~3000).
- Response `[{ symbol, price }]` → `prices[asset] = Number(price)`. A row that is missing or parses to `NaN`/`0` makes the whole fetch a failure.
- Cross rate: `rate(A→B) = prices[A] / prices[B]`.
- Poll: first fetch on mount, then every **10 000 ms**. Implemented as a self-rescheduling `setTimeout` (never overlapping requests), aborted via `AbortController` after **8 000 ms**.
- Polling is **paused** while: the confirm modal is open, `document.hidden === true`, or `view === 'success'`. On `visibilitychange → visible` and on `window online`, fire an immediate fetch and resume.
- A refresh **never** clears or rewrites typed input. Only the passive field is recomputed (§8.2).
- Status transitions:
  - first fetch in flight → `loading`; success → `ready`; failure → `error`.
  - later fetch in flight → `refreshing` (spinner visible, everything stays interactive); success → `ready`, `consecutiveFetchFailures = 0`; failure → `consecutiveFetchFailures++`.
  - `prices !== null && consecutiveFetchFailures >= 1` → keep the form fully usable, render `Rate may be outdated` under the rate line in `#6b688c` 12/16.
  - `consecutiveFetchFailures >= 3` (~30 s of failures) → set `prices = null` and `ratesStatus = 'error'` ⇒ form state `rate-error`.
- Refresh spinner: 16px ring, `border: 2px solid #cccade`, `border-top-color: #2b7bea`, `animation: spin 800ms linear infinite`, rendered inline after the rate text. `aria-hidden="true"`. Suppressed under `prefers-reduced-motion: reduce` (static ring, no rotation).
- Rate line format: `1 {SEND_ASSET} ≈ {rate} {RECEIVE_ASSET}`, `rate` via `Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 })`.

### 8.2 Bidirectional calculation

`activeSource` decides which field the user owns and which one the app writes.

```
activeSource === 'send'    → receiveRaw = trunc(sendAmount    * prices[send] / prices[receive], dec[receive])
activeSource === 'receive' → sendRaw    = trunc(receiveAmount * prices[receive] / prices[send], dec[send])
```

- `trunc(x, d)` = truncate toward zero to `d` fraction digits (not round). Applied consistently to both directions; the user is never shown more than the asset can hold.
- **The active field's string is never rewritten by a recalculation.** This is the only loop guard needed. Writing to the passive field must not set `activeSource`.
- Recalculation runs on: (a) the active input's `onChange`, (b) every successful price update, (c) a change of either asset, (d) the swap arrow, (e) `MAX`, (f) each modal quote refresh.
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
- Button spec: 40×40, `radius 999`, `bg #ffffff`, `border 1px #cccade`, icon `#181818`; hover `bg #f7f6fa` / icon `#276fd3`; pressed `bg #e4e7ec` / icon `#215eb3`; focus ring per §7. Disabled only in `rate-error`.

### 8.4 MAX chip

Rendered only inside the **You send** card, in the balance row. Style: text-only chip, Poppins SemiBold 12/16, `#2b7bea`, `radius 999`, hover `#276fd3`, pressed `#215eb3`, disabled `#98a2b3`.

On click:
1. `activeSource = 'send'`.
2. `sendRaw = format(MOCK_BALANCES[sendAsset], dec[sendAsset])` — fixed notation, trailing zeros trimmed, **no grouping** (`2500`, `0.0425`).
3. Recalculate `receiveRaw` immediately.
4. Because `sendAmount === balance`, rule 5 of §6 no longer matches ⇒ an active `insufficient-funds` error and its red border and banner **disappear in the same render**. CTA validity is re-evaluated (it becomes `valid` unless the balance is strictly below the asset minimum, in which case `below-min` — the minimum itself is valid, §6).

Disabled when `MOCK_BALANCES[sendAsset] === 0` or form state is `rate-error`.

### 8.5 Token dropdowns

- Trigger: coin icon (24px, `radius 999`) + ticker (Poppins SemiBold 15/22, `#181818`) + chevron 24px. `bg #f7f6fa`, `radius 8`, hover `bg #f7f6fa`; chevron flips to the `Dropup` glyph while open.
- List: `bg #ffffff`, `border 1px #0f143733`, `radius 12`, `padding 12`, item gap 4, `box-shadow: 0 6px 8px #21201f0a`. Anchored below the trigger, `z-index` above the cards; if it would overflow the viewport bottom, it flips above.
- Item: `padding 8`, `radius 8`, `gap 8` — 24px coin icon, ticker `#181818` Medium 14/20, full name `#6b688c` Regular 14/20. Selected item shows a `#2b7bea` check at the right. Hover/focus background `#f7f6fa`.
- **The asset selected in the opposite field is rendered `disabled`**: `aria-disabled="true"`, all text `#98a2b3`, icon at `opacity: .4`, `cursor: not-allowed`, click is a no-op, arrow-key roving focus skips it. This makes `BTC → BTC` unreachable.
- Selecting an asset:
  1. set the field's asset;
  2. re-truncate that field's raw value to the new `decimals` if the field is the active one;
  3. recalculate the passive field;
  4. re-derive form state (balance and minimum change);
  5. close the list and return focus to the trigger.
- Selecting the already-selected asset just closes the list; nothing else changes.
- Closes on: selection, `Esc`, `Tab`, outside click, scroll of the page.

### 8.6 Confirm modal & quote-lock timer

Open: only from an enabled CTA. On open — snapshot the current amounts and rate into the modal, pause background polling, lock body scroll, move focus into the dialog.

Countdown:
- Starts at `10`, label `Confirm Exchange (0:10)`, decrements once per second: `(0:09) … (0:01)`.
- Format is `0:SS` zero-padded (`0:09`, `0:10`).
- **At `0:00`:**
  1. **pause** — Confirm becomes `disabled`, label `Refreshing rate…`, `Back` stays enabled;
  2. **fetch a fresh rate** — one-off call to the same endpoint with the same 8 s timeout;
  3. **recalculate** — using the locked `activeSource`, recompute the passive amount and the displayed `From` / `To` / `Exchange rate` rows;
  4. **restart** — timer back to `10`, Confirm re-enabled, label `Confirm Exchange (0:10)`.
- Refresh failure: keep the previous rate, render `Could not refresh rate, using last known rate` under the rows in `#D32F2F` 12/16, and restart the timer anyway. After **2 consecutive** in-modal failures: Confirm stays `disabled` with label `Rate unavailable`, the countdown stops, and a `Retry` text button appears in the modal body.
- If the refreshed rate pushes the amount into `insufficient-funds` or `below-min`, the modal closes automatically and the form shows the corresponding error state. **[FALLBACK — not in BRIEF]**

`Back`:
- closes the modal, clears the interval, unlocks scroll, resumes background polling;
- **all typed values, assets and `activeSource` are preserved** — the user is returned to Screen 2 exactly as they left it;
- focus returns to the `Continue` button.
- `Esc` and a click on the backdrop do exactly the same as `Back`.

`Confirm Exchange`:
1. guard: ignore if `isSubmitting` is already `true`;
2. `isSubmitting = true` — Confirm and Back both become `disabled`, Confirm shows a spinner and the label `Processing…`, the countdown stops;
3. generate the order (`id`, `date = new Date()`, frozen `from` / `to` / `rateText` strings);
4. after a **600 ms [FALLBACK]** simulated delay: close the modal, `view = 'success'`, `isSubmitting = false`.

A second click, a double click, or `Enter` held down cannot produce a second order — the button is `disabled` and the `isSubmitting` guard runs first.

### 8.7 Success screen

- **Order ID**: 12 characters from `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`, generated with `crypto.getRandomValues`. Rendered in a monospace-ish tracking, `#181818`, 15/22 SemiBold. Example: `7QK2M9XA4TB1`.
- **Copy**: an icon button (Figma `24/copy`) with `aria-label="Copy order ID"`.
  - success → the icon swaps to `24/check`, an adjacent label reads `Copied`, `#12B76A` **[FALLBACK green]**; reverts after **2000 ms**;
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
- Balance in the balance row: grouped with exactly the asset's `decimals`, then trailing zeros trimmed (`2,500`, `0.0425`).
- Values pasted into an input are ungrouped; grouping only appears in the passive field, the modal and the success screen.

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
| E10 | **Swapping with an amount entered** | §8.3. Values move across, state re-derived. |
| E11 | **Double click on `Confirm Exchange`** | Exactly one order. Guarded by `isSubmitting` **and** the `disabled` attribute set in the same handler. |
| E12 | **Timer hits 0:00 while the tab is backgrounded** | `setInterval` drift is corrected against `Date.now()`; on return to the tab the remaining time is recomputed and, if it is ≤ 0, the refresh cycle runs once (not N times). |
| E13 | **Modal open when a refresh would fire** | Background polling is paused while the modal is open; the modal owns the only refresh. |
| E14 | **`navigator.clipboard` blocked** (insecure context, denied permission) | No exception surfaces; `Copy failed` label + `role="status"` announcement. The Order ID text itself is selectable so a manual copy is possible. |
| E15 | **Mobile viewport (320–767 px)** | Layout per §13. The dropdown list is width-matched to the card, the modal becomes a bottom sheet, buttons go full width. No horizontal page scroll at 320 px. |
| E16 | **Both fields empty + swap arrow** | Assets swap, both fields stay empty, placeholders update, CTA stays disabled. |
| E17 | **Balance is 0 for the selected send asset** | `MAX` is disabled. Any positive amount yields `insufficient-funds` (rule 5 outranks rule 6). |
| E18 | **User deletes the whole active field** | Passive field is cleared to `''`, all errors clear, state returns to `empty`. |
| E19 | **`prefers-reduced-motion: reduce`** | Spinner stops rotating (static ring), the swap-arrow rotation and the modal fade/scale are removed; state changes are instant. |
| E20 | **RTL** | Not supported and not required (see §2). No RTL-specific code. |
| E21 | **Amount exactly equal to the minimum** | The minimum is **inclusive** (§6). Entering exactly `minAmount[sendAsset]` (e.g. `0.01` for USDC, `0.00000013` for BTC, `0.03` for TRX) yields **`valid`**: CTA `Continue` enabled, no helper text, no banner, no red border. The largest rejected amount is one unit of the last decimal below the minimum (see the boundary table in §6). This is the classic off-by-one spot — the operator must be `<`, not `<=`. Comparison uses the parsed `Number` with no epsilon tolerance. |
| E22 | **Minimum boundary reached indirectly** | The same inclusive rule applies when the send amount lands exactly on the minimum via `MAX` (balance equals the minimum), via a swap, via an asset change, or via a poll-driven recalculation of the send field — in all four paths the state is `valid`, not `below-min`. |

---

## 11. Design tokens

Values marked **(Figma)** were read from the file `Bw2TEVGyo2298cbcRUQKlc` via variable definitions. Values marked **[FALLBACK]** are not in the Figma file and were chosen here.

> **Important:** the Figma file contains a **design-system library only** — token boards ("Stage 1/2 Review"), a component set (`Button`, `Icon Button`, `Chip Button`, `Amount Field`, `Dropdown List`, `Dropdown Item`, `Summary Row`, `Balance Row`, `Trailing Content`, coin icons, `24/copy`, `24/check`, `24/important`) and a page background. **There are no assembled mockups of the 4 screens.** Screen composition in §3 is derived from BRIEF §7 plus these components, not copied from a Figma frame.

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
--success:       #12B76A;  /* [FALLBACK] success badge/check, not in Figma or BRIEF */
```

Figma also defines `input-field/border/error = #f20f0f`. **The BRIEF values win** (`#FF4D4D` / `#FFF0F0` / `#D32F2F`) because they are an explicit client requirement. See OQ-5.

### 11.3 Typography (Figma)

Family: **Poppins**, loaded from Google Fonts (400, 500, 600) with `font-display: swap`.
Stack: `'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.

| Role | Size / line-height | Weight | Used for |
| --- | --- | --- | --- |
| `body-lg` | 20 / 30 | 600 | amount input value |
| `body-md` | 15 / 22 | 600 | token ticker, summary values, Order ID |
| `body-sm` | 14 / 20 | 400/500 | dropdown item |
| `body-2sm` | 12 / 16 | 400/600 | balance row, MAX chip |
| `caption-sm` | 12 / 16 | 400 | field label, helper text, banner text, rate line |
| `button-lg` | 16 / 24 | 500 | CTA labels |
| `h1` | 28 / 36 **[FALLBACK]** | 600 | `Exchange` |
| `h2` | 20 / 30 **[FALLBACK]** | 600 | modal + success headings |

Letter-spacing: `0` everywhere (Figma `typography/letterspacing/default`).

### 11.4 Spacing scale (Figma)

`4, 8, 12, 16, 20, 24, 32` px. Nothing outside this scale.

### 11.5 Radius (Figma)

`S = 8`, `M = 12`, `L = 16`, `XL = 24`, `Full = 999`.
Buttons `8`, amount cards / dropdown list / banner `12`, exchange card `24` **[FALLBACK, chosen from the XL step]**, chips / icon button / coin icons `999`.

### 11.6 Focus ring (Figma `focus/ring`)

Ring width `4`, gap `2`, colour `#2b7bea`:
```css
:focus-visible { outline: none; box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px #2b7bea; }
```
Applied to: both inputs, both token triggers, dropdown options, MAX chip, swap arrow, all buttons, the copy button and the banner `Retry` link.

### 11.7 Amount Field (Figma component `86:1040`)

- Card `380 × 102` at desktop → in this layout the card is **fluid width**, `min-height 102`.
- `border-radius 12`, `background #f7f6fa`, `border 1px #0f143733`, `padding 16`.
- Hover: `background #f7f6fa` (unchanged), border unchanged.
- Focus (input focused): `border 2px #2b7bea` + focus ring on the input.
- Error: `border 2px #FF4D4D`, helper text `#D32F2F`.
- Disabled: `background #f7f6fa`, `border 1px #e4e7ec`, label `#98a2b3`, value `#98a2b3`.
- Internal layout: row 1 = label (left) / balance + MAX (right); row 2 = token trigger (left) / amount input (right, `text-align: right`).
- Helper text sits **outside** the card, `margin-top 4`, `padding-inline 16`.
- Placeholder colour `#b8b6d2` (Figma `input-field/text/placeholder`); the placeholder **string** is `≥{MIN_AMOUNT}` per the current Figma design — see §9.2 for the six exact values.

### 11.8 Buttons (Figma component `7:4069`)

| | Primary | Secondary |
| --- | --- | --- |
| default | bg `#2b7bea`, text `#ffffff` | bg `#ffffff`, border `1px #cccade`, text `#6b688c` |
| hover | bg `#276fd3` | border `#b8b6d2` |
| pressed | bg `#215eb3` | text `#565475`, border `#9996be` |
| focus | + focus ring | + focus ring |
| disabled | bg `#e4e7ec`, text `#98a2b3` | border `#e4e7ec`, text `#98a2b3` |
| loading | spinner replaces/precedes label, button `disabled` | same |

Size lg: `height 48`, `padding-x 24`, `radius 8`, `gap 8`.

### 11.9 Page background

Figma `background` (`75:460`, 1440×1024): flat `#f7f6fa` with two large soft radial ellipses. Implementation: `background: #f7f6fa` plus two `radial-gradient` blobs, `pointer-events: none`, hidden below 768 px (flat `#f7f6fa` on mobile) **[FALLBACK simplification]**.

---

## 12. Motion

| Element | Transition |
| --- | --- |
| Button background | `background-color 150ms ease` |
| Card border colour | `border-color 150ms ease` |
| Swap arrow icon | `transform 200ms ease` (180° rotate on click) |
| Dropdown open | `opacity 120ms ease, transform 120ms ease` (translateY -4px → 0) |
| Modal backdrop | `opacity 150ms ease` |
| Modal panel | `opacity 150ms ease, transform 150ms ease` (scale .98 → 1; on mobile: translateY 100% → 0) |
| Rate spinner | `spin 800ms linear infinite` |
| Error banner appear | `opacity 120ms ease` — no height animation |

All of the above are disabled under `@media (prefers-reduced-motion: reduce)`.

---

## 13. Responsive

Breakpoints **[FALLBACK — Figma has only a 1440px desktop background]**:

| Range | Behaviour |
| --- | --- |
| `≥ 768px` | Exchange card `width: 100%; max-width: 480px`, centred horizontally and vertically, card `padding: 24`, `radius 24`, `background #ffffff`. Decorative background blobs visible. Modal is a centred dialog, `max-width 420px`, `radius 24`, buttons in one row (`Back` `1fr` / `Confirm` `2fr`, gap 12). |
| `< 768px` | Card is full width with `16px` page padding, `padding: 16`, top-aligned with `24px` top offset (no vertical centring). Background flat. Amount value drops to `18/26`. Modal becomes a **bottom sheet**: full width, pinned to the bottom, `border-radius: 24px 24px 0 0`, buttons stacked full width with `Confirm` on top and `Back` below, `gap 12`. Dropdown list matches the card width. Success screen buttons full width. |
| `< 360px` | Amount value drops to `16/24`. Balance row text truncates with an ellipsis; the `MAX` chip never shrinks or wraps. Page padding `12px`. |

Hard requirements: no horizontal scrollbar at **320px**; all interactive targets ≥ **40×40 px** (the MAX chip gets an invisible padded hit area to reach 40px height).

---

## 14. Accessibility

### Semantics
- `<main>` wraps everything; one `<h1>Exchange</h1>`; modal title and success title are `<h2>`.
- Each amount input has a real `<label htmlFor>` — `You send` / `You receive` — visible, not a placeholder.
- Balances are plain text inside the card, associated with the input via `aria-describedby`.
- The exchange card is a `<form>` with `onSubmit` → open modal, so Enter in an input submits when the state is `valid` (and does nothing otherwise).

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
- The rate line is **not** a live region (a 10 s poll would spam a screen reader).
- One visually-hidden `role="status"` element announces discrete events only: `Rate updated` (after a modal refresh), `Order ID copied`, `Copy failed`, `Exchange successful`.
- The modal countdown is plain text inside the button label with `aria-live="off"`; the accessible name of the button is kept stable via `aria-label="Confirm exchange"` so the seconds are not re-announced every tick.

### Token dropdown
- Trigger: `<button aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}>`.
- List: `role="listbox"` with `aria-labelledby` pointing at the field label; options `role="option"` with `aria-selected`.
- Opposite-field asset: `aria-disabled="true"`, not activatable, skipped by arrow navigation.
- Keyboard: `Enter` / `Space` / `ArrowDown` opens and focuses the selected option; `ArrowUp` / `ArrowDown` move (wrapping, skipping disabled); `Home` / `End` jump; `Enter` / `Space` select; `Esc` closes and returns focus to the trigger; `Tab` closes and moves on.

### Modal
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` = title id, `aria-describedby` = summary block id.
- On open, focus moves to the dialog container (`tabIndex={-1}`); the background gets `inert` (with `aria-hidden="true"` as a fallback) and `body { overflow: hidden }`.
- **Focus trap**: `Tab` from the last focusable wraps to the first, `Shift+Tab` from the first wraps to the last. Focusables: dialog container, `Back`, `Confirm`, `Retry` when present.
- `Esc` closes (identical to `Back`).
- On close, focus returns to the `Continue` button that opened it.

### Success view
- On mount, focus moves to the `<h2 tabIndex={-1}>Exchange successful</h2>`.
- The check badge is decorative (`aria-hidden`); the heading carries the meaning.
- Copy button `aria-label="Copy order ID"`; the Order ID text is selectable.
- `Done` returns focus to the *You send* input after the reset.

### Visuals
- `:focus-visible` ring per §11.6 on every interactive element; `:focus` without `:focus-visible` shows no ring.
- The below-min requirement is never communicated *only* by the low-contrast disabled CTA — it is duplicated as helper text in `#6b688c` (§6.1).
- Placeholders (`#b8b6d2`) never carry unique information; the minimum is also in the helper text and the CTA label.
- Contrast (passing): `#181818` on `#f7f6fa` = 15.6:1 ✓; `#6b688c` on `#f7f6fa` = 4.9:1 ✓; `#D32F2F` on `#FFF0F0` = 5.0:1 ✓; `#181818` on `#ffffff` = 17.1:1 ✓.

### 14.1 Accepted contrast waiver (client-approved — NOT a defect)

The client has reviewed and **knowingly accepted** two WCAG 2.1 AA 1.4.3 (Contrast Minimum) failures. The accent colour `#2b7bea` stays exactly as it is. Neither colour, font size nor font weight may be changed to "fix" these.

| Element | Foreground / background | Measured | AA requirement | Status |
| --- | --- | --- | --- | --- |
| Primary CTA label (Poppins Medium **16px** — not "large text", which needs ≥18.66px bold or ≥24px) | `#ffffff` on `#2b7bea` | **4.1:1** | 4.5:1 | **Waived by client** |
| `MAX` chip label (Poppins SemiBold **12px**) | `#2b7bea` on `#f7f6fa` | **3.8:1** | 4.5:1 | **Waived by client** |

Consequences for implementation and review:
- Do **not** darken the accent (a `#1c62c4`-style change was rejected), do not enlarge the CTA label, do not add a text shadow or an outline as a workaround.
- A reviewer must **not** mark the build FAIL because of these two specific measurements. They are the only accepted contrast exceptions.
- **Every other accessibility requirement in §14 remains mandatory in full** — semantics, labels, `inputMode`, `role="alert"`, `aria-describedby`, `aria-invalid`, the dialog focus trap, `Esc`, focus return, keyboard-only completability, and the visible `:focus-visible` ring. Any other contrast pair not listed in the waiver table above must still meet AA (4.5:1 for normal text, 3:1 for UI-component boundaries and the focus ring).
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
8. A request to `api.binance.com/api/v3/ticker/price` fires on mount and then every 10 s (±200 ms) while the form view is visible and the modal is closed.
9. Requests carry an `AbortController` and abort after 8 s.
10. Polling stops while the modal is open, while `document.hidden`, and while `view === 'success'`; it resumes with an immediate fetch on `visibilitychange → visible` and on `online`.
11. Rate line reads `1 {SEND} ≈ {RATE} {RECEIVE}` and updates when either asset changes.
12. A background refresh never clears, rewrites or re-formats the field the user is typing in, and never moves the caret.
13. Spinner is visible while a refresh is in flight and hidden otherwise.

**Calculation**
14. Typing in *You send* sets `activeSource = 'send'` and writes only *You receive*, using `send * P_send / P_receive`.
15. Typing in *You receive* sets `activeSource = 'receive'` and writes only *You send*, using `receive * P_receive / P_send`.
16. There is no infinite update loop: the active field is never written by the calculation effect (verifiable in code — the effect writes exactly one of the two setters, chosen by `activeSource`).
17. Computed values are **truncated**, not rounded, to the target asset's decimals.
18. Clearing the active field clears the passive field to `''` (never `NaN`, `0` or `undefined`).

**Form state machine**
19. `FormState` is derived by a pure function, not stored in `useState`.
20. All 7 states of §6 are reachable and each renders exactly the row of the §6.1 table.
21. `insufficient-funds` shows a `2px #FF4D4D` border on the *You send* card only.
22. The error banner uses `#FFF0F0` background, `#D32F2F` text, an info-circle icon and the verbatim string `There are insufficient funds in your account. Please top up your balance.`
23. The banner is rendered **below the You receive container**.
24. `below-min` CTA label is exactly `Min amount is {MIN} {ASSET}` with **no comparison sign** — e.g. `Min amount is 0.01 USDC` for USDC and `Min amount is 0.00000013 BTC` for BTC.
25. Input placeholders use `≥` (U+2265, a single character — not `>=`, not `&ge;`, not `>`), no space before the number, as in the current Figma design. All six strings match **exactly**, character for character: BTC `≥0.00000013`, ETH `≥0.000004`, USDC `≥0.01`, SOL `≥0.000094`, XRP `≥0.007`, TRX `≥0.03`. (BRIEF §3 still shows `>{MIN_AMOUNT}` — that string is stale and must not be followed.)
26. The character `>` appears **nowhere** in rendered UI copy — not in a placeholder, the CTA, the helper text, the banner, the modal or the success screen. (`grep -n '>' ` over the JSX string literals returns no comparison sign in user-facing text.)
27. `below-min` also renders helper text under the send card in `#6b688c`.
28. `insufficient-funds` takes precedence over `below-min` when both conditions hold.
29. The minimum is **inclusive**: the below-min condition is `sendAmount < minAmount[sendAsset]`. The operator is `<`; there is **no `<=`** in the minimum check anywhere in the code.
30. **Boundary (off-by-one check):** entering exactly the minimum yields state **`valid`** — CTA is `Continue`, **enabled**, with no helper text, no banner and no red border. Verified for at least USDC (`0.009` ⇒ `below-min`, `0.01` ⇒ `valid`), BTC (`0.00000012` ⇒ `below-min`, `0.00000013` ⇒ `valid`) and TRX (`0.02` ⇒ `below-min`, `0.03` ⇒ `valid`).
31. The placeholder sign `≥`, the CTA label without a sign, the helper text without a sign and the `<` operator in code all agree with each other — no combination states a rule the app does not enforce.

**CTA**
32. The CTA is enabled *only* in state `valid`; it is a real `<button disabled>` in every other state (not tab-focusable).
33. CTA colours match the §7 table for default/hover/pressed/disabled.
34. Clicking the enabled CTA is the only way to open the modal.

**Swap arrow**
35. Clicking it swaps the assets, moves the previous *receive* value into *send*, sets `activeSource = 'send'`, and recalculates — in that order.
36. Insufficient-funds / below-min state is re-derived against the new send asset after a swap.
37. With both fields empty, a swap only exchanges the assets and placeholders (including the `≥` sign and the new minimums); both fields stay empty.

**MAX**
38. `MAX` exists only in the *You send* card.
39. Clicking `MAX` sets `sendRaw` to the send asset's balance (ungrouped, asset decimals) and recalculates the receive field.
40. Clicking `MAX` while `insufficient-funds` is active clears the red border and the banner in the same render and re-evaluates the CTA.
41. `MAX` is disabled when the balance is 0 or the state is `rate-error`.

**Dropdowns**
42. Both dropdowns list all 6 assets with icon + ticker + full name.
43. The asset selected in the opposite field is rendered visually disabled with `aria-disabled="true"`, is not clickable, and is skipped by arrow-key navigation — `BTC → BTC` is unreachable.
44. Selecting an asset re-truncates the active value, recomputes the passive field, re-derives the state, updates that field's placeholder, closes the list and returns focus to the trigger.
45. `Esc`, outside click and `Tab` all close the list.

**Modal**
46. The modal shows `From`, `To`, `Exchange rate` and `Service fee` with `Service fee` always `0 {RECEIVE_ASSET}`.
47. The Confirm label counts `(0:10) → (0:01)` in 1 s steps, format `0:SS`.
48. At `0:00` the button is disabled with label `Refreshing rate…`, a fresh rate is fetched, amounts and the rate row are recalculated, and the timer restarts at `0:10`.
49. A failed in-modal refresh keeps the previous rate, shows `Could not refresh rate, using last known rate`, and restarts the timer; two consecutive failures leave Confirm disabled with `Rate unavailable` and show a `Retry`.
50. `Back` closes the modal and Screen 2 is restored with the typed values, assets and `activeSource` unchanged.
51. `Esc` and a backdrop click behave identically to `Back`.
52. Focus returns to the `Continue` button after any close.
53. Double-clicking `Confirm Exchange` creates exactly one order (guard is verifiable in code: `if (isSubmitting) return;` plus `disabled`).
54. Background polling is paused for the whole time the modal is open.

**Success**
55. Order ID is a 12-character uppercase alphanumeric string generated per exchange (two exchanges give different ids).
56. Copy button writes the id to the clipboard, shows `Copied` for 2 s, and reverts; a clipboard failure shows `Copy failed` instead of throwing.
57. Execution date renders as `DD.MM.YYYY, HH:mm` with zero-padded parts, 24-hour clock.
58. `Fee` reads `0 {RECEIVE_ASSET}`.
59. `Done` resets inputs, `activeSource`, both assets (back to `USDC → BTC`), the order and all errors, and returns the user to Screen 1 with polling resumed and both placeholders back to `≥0.01` / `≥0.00000013`.

**Validation**
60. Letters, spaces, `-`, `+`, `e` are stripped on input and on paste.
61. A comma is converted to a dot; only the first dot survives.
62. Leading zeros are stripped (`007` → `7`), `.5` becomes `0.5`, `00` becomes `0`.
63. Fraction input is capped at the asset's decimals (typing a 3rd decimal in USDC does nothing).
64. The integer part is capped at 12 digits.

**Edge cases**
65. Every case E1–E19, E21 and E22 of §10 is implemented and reproducible (E20 / RTL is explicitly out of scope and is not checked).
66. No number reaches the DOM via `String(n)` / `.toString()`; all displayed numbers go through `Intl.NumberFormat` — `1e-7` never appears on screen.
67. Failing the first fetch (e.g. offline in DevTools) produces the `rate-error` screen; going back online recovers automatically.

**A11y**
68. Each input has a programmatically associated **visible `<label>`** (`You send` / `You receive`), `inputMode="decimal"`, and `aria-describedby` covering balance / helper / banner as applicable. The placeholder is never the accessible name.
69. The minimum is available **outside the placeholder**: the `below-min` helper text is linked via `aria-describedby`, and the CTA label repeats it. Clearing the field or ignoring the placeholder never hides the constraint.
70. The insufficient-funds banner is `role="alert"`.
71. The send input carries `aria-invalid="true"` in `insufficient-funds` and `below-min`.
72. The modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, a working focus trap in both Tab directions, `Esc` to close, background `inert`, and body scroll lock.
73. The whole flow — pick asset, type, swap, MAX, open modal, confirm, copy, done — is completable with the keyboard only.
74. A visible focus ring (`0 0 0 2px #fff, 0 0 0 6px #2b7bea`) appears on every interactive element via `:focus-visible`.
75. The below-min minimum is never communicated only by the disabled CTA.
76. **Contrast waiver (§14.1):** the CTA label (`#ffffff` on `#2b7bea`, 4.1:1) and the `MAX` chip label (`#2b7bea` on `#f7f6fa`, 3.8:1) are client-accepted AA exceptions — a reviewer must **not** FAIL the build on these two, and the accent must still be exactly `#2b7bea`. Every *other* contrast pair meets AA (4.5:1 normal text, 3:1 UI boundaries / focus ring), and every other §14 requirement is checked in full.

**Responsive & design**
77. No horizontal scrollbar at 320 px width.
78. Below 768 px the modal renders as a full-width bottom sheet with stacked, full-width buttons.
79. All interactive targets are at least 40×40 px on mobile.
80. Colours, radii, spacing, font sizes and weights match §11; no hard-coded value outside the token set.
81. Poppins is loaded and applied; a system-font fallback is declared, and the fallback also renders `≥` (U+2265) correctly.
82. All motion listed in §12 is disabled under `prefers-reduced-motion: reduce`.

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
- Enforced by §6 rule 6 + the boundary table, §6.1, §7, §9.2, §10 E21/E22, and criteria 24, 25, 26, 29, 30 and 31.

**RD-3 — Accent `#2b7bea` stays; two contrast failures are waived.** Confirmed by the client as a deliberate trade-off, not a defect: CTA label `#ffffff` on `#2b7bea` = **4.1:1** and `MAX` chip label `#2b7bea` on `#f7f6fa` = **3.8:1**, both below the WCAG 2.1 AA 1.4.3 threshold of 4.5:1 for non-large text. No colour, font size or font weight may be changed to compensate, and no workaround (text shadow, outline, overlay) may be added. A reviewer must not FAIL the build on these two measurements. All other accessibility requirements, including every other contrast pair, remain mandatory in full. Documented in §14.1 and enforced by criterion 72.

### 16.2 Open questions (8 remaining — each already has a working default in this SPEC)

**OQ-2 — Default asset pair.** Not stated anywhere. This SPEC picks `USDC → BTC`, inferred from the BRIEF §7 modal example (`82,150 USDC → 1 BTC`). Confirm, or name the intended default.

**OQ-4 — Grouping inside the inputs.** Figma's `Amount Field / State=Filled` shows `2,000.00` — grouped, with padded decimals. Grouping a *focused, editable* field requires caret-position bookkeeping. This SPEC groups only the passive (computed) field, the modal and the success screen, and keeps the actively-typed field ungrouped. Confirm this is acceptable, or budget for a masked input.

**OQ-5 — Which red?** BRIEF §6A gives `#FF4D4D` / `#FFF0F0` / `#D32F2F`; the Figma input tokens give `#f20f0f` for both border and text and no tinted background. This SPEC uses the BRIEF values and ignores `#f20f0f`. Confirm, or align the design system.

**OQ-6 — Network fee row.** The Figma `Summary Row` component ships `Network fee 0.0004 BTC` and a `Total` variant. The brief says the service fee is always `0` and never mentions a network fee. This SPEC omits both. Confirm.

**OQ-8 — Success green.** Neither the BRIEF nor the Figma variables define a success colour (Figma has only a `24/check` glyph). `#12B76A` is a fallback. Confirm or supply a token.

**OQ-9 — Missing Figma screens.** The Figma file has no assembled frames for the 4 screens, so the page composition, the exchange-card container (max-width, padding, radius, heading), the modal layout and the whole success screen are reconstructions from BRIEF §7 + the component library. If screen frames exist elsewhere, share the link and this SPEC's §3, §11.9 and §13 should be re-derived from them.

**OQ-10 — Confirm delay.** There is no backend, so `Confirm` resolves after a simulated 600 ms. Confirm that a fake latency is wanted at all (the alternative is an instant transition).

**OQ-11 — Receive-side minimum.** The brief validates only the send side. A tiny send amount can produce a receive amount that truncates to `0` (e.g. `0.01 USDC → 0 BTC` is impossible in practice). This SPEC does not block it. Confirm whether the receive amount should also be validated against the receive asset's minimum.
