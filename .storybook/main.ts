import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Storybook renders ONLY the presentational components in `src/storybook`,
  // built one-to-one from the Figma library. The shipped app in
  // `src/components` is frozen and deliberately out of scope here.
  stories: ['../src/storybook/**/*.stories.@(ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    // SPEC §14 is a whole accessibility section — the axe panel keeps it honest.
    '@storybook/addon-a11y',
    // No pseudo-state addon: every component here paints its Figma states from
    // the `state` prop, so a story never has to pin `:hover` / `:focus-visible`
    // and a snapshot never depends on the capture browser holding focus.
  ],
  framework: '@storybook/react-vite',
  // Autodocs is not configured here: Storybook 10 removed `docs.autodocs`.
  // It is enabled project-wide as the `autodocs` tag in preview.tsx.
};

export default config;
