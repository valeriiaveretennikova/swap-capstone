/**
 * Glyphs exported verbatim from the Figma library. Paths are the untouched
 * Figma output; only the hard-coded `fill` is swapped for `currentColor` so the
 * state classes in the `.module.css` files keep driving the colour.
 *
 * The exports come cropped to the vector bounding box, so each path is wrapped
 * in a `translate` that puts it back where Figma places it inside the icon box.
 */

interface GlyphProps {
  className?: string;
}

/**
 * Figma `exchange` `35:3589` inside Icon Button `7:9619` — filled, 20x20 box,
 * vector `I35:3589;35:3584` at x=2.6666260 y=2.9166667, 14.666665 x 14.166677.
 * Figma fills it `#181818` / `#276fd3` / `#215eb3` / `#98a2b3` per state; the
 * geometry is byte-identical across all five, so only the colour is a variable.
 */
export function ExchangeGlyph({ className }: GlyphProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      focusable="false"
      aria-hidden
      className={className}
    >
      <g transform="translate(2.6666259765625 2.9166667461395264)" fill="currentColor">
        <path d="M14.4836 4.06694C14.2395 4.31102 13.8438 4.31102 13.5997 4.06694L11.75 2.21721V13.125C11.75 13.4702 11.4702 13.75 11.125 13.75C10.7798 13.75 10.5 13.4702 10.5 13.125V2.05055L8.48361 4.06694C8.23953 4.31102 7.8438 4.31102 7.59972 4.06694C7.35565 3.82286 7.35565 3.42714 7.59972 3.18306L10.5997 0.183058C10.8438 -0.0610194 11.2395 -0.0610194 11.4836 0.183058L14.4836 3.18306C14.7277 3.42714 14.7277 3.82286 14.4836 4.06694Z" />
        <path d="M4.24999 1.45833C4.24999 1.11315 3.97017 0.833327 3.62499 0.833327C3.27982 0.833327 2.99999 1.11315 2.99999 1.45833L2.99999 12.0328L1.06694 10.0997C0.822865 9.85566 0.427136 9.85566 0.183058 10.0997C-0.0610192 10.3438 -0.0610193 10.7395 0.183058 10.9836L3.18306 13.9836C3.42714 14.2277 3.82286 14.2277 4.06694 13.9836L7.06694 10.9836C7.31102 10.7395 7.31102 10.3438 7.06694 10.0997C6.82286 9.85566 6.42714 9.85566 6.18306 10.0997L4.24999 12.0328L4.24999 1.45833Z" />
      </g>
    </svg>
  );
}

/**
 * Figma `24/check` — `133:767` in Dropdown Item Selected `133:777` and
 * `133:1069` in Disabled `7:8564`. Filled, 24x24 box, vector at x=3.7499955
 * y=5.2499948, 17.000010 x 12.500006. Figma fills it `#2b7bea` in Selected and
 * `#98a2b3` in Disabled with the exact same path, hence `currentColor`.
 */
export function CheckGlyph({ className }: GlyphProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      focusable="false"
      aria-hidden
      className={className}
    >
      <path
        transform="translate(3.749995470046997 5.24999475479126)"
        d="M16.7545 0.19505C17.061 0.47368 17.0836 0.948017 16.805 1.25451L6.80496 12.2545C6.66318 12.4105 6.46232 12.4996 6.25155 12.5C6.04079 12.5004 5.83956 12.4122 5.69714 12.2568L0.197139 6.2568C-0.0827555 5.95146 -0.0621283 5.47703 0.243211 5.19714C0.54855 4.91725 1.02298 4.93787 1.30287 5.24321L6.24771 10.6376L15.695 0.245501C15.9737 -0.0609925 16.448 -0.08358 16.7545 0.19505Z"
        fill="currentColor"
      />
    </svg>
  );
}
