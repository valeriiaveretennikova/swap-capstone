# Engineering notes

Things about this codebase that are not obvious from reading it, and that cost time to rediscover.

## Stack

Vite + React 19 + TypeScript, CSS Modules. Production dependencies are **only** `react` and `react-dom` — nothing else ships in the app bundle. Node 22, matching CI.

`tsconfig.json` is a solution file with no sources of its own: it references `tsconfig.app.json` (`src`, DOM libs) and `tsconfig.node.json` (`vite.config.ts`, Node libs). That is why the build runs `tsc -b` and why a type check must name its project explicitly:

```bash
npx tsc --noEmit -p tsconfig.app.json
```

## CSS Modules scope `animation-name`

A CSS Module **cannot** reference `@keyframes` declared globally in `index.css` — the name is scoped, the reference does not resolve, and the animation is silently dead. Declare keyframes inside the same module that uses them. `:global(...)` breaks the build.

`prefers-reduced-motion`: the rate ring's fill is *information*, so it stays. Rotation and fade-in are decoration and are removed.

## Component library

`src/storybook` is the implementation of the Figma library; `src/components` is the app. Both read the same design tokens from `src/index.css`.

Library components are controlled: the variant is a `state` prop, not a pseudo-class. `state="hover"` turns on a class rather than relying on `:hover`. Two consequences worth knowing:

- A visual-regression snapshot never depends on the capture browser holding focus. `:focus` does not apply while `document.hasFocus()` is false, which is exactly how a story renders in a headless capture.
- `storybook-addon-pseudo-states` is not installed, and should not be re-added. It does not rewrite rules that come from CSS Modules, so forcing a state through it silently does nothing for this codebase.

`.storybook/main.ts` reads stories only from `src/storybook/**`.

## Focus ring

The Figma library defines the ring as `Focus/GapWidth: 2` + `Focus/RingWidth: 4` — a 2px white gap and a 2px blue band:

```css
box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #2b7bea;
```

The global `--focus-ring` token in `index.css` is wider (a 4px blue band) and does **not** match the design. The library does not use it.

## Chromatic

Runs from `.github/workflows/chromatic.yml` on push to `main`, plus `workflow_dispatch`. The project token lives in the repository secrets, so `npx chromatic` cannot run from a developer machine.

`actions/checkout` uses `fetch-depth: 0` deliberately: without full history Chromatic has no ancestor to compare against and every build looks like a first build.

## Storybook

```bash
npm run storybook        # dev server on 6006
npm run build-storybook  # static build in storybook-static/
```

`storybook init` and `storybook add` pull in more than they should — vitest, playwright and a `test.projects` block written into `vite.config.ts`. Add addons with `npm install --save-dev` plus a line in `main.ts`, then check that `git diff -- vite.config.ts src` is empty.

Autodocs is enabled by the `autodocs` tag in `.storybook/preview.tsx`. The `docs.autodocs` option in `main.ts` was removed in Storybook 9 and does not exist any more.
