import type { Meta, StoryObj } from '@storybook/react-vite';
import { AmountField } from './AmountField';

/**
 * Figma `86:1040` — Amount Field, the `You send` card: a label row carrying the
 * balance and the `MAX` chip, a value row with the currency selector on the left
 * and the amount on the right, and the helper text under the card.
 *
 * The eight stories below are the eight Figma state nodes. Each one is a pure
 * set of props: no `parameters.pseudo`, no `play`, no decorator that paints, no
 * `userEvent`. The look comes from the `state` prop, so every snapshot is
 * deterministic by construction.
 */
const meta = {
  title: 'Components/AmountField',
  component: AmountField,
} satisfies Meta<typeof AmountField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `86:1057` — the base look: 1px `#0f143733` border, empty value, placeholder. */
export const Default: Story = {
  args: { state: 'default' },
};

/**
 * `86:1049` — the card is unchanged (`input-field/bg/hover` and
 * `input-field/border/default` hold the Default values); only the currency
 * selector takes `tc/bg/hover`, which is the same `#f7f6fa` as the card. The
 * design intends no further hover cue on this component.
 */
export const Hover: Story = {
  args: { state: 'hover' },
};

/**
 * `86:1065` — the only state with a ring. The card keeps its ordinary grey 1px
 * border and the ring is drawn outside it: a 2px white gap, then 2px of
 * `#2b7bea`, which is why the node renders 388px wide instead of 380px.
 */
export const FocusVisible: Story = {
  args: { state: 'focusVisible' },
};

/**
 * `86:1083` — no ring: the card's own border becomes 2px `#2b7bea`, and a caret
 * sits after the placeholder. Still 380px wide. The caret is drawn statically,
 * so it neither blinks nor needs real focus.
 */
export const FocusInput: Story = {
  args: { state: 'focusInput' },
};

/**
 * `86:1073` — no ring either: the same 2px `#2b7bea` card border, the chevron
 * flipped up, and the asset list open under the card at the card's full width.
 * The helper slot is not part of this node, so the field is 84px tall plus the
 * panel.
 */
export const FocusSelectOpen: Story = {
  args: { state: 'focusSelectOpen', value: '2,000.00', helperText: '' },
};

/** `86:1041` — Default with a value: `input-field/text/value` `#181818`. */
export const Filled: Story = {
  args: { state: 'filled', value: '2,000.00' },
};

/**
 * `86:1091` — empty field with the placeholder, everything muted to `#98a2b3`,
 * the card border in `#e4e7ec` and the coin glyph at 40% opacity.
 */
export const Disabled: Story = {
  args: { state: 'disabled' },
};

/**
 * `86:1099` — a 1px `#f20f0f` card border (this node is 1px, not 2px — measured
 * on the 4x export) and the helper text in the same `#f20f0f`.
 */
export const Error: Story = {
  args: { state: 'error', value: '1,000.00', helperText: 'Error text' },
};
