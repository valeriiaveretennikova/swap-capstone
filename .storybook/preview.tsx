import type { Decorator, Preview } from '@storybook/react-vite';
// The design tokens of SPEC §11 and the page/body defaults. Every component
// reads them through `var(--…)`, so nothing renders correctly without this.
import '../src/index.css';

/**
 * Content column only. Components are designed against the 380px column the
 * exchange card's 40px padding leaves inside its 460px width (SPEC §11.8a), so
 * the wrapper reproduces that measurement and nothing else: no fill, no radius,
 * no shadow. The canvas behind it is white (see `preview-head.html`), which is
 * what keeps the wrapper invisible — there is no edge for Chromatic to catch.
 */
const contentColumn: Decorator = (Story) => (
  <div
    style={{
      boxSizing: 'border-box',
      width: 'var(--card-width)',
      maxWidth: '100%',
      padding: 'var(--card-padding)',
    }}
  >
    <Story />
  </div>
);

const preview: Preview = {
  // Autodocs. Storybook 10 has no `docs.autodocs` in main.ts any more — that
  // option was dropped in Storybook 9, and `DocsOptions` here only carries
  // `defaultName` / `docsMode`. The supported switch is the `autodocs` tag, and
  // setting it project-wide gives every component meta a generated Docs page
  // (props table + the JSDoc written above each meta and each story). Any single
  // meta can still opt out with `tags: ['!autodocs']`.
  tags: ['autodocs'],
  decorators: [contentColumn],
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' — violations are reported in the a11y panel, they do not fail a run.
      test: 'todo',
    },
  },
};

export default preview;
