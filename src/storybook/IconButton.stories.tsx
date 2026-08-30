import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

/**
 * Figma `7:9618` — Icon Button / Style=Primary. A 40x40 circular button with a
 * 20x20 `exchange` glyph.
 *
 * The visual state is passed in as the `state` prop and rendered as a class, so
 * no story depends on a real hover, a real focus or on the document owning
 * focus. Nothing here forces a pseudo-class and nothing here interacts.
 */
const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: {
    state: 'default',
    'aria-label': 'Swap direction',
  },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'pressed', 'focus', 'disabled'],
      description: 'Figma `State` axis — drives the look directly.',
    },
    'aria-label': { control: 'text', description: 'The icon-only button carries its whole name here.' },
    children: { control: false, description: '20x20 icon slot; colour follows the state.' },
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Figma `7:9619` — bg #ffffff, border 1px #cccade, icon #181818. */
export const Default: Story = {};

/** Figma `7:9621` — only the fill and the icon change: bg #f7f6fa, icon #276fd3. */
export const Hover: Story = {
  args: { state: 'hover' },
};

/** Figma `7:9623` — deeper fill and icon: bg #e4e7ec, icon #215eb3. */
export const Pressed: Story = {
  args: { state: 'pressed' },
};

/**
 * Figma `7:9625` — Default plus the `focus/ring` effect: a 2px #ffffff gap and
 * a 4px #2b7bea spread, i.e. a 2px blue band hugging the 999 radius.
 */
export const Focus: Story = {
  args: { state: 'focus' },
};

/** Figma `7:9627` — border #e4e7ec and icon #98a2b3 on the white fill. */
export const Disabled: Story = {
  args: { state: 'disabled' },
};
