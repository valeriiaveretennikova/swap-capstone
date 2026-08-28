interface IconProps {
  className?: string;
}

const BASE_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  focusable: 'false',
  'aria-hidden': true,
} as const;

export function WalletIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className}>
      <path
        d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 18H5.5A2.5 2.5 0 0 1 3 15.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3 10h4.5a2 2 0 0 1 0 4H3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function SwapIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className}>
      <path
        d="M8 4v16m0 0-3.5-3.5M8 20l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 20V4m0 0-3.5 3.5M16 4l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ChevronIconProps extends IconProps {
  direction: 'down' | 'up';
}

export function ChevronIcon({ className, direction }: ChevronIconProps) {
  return (
    <svg {...BASE_PROPS} className={className}>
      <path
        d={direction === 'down' ? 'M7 10l5 5 5-5' : 'M7 14l5-5 5 5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className}>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className}>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M15.5 6.5A2.5 2.5 0 0 0 13 4H7a3 3 0 0 0-3 3v6a2.5 2.5 0 0 0 2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ImportantIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.1" fill="currentColor" />
    </svg>
  );
}
