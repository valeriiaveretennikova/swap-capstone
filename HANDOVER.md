# HANDOVER — Swap capstone

Передача для продовження роботи над **Storybook і Chromatic** в іншій сесії.
Дата: 2026-08-28.

---

## 1. Де що лежить

| | |
|---|---|
| Проєкт | `/Users/valeriia.veretennikova/Documents/Development/DE/SWAP` |
| Репозиторій | https://github.com/valeriiaveretennikova/swap-capstone (**private**) |
| Live URL | https://swap-capstone.valeriia-veretennikova.workers.dev |
| Деплой | Cloudflare **Workers Builds** (не Pages), автоматично з пуша в `main` |
| Специфікація | `SPEC.md` — 1533 рядки, **131 acceptance criteria** у §15 |
| Вихідне ТЗ | `BRIEF.md` (де ТЗ і SPEC розходяться — **виграє SPEC**, розбіжності в §16.1) |
| Карта агентів | `agents.html` |

Стек: Vite + React 19 + TypeScript, CSS Modules. Прод-залежності — **тільки** `react` і `react-dom`.

---

## 2. Стан коду

**У проді:** коміт `bd10886` — `refactor(swap): переробка UI під макет Figma`.

**Локально НЕ закомічено — 26 змін.** Нічого з переліченого нижче в git ще немає:

- `.storybook/` — конфіг Storybook
- `.github/workflows/chromatic.yml` — воркфлоу Chromatic
- 8 файлів `*.stories.tsx`
- 3 нові компоненти: `IconButton`, `ChipButton`, `DropdownItem` (+ їхні `.module.css`)
- правки в `AmountField`, `SwapArrowButton`, `TokenSelect` — вони тепер використовують ці примітиви
- `package.json` / `package-lock.json` — dev-залежності Storybook
- `.claude/agents/builder.md` — **окреме рішення, див. §7**

