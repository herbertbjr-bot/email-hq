import type { IconPack, IconProps } from "../types";

function base(props: IconProps) {
  const { size = 18, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
    ...rest,
  };
}

/** Bold, blocky, high-contrast strokes for a chunky "8-bit" feel. */
export const retroPack: IconPack = {
  inbox: (props) => (
    <svg {...base(props)}>
      <rect x="3.5" y="6.5" width="17" height="12" />
      <path d="M3.5 12h5l1.5 2.5h4L15.5 12h5" />
    </svg>
  ),
  grid: (props) => (
    <svg {...base(props)}>
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
    </svg>
  ),
  pencil: (props) => (
    <svg {...base(props)}>
      <path d="M4 20h4l12-12-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </svg>
  ),
  search: (props) => (
    <svg {...base(props)}>
      <rect x="4" y="4" width="10" height="10" />
      <path d="M14 14l6 6" />
    </svg>
  ),
  sun: (props) => (
    <svg {...base(props)}>
      <rect x="8" y="8" width="8" height="8" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2" />
    </svg>
  ),
  moon: (props) => (
    <svg {...base(props)}>
      <path d="M19 4a8 8 0 1 0 1 12 9 9 0 0 1-1-12Z" />
    </svg>
  ),
  plus: (props) => (
    <svg {...base(props)}>
      <path d="M12 4v16M4 12h16" />
    </svg>
  ),
  x: (props) => (
    <svg {...base(props)}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  ),
  send: (props) => (
    <svg {...base(props)}>
      <path d="M3 12 21 4 13 21l-2-8-8-1Z" />
    </svg>
  ),
  refresh: (props) => (
    <svg {...base(props)}>
      <path d="M4 5v6h6M20 19v-6h-6" />
      <path d="M5.5 11a7 7 0 0 1 12-4.5M18.5 13a7 7 0 0 1-12 4.5" />
    </svg>
  ),
  sparkles: (props) => (
    <svg {...base(props)}>
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
    </svg>
  ),
  grip: (props) => (
    <svg {...base(props)}>
      <rect x="7" y="5" width="3" height="3" />
      <rect x="14" y="5" width="3" height="3" />
      <rect x="7" y="10.5" width="3" height="3" />
      <rect x="14" y="10.5" width="3" height="3" />
      <rect x="7" y="16" width="3" height="3" />
      <rect x="14" y="16" width="3" height="3" />
    </svg>
  ),
  eyeOff: (props) => (
    <svg {...base(props)}>
      <path d="M2 2l20 20" />
      <path d="M4 12s3-6 8-6c2 0 3.5.6 4.7 1.4M20 12s-1 2-3 3.6M8 8.3C5.7 9.7 4 12 4 12s3.5 6 8 6c1 0 2-.2 2.9-.6" />
      <rect x="10.5" y="10.5" width="3" height="3" />
    </svg>
  ),
  eye: (props) => (
    <svg {...base(props)}>
      <path d="M2 12s3-6 10-6 10 6 10 6-3 6-10 6-10-6-10-6Z" />
      <rect x="10" y="10" width="4" height="4" />
    </svg>
  ),
  star: (props) => (
    <svg {...base(props)}>
      <path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17l-5.5 4L8 14.5 3 10l6.5-.5Z" />
    </svg>
  ),
  paperclip: (props) => (
    <svg {...base(props)}>
      <path d="M19 10 10.5 18.5a4 4 0 1 1-5.7-5.7L13 4.6a2.7 2.7 0 1 1 3.8 3.8L8.5 16.6" />
    </svg>
  ),
  chevronDown: (props) => (
    <svg {...base(props)}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  ),
  alert: (props) => (
    <svg {...base(props)}>
      <path d="M12 3 21.5 20H2.5L12 3Z" />
      <path d="M12 10v4" />
      <rect x="11" y="16.5" width="2" height="2" />
    </svg>
  ),
  check: (props) => (
    <svg {...base(props)}>
      <path d="M4 13l5 5L20 6" />
    </svg>
  ),
  settings: (props) => (
    <svg {...base(props)}>
      <rect x="9" y="9" width="6" height="6" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19" />
    </svg>
  ),
  trash: (props) => (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <rect x="9" y="3.5" width="6" height="3.5" />
      <path d="M6 7l1.2 13h9.6L18 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
};
