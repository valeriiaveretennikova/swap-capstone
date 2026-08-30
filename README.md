# Swap

Swap one crypto asset for another, with no fee. A single-page app: one card, and the whole exchange happens inside it from start to finish.

Live app — https://swap.veretennikova.com
Component library — https://swap-storybook.veretennikova.com

---

## What it is

An exchange form for six assets: BTC, ETH, USDC, SOL, XRP, TRX. You give one asset and receive another at the current market rate. The fee is 0%.

Balances in this version are defined in code — there is no backend, and this is a study project. The only real network call is the public Binance ticker, which the rate comes from.

## How it works

**1. Enter an amount.** Two cards: "You send" and "You receive". Each one picks an asset from the list and takes an amount. Type into either — the other is calculated for you at the current rate. `MAX` fills in your whole balance, and the arrow between the cards swaps the direction of the exchange.

The rate is live: it refreshes every 10 seconds. Above the exchange button there is a ring that fills as the time to the next refresh runs out, so you can see how fresh the number is.

The form will not let you go further if the amount is below the minimum for that asset or above your balance. In the first case the button tells you the minimum; in the second the card is highlighted and a message appears.

**2. Confirm.** The card shows the summary: what you give, what you get, at what rate. The rate is locked here for 10 seconds — exactly as long as you have to decide. Miss it and the rate refreshes on its own, and the amount is recalculated.

**3. Done.** A success screen with an order ID.

All three steps live in one card. It swaps its own contents rather than opening anything on top: there are no modals, overlays or dialogs anywhere in the app.

---

## Documents

| File | What is in it |
|---|---|
| `SPEC.md` | specification: screens, states, formulas, edge cases, acceptance criteria |
| `BRIEF.md` | the original assignment |
| `docs/ENGINEERING.md` | technical notes: build layout, CSS Modules pitfalls, Chromatic setup |