Збірка зелена: `tsc --noEmit -p tsconfig.app.json`, `npm run build`, `npx oxlint` (0 errors, 3 преіснуючі warning'и `set-state-in-effect`, які SPEC прямо вимагає).

### Базова позначка прод-бандла

```
JS   237 298 B
CSS   17 669 B
```

Це **актуальна** база станом на цю передачу. Якщо десь у старих нотатках трапиться `17 649 B` — воно застаріле: `DropdownItem` отримав стан `:active` (+20 B нетто).

Stories і конфіг Storybook у прод-граф **не входять** — `src/main.tsx` їх не імпортує. Тому будь-яка правка stories має лишати JS **байт у байт** тим самим. Якщо JS зрушив після правки лише stories — щось потрапило в прод-граф помилково, шукай імпорт.

---

## 3. Storybook

```bash
npm run storybook        # localhost:6006
npm run build-storybook  # storybook-static/
```

**Storybook 10.5.10.** `index.json`: **58 entries = 50 stories + 8 Docs-сторінок**.

| Компонент | Stories |
|---|---|
| `AmountField` | 13 |
| `Button` | 12 |
| `DropdownItem` | 6 |
| `IconButton` | 5 |
| `ChipButton` | 5 |
| `RateRing` | 4 |
| `TokenSelect` | 3 |
| `ErrorBanner` | 2 |

Аддони: `@storybook/addon-docs`, `@storybook/addon-a11y`, `@chromatic-com/storybook`, `storybook-addon-pseudo-states`.

### Три речі, на яких легко спіткнутися

**1. Пакет псевдостанів називається `storybook-addon-pseudo-states`** — без префікса `@storybook/`. Пакета `@storybook/addon-pseudo-states` на npm **не існує**.

**2. Autodocs вмикається тегом, не опцією.** `docs: { autodocs: 'tag' }` у `main.ts` **видалено ще в Storybook 9** — тип `DocsOptions` має лише `defaultName` і `docsMode`. Актуальний спосіб — `tags: ['autodocs']` у `.storybook/preview.tsx`, він там і стоїть.

**3. `storybook add` тягне зайве.** `storybook init` притягнув vitest, playwright, `addon-vitest`, `addon-mcp` і **дописав `test.projects` у `vite.config.ts`**. Усе це відкочено. Нові аддони став через `npm install --save-dev` + рядок у `main.ts` вручну, і після цього перевіряй `git diff -- vite.config.ts src` — має бути порожньо.

### Конфіг

- `.storybook/preview.tsx` — імпортує `src/index.css` (без нього не працюють токени) + декоратор білої картки `460px` з `padding 40`, бо інакше компоненти на фоні `#f7f6fa` лежали б на такому ж `#f7f6fa`.
- `.storybook/preview-head.html` — Poppins 400/500/600.
- `addon-pseudo-states` застосований **точково по селектору** (`{ hover: 'button' }`), не глобально: у режимі «всі елементи» він переписує `:focus-visible` на `.pseudo-focus-visible-all *` і малює кільце на кожному вкладеному `span`/`svg`.

---

## 4. Chromatic

**Токен уже в секретах GitHub** — `CHROMATIC_PROJECT_TOKEN`, доданий 2026-08-28.

**Локально токена немає і бути не може** — секрети GitHub доступні лише Actions, прочитати назад їх неможливо. Тому `npx chromatic` з машини **не запуститься**.

Chromatic іде через `.github/workflows/chromatic.yml`:
- тригери: `push` у `main` + `workflow_dispatch` (можна перезапустити з UI без коміту)
- `actions/checkout@v4` з **`fetch-depth: 0`** — без повної історії Chromatic не має з чим порівнювати і кожен білд виглядав би як перший
- `chromaui/action@latest`, `buildScriptName: build-storybook`, `exitZeroOnChanges: true`

**Chromatic-лінк з'явиться тільки після пуша.** До пуша його немає.

**Снапшотів на білд: 58** (50 stories + 8 Docs). Було б 50 без autodocs. Якщо квота тиснутиме — `parameters: { chromatic: { disableSnapshot: true } }` на Docs, але тоді зникне візуальна регресія на описах.

Якщо колись знадобиться локальний запуск — покласти токен у `SWAP/.env` (він у `.gitignore`), тоді `npx chromatic` підхопить.

---

## 5. СТОП-ЛИСТ — не змінювати без явного рішення замовниці

Це рішення, узгоджені протягом роботи. Кожне зафіксоване в `SPEC.md` §16.1 як `RD-*`. Якщо щось із цього «виглядає як баг» — спершу прочитай відповідний RD.

| Що | Значення | Де |
|---|---|---|
| Напрямок курсу | `1 {SEND} ≈ x {RECEIVE}`, база = актив **відправлення** | §8.1 |
| Мінімум | **інклюзивний**, оператор `<`, **ніколи `<=`** | §6, RD-2 |
| Плейсхолдери | `≥` = **U+2265**, один символ. Не `>=`, не `&ge;` | §9.2 |
| CTA у `below-min` | `Min amount is {MIN} {ASSET}` — **без знака порівняння** | §7 |
| Баланс USDC | `92514.30` | §5.2, RD-17 |
| Accent | `#2b7bea` — контраст 4.1:1 і 3.8:1 **свідомо прийнятий**, це не дефект | §14.1, RD-3 |
| Модалка | **немає ніде.** `role="dialog"`, `aria-modal`, `createPortal`, `inert`, `backdrop`, фокус-трап — їх присутність є дефектом | RD-6 |
| Дропдаун | **жодна опція не дизейблиться**, `aria-disabled` не зустрічається | RD-4 |
| Ілюстративні значення з Figma | `92,845.34`, `82,150`, `123456789`, `$346,788.72`, `1 BTC ≈ 82,150.00 USDC` — **не хардкодити** | §11.12 |

`below-min` **недосяжний для USDC за побудовою** (мінімум = найменше представне значення при 2 знаках). Це не баг — §6.2 і RD-5. Для перевірки цього стану використовуй **BTC `0.05`** при балансі `0.0425` — кейс B2 у §5.2, він не залежить від балансу USDC.

---

## 6. Що зроблено в останню чергу

1. **Виділено три примітиви** — `IconButton` (Figma `7:9618`), `ChipButton` (`77:3399`), `DropdownItem` (`7:8551`). Доведено SSR-діффом DOM: до і після ідентичні.
2. **`IconButton`** — прибрано сторожа `:not(:hover):not(:active):not(:disabled) > svg`, колір перенесено в `.button`. Кольори в усіх 4 станах підтверджені реальним синтезованим вводом у headless Chrome — не змінились.
3. **`DropdownItem`** — доданий стан `:active` (`#e4e7ec` = `--disabled-bg`, з Figma `7:8556`). Селектор `.item:active:not(.itemDisabled)`, а **не** `:not(:disabled)`: компонент рендерить `<div role="option">`, а `div` ніколи не буває `:disabled`.
4. **Autodocs увімкнено** — 8 Docs-сторінок, таблиці пропсів, описи рішень.

---

## 7. Відкриті питання

**`.claude/agents/builder.md` — не закомічений.** До нього додані 5 Figma MCP-інструментів (`get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`, `download_assets`). Це розширення прав агента на інструменти, тому `shipper` свідомо лишив його поза комітом.

Рекомендація — закомітити: без цього агент `builder` не може виконати вимогу SPEC про експорт іконок із Figma, і їх доведеться тягнути вручну.

```bash
git add .claude/agents/builder.md && git commit -m "chore(agents): дати builder доступ до Figma MCP"
```

**Повне рев'ю на фінальному стані не проводилось.** Останній прогін на 131 критерій був **до** прогрес-кільця, зміни балансу і нового хедера. Ті правки перевірені точково (замір заливки кільця, хеші keyframes, паддінги 768/1440, клавіатурний сабміт), але не чеклістом.

**`RateRing` meta не має `component`** — stories ганяють плоскі `phase`/`fraction`/`durationMs`, а компонент бере об'єкт `progress`. Таблиця пропсів документує story-args, а не власний проп. Свідомо, щоб не ламати типізацію.

**Hover/pressed для `AmountField` і `TokenSelect`** stories не покривають — покриті лише для трьох примітивів і `Button`.

---

## 8. Пастки середовища

**Панель прев'ю тримає `document.hidden === true` постійно.** Наслідок: полінг курсу на паузі, і **прогрес-кільце коректно замерзає** майже порожнім. У прев'ю це виглядає як «анімація не працює». У звичайному браузері на `localhost:5173` усе заповнюється. Перевіряти анімацію треба у справжньому табі.

**CSS Modules скоупить `animation-name`.** Модуль **не може** посилатись на `@keyframes`, оголошені глобально в `index.css` — ім'я скоупиться і не резолвиться, анімація мовчки мертва. Через це раніше не працювали спінер кнопки і два `fade-in`. Зараз усі keyframes оголошені локально в своїх модулях; у бандлі **нуль неcкоуплених `@keyframes`**. Якщо додаєш анімацію в модуль — оголошуй keyframes там само. `:global(...)` ламає збірку.

**`prefers-reduced-motion`:** заповнення кільця — це **інформація**, воно лишається (через `!important`, який пере-озброює глобальне правило). Обертання і fade-in — декор, вони прибираються.

---

## 9. Команда агентів

`.claude/agents/` — `spec`, `builder`, `reviewer`, `storybook`, `shipper`.

Розвилка: **компонент → у пайплайні є `storybook`; застосунок/сторінка → пропускається.**
Для цього проєкту на старті відповідь була «застосунок», тому Storybook додали окремо пізніше.

`reviewer` — read-only, повертає `PASS`/`FAIL`.
`shipper` — вимагає **явного ОК від людини** перед пушем.
