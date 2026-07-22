import type { IconPack, IconProps } from "../types";

function base(props: IconProps) {
  const { size = 18, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none",
    ...rest,
  };
}

export const solidPack: IconPack = {
  inbox: (props) => (
    <svg {...base(props)}>
      <path d="M5.5 5h13L21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6L5.5 5Zm-.7 8 1 2h8.4l1-2H21v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z" />
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
      <path d="M3 21v-3.5L16 4.5a1.7 1.7 0 0 1 2.5 0l1 1a1.7 1.7 0 0 1 0 2.5L6.5 21H3Z" />
    </svg>
  ),
  search: (props) => (
    <svg {...base(props)}>
      <path d="M11 3a8 8 0 1 0 4.9 14.3l4.9 4.9 1.4-1.4-4.9-4.9A8 8 0 0 0 11 3Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
    </svg>
  ),
  sun: (props) => (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="5" />
      <path
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        d="M12 1.5v2.5M12 20v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M1.5 12h2.5M20 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8"
      />
    </svg>
  ),
  moon: (props) => (
    <svg {...base(props)}>
      <path d="M21 14.5A9 9 0 1 1 9.5 3a7.5 7.5 0 0 0 11.5 11.5Z" />
    </svg>
  ),
  plus: (props) => (
    <svg {...base(props)}>
      <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9Z" />
    </svg>
  ),
  x: (props) => (
    <svg {...base(props)}>
      <path d="M6.4 4.9 12 10.6l5.6-5.7 1.4 1.4-5.7 5.7 5.7 5.6-1.4 1.4-5.6-5.7-5.6 5.7-1.4-1.4 5.7-5.6-5.7-5.7Z" />
    </svg>
  ),
  send: (props) => (
    <svg {...base(props)}>
      <path d="M2.5 3.5 21.5 12l-19 8.5 2-8-2-8Z" />
    </svg>
  ),
  refresh: (props) => (
    <svg {...base(props)}>
      <path d="M12 3a9 9 0 0 1 8.9 7.7l1.6-1.6.9 3.7-3.8.9L18 12h1.9A7.9 7.9 0 0 0 12 5a8 8 0 0 0-7 4.2L3.3 8A9 9 0 0 1 12 3Zm-8.9 8.6 3.8-.9L8.5 12H6.6a8 8 0 0 0 13 4.8l1.6 1.6A9 9 0 0 1 6 12.3l-1.6 1.6-.9-3.7Z" />
    </svg>
  ),
  sparkles: (props) => (
    <svg {...base(props)}>
      <path d="M12 2 14 9l7 2-7 2-2 7-2-7-7-2 7-2Z" />
      <path d="M19 15.5 20 18l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </svg>
  ),
  grip: (props) => (
    <svg {...base(props)}>
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  ),
  eyeOff: (props) => (
    <svg {...base(props)}>
      <path d="M2.4 3.5 3.8 2 22 20.3l-1.4 1.4-3.3-3.3A11.6 11.6 0 0 1 12 20c-6.5 0-10-7-10-8a13.6 13.6 0 0 1 4.6-5.3ZM12 7a5 5 0 0 1 5 5 5 5 0 0 1-.3 1.7l-1.6-1.6a3 3 0 0 0-3.2-3.2L10.3 7.3A5 5 0 0 1 12 7Z" />
    </svg>
  ),
  eye: (props) => (
    <svg {...base(props)}>
      <path d="M12 5c6.5 0 10 7 10 7s-3.5 7-10 7S2 12 2 12s3.5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    </svg>
  ),
  star: (props) => (
    <svg {...base(props)}>
      <path d="m12 2 3.1 6.6L22 9.6l-5 4.9 1.2 6.9L12 18l-6.2 3.4L7 14.5 2 9.6l6.9-1Z" />
    </svg>
  ),
  paperclip: (props) => (
    <svg {...base(props)}>
      <path d="M17.5 2.5a4.5 4.5 0 0 1 3.2 7.7L11 20a5.5 5.5 0 0 1-7.8-7.8l8.6-8.5 1.4 1.4-8.6 8.5a3.5 3.5 0 0 0 5 5l9.7-9.8a2.5 2.5 0 0 0-3.5-3.5l-8.6 8.6-1.4-1.4 8.6-8.6a4.5 4.5 0 0 1 3.1-1.4Z" />
    </svg>
  ),
  chevronDown: (props) => (
    <svg {...base(props)}>
      <path d="M4.5 8.5 12 16l7.5-7.5L21 10l-9 9-9-9Z" />
    </svg>
  ),
  alert: (props) => (
    <svg {...base(props)}>
      <path d="M13.7 3.9 22.2 18a1.6 1.6 0 0 1-1.4 2.4H3.2A1.6 1.6 0 0 1 1.8 18L10.3 3.9a1.6 1.6 0 0 1 2.8 0ZM12 9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0v-4a1 1 0 0 0-1-1Zm0 7.5a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
    </svg>
  ),
  check: (props) => (
    <svg {...base(props)}>
      <path d="M20.3 5.7 9 17 3.7 11.7l1.4-1.4L9 14.2l9.9-9.9Z" />
    </svg>
  ),
  settings: (props) => (
    <svg {...base(props)}>
      <path d="M9.3 2h5.4l.7 3.1a7.7 7.7 0 0 1 1.6.9l3-1 2.7 4.6-2.4 2a7.6 7.6 0 0 1 0 1.8l2.4 2-2.7 4.7-3-1a7.7 7.7 0 0 1-1.6.9L14.7 22H9.3l-.7-3a7.7 7.7 0 0 1-1.6-1l-3 1-2.7-4.6 2.4-2a7.6 7.6 0 0 1 0-1.9l-2.4-2L3.9 4l3 1a7.7 7.7 0 0 1 1.7-.9L9.3 2ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    </svg>
  ),
};
