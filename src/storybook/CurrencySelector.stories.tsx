import type { Meta, StoryObj } from '@storybook/react-vite';
import { CurrencySelector } from './CurrencySelector';

/**
 * Figma `86:612` CurrencySelector — the asset trigger on its own, 106x32,
 * radius 12 (Figma input-field/radius). One story per Figma state.
 *
 * Every state is a prop, so each story is a plain set of args: no
 * `parameters.pseudo`, no `play`, no decorators, no `userEvent`. Nothing here
 * depends on the pointer, on the document owning focus, or on what the
 * previous story left behind, which makes each snapshot deterministic by
 * construction.
 *
 * The stories sit on the white canvas because that is the surface `86:612` is
 * drawn on. Three of the fills (hover, focus, expanded) are #f7f6fa, so on the
 * app's own #f7f6fa card they would be invisible by design.
 */
const meta = {
  title: 'Components/CurrencySelector',
  component: CurrencySelector,
  args: { state: 'default' },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'pressed', 'focus', 'expanded', 'disabled'],
      description: 'The `State` variant of Figma `86:612`. Painted by class, never by pseudo-class.',
    },
  },
} satisfies Meta<typeof CurrencySelector>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Figma `86:613` — no fill at all: white logo plate, #181818 ticker, caret down. */
export const Default: Story = {};

/** Figma `86:621` — adds the tc/bg/hover #f7f6fa pill. Nothing else changes. */
export const Hover: Story = { args: { state: 'hover' } };

/** Figma `86:629` — the darker tc/bg/pressed #e4e7ec pill. */
export const Pressed: Story = { args: { state: 'pressed' } };

/**
 * Figma `86:645` — tc/bg/focus #f7f6fa plus the `focus/ring` effect: a 2px
 * #ffffff gap and a 2px #2b7bea band, 4px of ring in total, so the frame
 * measures 114x40 around the 106x32 pill.
 */
export const Focus: Story = { args: { state: 'focus' } };

/**
 * Figma `86:653` — the caret flips up and the pill takes tc/bg/default #f7f6fa.
 * The variant is the trigger alone; the option list is not part of `86:612`.
 */
export const Expanded: Story = { args: { state: 'expanded' } };

/**
 * Figma `86:637` — tc/bg/disabled #f7f6fa, ticker and caret in #98a2b3
 * (tc/text/name/disabled, tc/icon/chevron/disabled), and the coin art faded to
 * 0.4 over its still-white plate. The button also carries the real `disabled`
 * attribute, so it is out of the tab order.
 */
export const Disabled: Story = { args: { state: 'disabled' } };
