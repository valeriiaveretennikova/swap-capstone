# Swap — capstone

Застосунок обміну криптоактивів і бібліотека його UI-компонентів у Storybook.

| | |
|---|---|
| Застосунок | https://swap.veretennikova.com |
| Storybook | https://swap-storybook.veretennikova.com |
| Візуальні діффи | [Chromatic](https://www.chromatic.com/builds?appId=6a91bea5a4f6ed5a2ac1265c) |
| Макет | [Figma — L10 Capstone](https://www.figma.com/design/Bw2TEVGyo2298cbcRUQKlc/L10---Capstone?node-id=142-291) |

Стек: Vite + React 19 + TypeScript, CSS Modules. Прод-залежності — **тільки** `react` і `react-dom`.

---

## Запуск

Потрібен Node 22 (та сама версія, що в CI).

```bash
npm ci
npm run dev              # застосунок на localhost:5173
npm run storybook        # Storybook на localhost:6006
```

| Скрипт | Що робить |
|---|---|
| `npm run dev` | дев-сервер застосунку |
| `npm run build` | `tsc -b` + прод-збірка у `dist/` |
| `npm run preview` | локальний перегляд прод-збірки |
| `npm run typecheck` | `tsc --noEmit` без емісії |
| `npm run lint` | `oxlint` |
| `npm run storybook` | Storybook у режимі розробки |
| `npm run build-storybook` | статичний Storybook у `storybook-static/` |

---

## Структура

```
src/
├── components/   застосунок — те, що працює на swap.veretennikova.com
├── storybook/    бібліотека компонентів за макетом Figma
├── hooks/  lib/  constants.ts  types.ts
└── index.css     дизайн-токени
```

**Проєкт має два продукти, і кожен має власний деплой.**

`src/components` — застосунок обміну: стани форми, валідація, курс, клавіатурна навігація. Збирається в `dist/` і працює на **swap.veretennikova.com**.

`src/storybook` — бібліотека UI-компонентів, реалізація дизайн-системи з Figma. Збирається в `storybook-static/`, працює на **swap-storybook.veretennikova.com** і покрита візуальною регресією в Chromatic: кожен пуш у `main` звіряє 42 знімки з базою.

Обидві теки читають **одні дизайн-токени** з `src/index.css` — кольори, типографіку, відступи, радіуси. Це і є спільне джерело правди: макет задає значення, токени їх фіксують, застосунок і бібліотека їх споживають.

Компоненти бібліотеки — **контрольовані**: варіант задається пропсом `state`, а не псевдокласом. `state="hover"` вмикає клас, а не покладається на `:hover`. Це звичайна практика бібліотек компонентів: варіант стає частиною API, його можна відрендерити в будь-якому оточенні, а знімок візуальної регресії детермінований і не залежить від того, чи має документ фокус у хмарному браузері.

`.storybook/main.ts` читає stories з `src/storybook/**` — бібліотека документує сама себе, а не застосунок.

---

## Бібліотека

42 stories, по одній на кожен варіант Figma.

| Компонент | Figma | Варіанти |
|---|---|---|
| `Button` | `7:4069` | 12 — Primary/Secondary × Default, Hover, Pressed, Focus, Disabled, Loading |
| `IconButton` | `7:9618` | 5 |
| `ChipButton` | `77:3399` | 5 |
| `DropdownItem` | `7:8551` | 6 — плюс Selected |
| `CurrencySelector` | `86:612` | 6 — плюс Expanded |
| `AmountField` | `86:1040` | 8 — три різні стани фокуса |

`glyphs.tsx` — гліфи, експортовані з Figma без змін; колір іде через `currentColor`, тому стан перефарбовує їх сам.

**Фокус-кільце.** У макеті `Focus/GapWidth: 2` + `Focus/RingWidth: 4`, тобто білий зазор 2px і синя смуга 2px. Глобальний токен `--focus-ring` в `index.css` ширший — там смуга 4px, і бібліотека його **не використовує**. Кільце є рівно в одному стані `AmountField` — `FocusVisible`; решта фокусних станів перефарбовують рамку картки.

---

## Деплой

Три незалежні конвеєри, усі з `main`:

| Куди | Чим | Команда збірки | Вихід |
|---|---|---|---|
| `swap.veretennikova.com` | Cloudflare Workers Builds | `npm run build` | `dist/` |
| `swap-storybook.veretennikova.com` | Vercel (`vercel.json`) | `npm run build-storybook` | `storybook-static/` |
| Chromatic | GitHub Actions | `build-storybook` | 42 снапшоти |

Chromatic іде через `.github/workflows/chromatic.yml`: тригер — пуш у `main` плюс `workflow_dispatch`. Токен лежить у секретах репозиторію, локально `npx chromatic` не запуститься. `fetch-depth: 0` обов'язковий — без повної історії Chromatic не має з чим порівнювати.

---

## Документи

| Файл | Що в ньому |
|---|---|
| `SPEC.md` | специфікація застосунку, 131 критерій приймання в §15, ухвалені рішення в §16.1 |
| `BRIEF.md` | вихідне ТЗ; де воно розходиться зі `SPEC.md`, виграє `SPEC.md` |
| `HANDOVER.md` | стан робіт, пастки середовища, стоп-лист рішень |
| `agents.html` | карта агентів, якими велась розробка |
