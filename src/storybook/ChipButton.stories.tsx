import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChipButton } from './ChipButton';

/**
 * Figma `77:3399` — Chip Button, the `MAX` pill. The variant hugs its label at
 * 28x16 with no padding and no fill.
 *
 * The visual state is passed in as the `state` prop and rendered as a class, so
 * no story depends on a real hover, a real focus or on the document owning
 * focus. Nothing here forces a pseudo-class and nothing here interacts.
 */
const meta = {
  title: 'Components/ChipButton',
  component: ChipButton,
  args: {
    state: 'default',
    children: 'MAX',
  },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'pressed', 'focus', 'disabled'],
      description: 'Figma `State` axis — drives the look directly.',
    },
    children: { control: 'text', description: 'Chip label.' },
  },
} satisfies Meta<typeof ChipButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Figma `79:552` — transparent, label #2b7bea. */
export const Default: Story = {};

/** Figma `79:554` — only the label colour changes: #276fd3. */
export const Hover: Story = {
  args: { state: 'hover' },
};

/** Figma `79:556` — label #215eb3. */
export const Pressed: Story = {
  args: { state: 'pressed' },
};

/**
 * Figma `79:558` — the one state with a fill: #f7f6fa plus the `focus/ring`
 * effect (2px #ffffff gap, 4px #2b7bea spread). The ring takes the rendered
 * node from 28x16 to 36x24, so it reads as a horizontal pill around the label.
 */
export const Focus: Story = {
  args: { state: 'focus' },
};

/** Figma `79:560` — label #98a2b3. */
export const Disabled: Story = {
  args: { state: 'disabled' },
};
