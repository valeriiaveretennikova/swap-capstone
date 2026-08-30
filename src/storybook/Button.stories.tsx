import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

/**
 * Button — Figma `7:4069`, size lg: 48px tall, 24px side padding, 8px radius,
 * Poppins Medium 16/24, full width of the 380px content column.
 *
 * One story per cell of the Figma variant matrix: Style (Primary | Secondary)
 * x State (Default, Hover, Pressed, Focus, Disabled, Loading) = 12.
 *
 * Every state is a class the `state` prop turns on, never a pseudo-class. No
 * story needs a pinned `:hover`, a real focus, or an interaction to look the
 * way it does, so each snapshot is deterministic by construction.
 *
 * The label is Figma's own placeholder text, `Button`, so each story is a
 * one-to-one reading of its node.
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    variant: 'primary',
    state: 'default',
    children: 'Button',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary'],
      description: 'Figma `Style` — Primary (#2b7bea fill) or Secondary (1px #cccade stroke).',
    },
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'pressed', 'focus', 'disabled', 'loading'],
      description: 'Figma `State`. Applied as a class, so it renders without any interaction.',
    },
    children: { control: 'text', description: 'Label.' },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Figma `7:4230` — the baseline: fill `#2b7bea`, label `#ffffff`. */
export const PrimaryDefault: Story = {};

/** Figma `7:4234` — fill darkens to `#276fd3`. Label and geometry unchanged. */
export const PrimaryHover: Story = {
  args: { state: 'hover' },
};

/** Figma `7:4238` — fill darkens further to `#215eb3`. */
export const PrimaryPressed: Story = {
  args: { state: 'pressed' },
};

/**
 * Figma `7:4242` — the default fill plus the `focus/ring` effect: a 2px
 * `#ffffff` gap, then a 2px `#2b7bea` band (`Focus/GapWidth: 2` over
 * `Focus/RingWidth: 4`).
 */
export const PrimaryFocus: Story = {
  args: { state: 'focus' },
};

/** Figma `7:4246` — fill `#e4e7ec`, label `#98a2b3`, out of the tab order. */
export const PrimaryDisabled: Story = {
  args: { state: 'disabled' },
};

/**
 * Figma `7:4334` — the fill stays the default `#2b7bea`; the label is replaced
 * by a centred 24px white arc. The text is kept for screen readers only and the
 * button is `disabled` + `aria-busy`.
 */
export const PrimaryLoading: Story = {
  args: { state: 'loading' },
};

/** Figma `111:1291` — white fill, 1px `#cccade` stroke, label `#6b688c`. */
export const SecondaryDefault: Story = {
  args: { variant: 'secondary' },
};

/** Figma `111:1293` — stroke darkens to `#b8b6d2`; fill and label unchanged. */
export const SecondaryHover: Story = {
  args: { variant: 'secondary', state: 'hover' },
};

/** Figma `111:1295` — stroke `#9996be` and the label darkens to `#565475`. */
export const SecondaryPressed: Story = {
  args: { variant: 'secondary', state: 'pressed' },
};

/** Figma `111:1297` — Default colours plus the same 2px gap / 2px band ring. */
export const SecondaryFocus: Story = {
  args: { variant: 'secondary', state: 'focus' },
};

/** Figma `111:1299` — the stroke flattens to `#e4e7ec` and the label to `#98a2b3`. */
export const SecondaryDisabled: Story = {
  args: { variant: 'secondary', state: 'disabled' },
};

/**
 * Figma `111:1301` — Default stroke and a centred 24px `#6b688c` arc in place of
 * the label. The arc inherits the label colour, so only the stroke differs from
 * the primary spinner.
 */
export const SecondaryLoading: Story = {
  args: { variant: 'secondary', state: 'loading' },
};
