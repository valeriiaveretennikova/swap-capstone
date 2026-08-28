interface SuccessIconProps {
  size: number;
  className?: string;
}

/**
 * SPEC §11.11 — the success mark exported from Figma `133:1500` (96x96): a ring
 * and a check as filled vector paths, so the stroke widths are the design's own
 * and no longer measured off a render (closes OQ-14). Colour comes from
 * `currentColor`, i.e. the `--success` token.
 */
export function SuccessIcon({ size, className }: SuccessIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      focusable="false"
      aria-hidden="true"
    >
      <path
        d="M84 48C84 28.1177 67.8823 12 48 12C28.1177 12 12 28.1177 12 48C12 67.8823 28.1177 84 48 84V88C25.9086 88 8 70.0914 8 48C8 25.9086 25.9086 8 48 8C70.0914 8 88 25.9086 88 48C88 70.0914 70.0914 88 48 88V84C67.8823 84 84 67.8823 84 48Z"
        fill="currentColor"
      />
      <path
        d="M64.1855 36.1859C64.9666 35.4049 66.2336 35.4049 67.0146 36.1859C67.7953 36.9669 67.7953 38.2331 67.0146 39.0141L45.4141 60.6146C44.6331 61.3953 43.3669 61.3953 42.5859 60.6146L30.5859 48.6146C29.8049 47.8336 29.8049 46.5666 30.5859 45.7855C31.3669 45.0048 32.6331 45.0048 33.4141 45.7855L44 56.3715L64.1855 36.1859Z"
        fill="currentColor"
      />
    </svg>
  );
}
