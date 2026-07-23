import type { IconPack, IconProps } from "../types";

function base(props: IconProps) {
  const { size = 18, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

/** Reduced-detail, single-weight glyphs - the plainest of the four packs. */
export const minimalPack: IconPack = {
  inbox: (props) => (
    <svg {...base(props)}>
      <rect x="4" y="6" width="16" height="13" rx="1" />
      <path d="M4 11h16" />
    </svg>
  ),
  grid: (props) => (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M12 4v16M4 12h16" />
    </svg>
  ),
  pencil: (props) => (
    <svg {...base(props)}>
      <path d="M4 20 19 5l1 1L5 21H4v-1Z" />
    </svg>
  ),
  search: (props) => (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  ),
  sun: (props) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  ),
  moon: (props) => (
    <svg {...base(props)}>
      <path d="M19 15a7 7 0 1 1-8-11 6 6 0 0 0 8 11Z" />
    </svg>
  ),
  plus: (props) => (
    <svg {...base(props)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  ),
  x: (props) => (
    <svg {...base(props)}>
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  ),
  send: (props) => (
    <svg {...base(props)}>
      <path d="M4 20 20 12 4 4v6l10 2-10 2Z" />
    </svg>
  ),
  refresh: (props) => (
    <svg {...base(props)}>
      <path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5" />
      <path d="M18 5v4h-4M6 19v-4h4" />
    </svg>
  ),
  sparkles: (props) => (
    <svg {...base(props)}>
      <path d="M12 5v4M12 15v4M5 12h4M15 12h4" />
    </svg>
  ),
  grip: (props) => (
    <svg {...base(props)}>
      <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={2.4} />
    </svg>
  ),
  eyeOff: (props) => (
    <svg {...base(props)}>
      <path d="M3 3l18 18" />
      <path d="M12 5c5 0 9 4 10 7-1 2-3 4-5 5M6 6c-2 1.5-3.5 3.5-4 6 1 3 5 7 10 7 1 0 2-.2 3-.5" />
    </svg>
  ),
  eye: (props) => (
    <svg {...base(props)}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  ),
  star: (props) => (
    <svg {...base(props)}>
      <path d="M12 4l2 5 5 .5-4 3.5 1 5-4-2.7L8 18l1-5-4-3.5 5-.5Z" />
    </svg>
  ),
  paperclip: (props) => (
    <svg {...base(props)}>
      <path d="M19 11 10 20a4 4 0 0 1-5.5-5.8L13 5.6a2.7 2.7 0 0 1 4 3.7L9 17.4" />
    </svg>
  ),
  chevronDown: (props) => (
    <svg {...base(props)}>
      <path d="M7 10l5 5 5-5" />
    </svg>
  ),
  alert: (props) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.2v.1" />
    </svg>
  ),
  check: (props) => (
    <svg {...base(props)}>
      <path d="M6 12l4 4 8-8" />
    </svg>
  ),
  settings: (props) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
    </svg>
  ),
  trash: (props) => (
    <svg {...base(props)}>
      <path d="M5 7h14M8 7V5h8v2M7 7l1 13h8l1-13" />
    </svg>
  ),
};
