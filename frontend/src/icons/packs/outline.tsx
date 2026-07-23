import type { IconPack, IconProps } from "../types";

function base(props: IconProps) {
  const { size = 18, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const outlinePack: IconPack = {
  inbox: (props) => (
    <svg {...base(props)}>
      <path d="M4 12h4l1.5 3h5L16 12h4" />
      <path d="M5.5 5h13L21 12v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6L5.5 5Z" />
    </svg>
  ),
  grid: (props) => (
    <svg {...base(props)}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  ),
  pencil: (props) => (
    <svg {...base(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  search: (props) => (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  sun: (props) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  ),
  moon: (props) => (
    <svg {...base(props)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  ),
  plus: (props) => (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  x: (props) => (
    <svg {...base(props)}>
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  ),
  send: (props) => (
    <svg {...base(props)}>
      <path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" />
    </svg>
  ),
  refresh: (props) => (
    <svg {...base(props)}>
      <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6M4 13a8 8 0 0 0 13.7 4.7L20 15.4" />
      <path d="M4 4v4.6h4.6M20 20v-4.6h-4.6" />
    </svg>
  ),
  sparkles: (props) => (
    <svg {...base(props)}>
      <path d="M12 3v3M12 18v3M4.2 12H1M23 12h-3.2M6.5 6.5 4.3 4.3M19.7 19.7l-2.2-2.2M6.5 17.5l-2.2 2.2M19.7 4.3l-2.2 2.2" />
      <path d="M12 8.5 13.2 11l2.5 1.2-2.5 1.2L12 15.9l-1.2-2.5L8.3 12.2l2.5-1.2Z" />
    </svg>
  ),
  grip: (props) => (
    <svg {...base(props)}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  ),
  eyeOff: (props) => (
    <svg {...base(props)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.4 10.4 0 0 1 12 5c5 0 9 4.5 10 7-0.4 1-1.4 2.6-2.9 4M6.7 6.7C4.6 8 3.2 9.9 2 12c1 2.5 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ),
  eye: (props) => (
    <svg {...base(props)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  star: (props) => (
    <svg {...base(props)}>
      <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6Z" />
    </svg>
  ),
  paperclip: (props) => (
    <svg {...base(props)}>
      <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3l7-7" />
    </svg>
  ),
  chevronDown: (props) => (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  alert: (props) => (
    <svg {...base(props)}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a1.6 1.6 0 0 0 1.4 2.4h17.6a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" />
    </svg>
  ),
  check: (props) => (
    <svg {...base(props)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  ),
  settings: (props) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.6 7.6 0 0 0 .1-2l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L15 3h-4l-.4 2.5a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L6.5 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1L11 21h4l.4-2.5a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.6Z" />
    </svg>
  ),
  trash: (props) => (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
      <path d="M6 7l1 12.5a2 2 0 0 0 2 1.5h6a2 2 0 0 0 2-1.5L18 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
};
