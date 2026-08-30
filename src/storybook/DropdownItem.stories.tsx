import type { Meta, StoryObj } from '@storybook/react-vite';
import { BtcIcon } from '../components/coins/BtcIcon';
import { DropdownItem } from './DropdownItem';

/** Figma `dd-item/icon-size: 24`. */
const ICON_SIZE = 24;

/**
 * Figma `7:8551` — Dropdown Item, `180 × 40`: 24px coin glyph, ticker in
 * Poppins Medium 15/22 `#181818`, full name in Poppins Regular 14/20 `#6b688c`,
 * and a 24px check on the right of the selected row. Padding 8, gap 8, radius 8.
 *
 * The six states are driven by the `state` prop and painted by the component's
 * own classes, not by pseudo-classes. No `parameters.pseudo`, no `play`, no
 * `userEvent`, no state-painting decorators: each story is a fixed set of props,
 * so its Chromatic snapshot is deterministic by construction.
 *
 * The only decorator is structural — `role="option"` is invalid ARIA outside a
 * listbox and the a11y panel would (rightly) flag it. The wrapper carries the
 * role and nothing else: no fill, border, radius or shadow.
 */
const meta = {
  title: 'Components/DropdownItem',
  component: DropdownItem,
  args: {
    icon: <BtcIcon size={ICON_SIZE} />,
    ticker: 'BTC',
    name: 'Bitcoin',
    state: 'default',
  },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'pressed', 'focus', 'selected', 'disabled'],
      description: 'Figma `State` variant axis.',
    },
    ticker: { control: 'text' },
    name: { control: 'text' },
    icon: { control: false },
  },
  decorators: [
    (Story) => (
      <div role="listbox" aria-label="Asset">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DropdownItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Figma `7:8552` State=Default — transparent background, no check. The baseline. */
export const Default: Story = {};

/** Figma `7:8560` State=Hover — the only change is `dd-item/bg/hover` #f7f6fa. */
export const Hover: Story = {
  args: { state: 'hover' },
};

/** Figma `7:8556` State=Pressed — background deepens to `dd-item/bg/pressed` #e4e7ec. */
export const Pressed: Story = {
  args: { state: 'pressed' },
};

/**
 * Figma `24:281` State=Focus — background `dd-item/bg/focus` #ffffff (white, not
 * the hover grey) plus the `focus/ring` effect: a 2px white gap (`Focus/GapWidth`)
 * and a 2px blue band out to 4px (`Focus/RingWidth`, `border/focus` #2b7bea).
 */
export const Focus: Story = {
  args: { state: 'focus' },
};

/**
 * Figma `133:777` State=Selected — background stays transparent; the check
 * `133:767` appears on the right in `icon/brand` #2b7bea. `aria-selected="true"`.
 */
export const Selected: Story = {
  args: { state: 'selected' },
};

/**
 * Figma `7:8564` State=Disabled — ticker and name drop to `#98a2b3`, the coin
 * glyph is exported at `opacity: 0.4`, and the row keeps its check, recoloured
 * to `icon/disabled` #98a2b3. Background stays transparent.
 */
export const Disabled: Story = {
  args: { state: 'disabled' },
};
