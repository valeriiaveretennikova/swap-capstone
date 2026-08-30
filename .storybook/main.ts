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
    // Figma defines Hover and Pressed for Button (§11.8), IconButton (§8.3),
    // DropdownItem (§8.5) and the MAX chip (§8.4). They are pure CSS
    // pseudo-classes, so without this addon they could not be pinned into a
    // static, Chromatic-snapshottable story. Stories opt in per story through
    // `parameters.pseudo`; nothing is forced globally.
    'storybook-addon-pseudo-states',
  ],
  framework: '@storybook/react-vite',
  // Autodocs is not configured here: Storybook 10 removed `docs.autodocs`.
  // It is enabled project-wide as the `autodocs` tag in preview.tsx.
};

export default config;
