import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };
export type IconComponent = (props: IconProps) => JSX.Element;

export const ICON_NAMES = [
  "inbox",
  "grid",
  "pencil",
  "search",
  "sun",
  "moon",
  "plus",
  "x",
  "send",
  "refresh",
  "sparkles",
  "grip",
  "eyeOff",
  "eye",
  "star",
  "paperclip",
  "chevronDown",
  "alert",
  "check",
  "settings",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export type IconPack = Record<IconName, IconComponent>;
