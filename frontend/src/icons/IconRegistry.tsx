import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { minimalPack } from "./packs/minimal";
import { outlinePack } from "./packs/outline";
import { retroPack } from "./packs/retro";
import { solidPack } from "./packs/solid";
import type { IconName, IconPack, IconProps } from "./types";

export type IconPackId = "outline" | "solid" | "minimal" | "retro";

export const ICON_PACKS: Record<IconPackId, IconPack> = {
  outline: outlinePack,
  solid: solidPack,
  minimal: minimalPack,
  retro: retroPack,
};

export const ICON_PACK_META: { id: IconPackId; name: string; description: string }[] = [
  { id: "outline", name: "Outline", description: "Balanced stroke icons - the default look" },
  { id: "solid", name: "Solid", description: "Filled glyphs for a bolder, higher-contrast feel" },
  { id: "minimal", name: "Minimal", description: "Thin, reduced-detail icons for a quiet UI" },
  { id: "retro", name: "Retro", description: "Chunky, blocky strokes with an 8-bit feel" },
];

const DEFAULT_ICON_PACK: IconPackId = "outline";
const STORAGE_KEY = "emailhq.icon-pack.v1";

function loadIconPack(): IconPackId {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && stored in ICON_PACKS ? (stored as IconPackId) : DEFAULT_ICON_PACK;
}

interface IconPackContextValue {
  pack: IconPackId;
  setPack: (pack: IconPackId) => void;
}

const IconPackContext = createContext<IconPackContextValue | undefined>(undefined);

export function IconPackProvider({ children }: { children: ReactNode }) {
  const [pack, setPackState] = useState<IconPackId>(() => loadIconPack());

  const setPack = useCallback((next: IconPackId) => {
    setPackState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ pack, setPack }), [pack, setPack]);

  return <IconPackContext.Provider value={value}>{children}</IconPackContext.Provider>;
}

export function useIconPack(): IconPackContextValue {
  const ctx = useContext(IconPackContext);
  if (!ctx) throw new Error("useIconPack must be used within an IconPackProvider");
  return ctx;
}

/**
 * Central icon abstraction - every component renders `<Icon name="..." />`
 * instead of importing a concrete SVG, so switching icon packs (Outline,
 * Solid, Minimal, Retro) in the Settings panel updates the whole app at
 * once. See icons/packs/ for the pack implementations and icons/types.ts
 * for the shared IconName union.
 */
export function Icon({ name, ...rest }: IconProps & { name: IconName }) {
  const { pack } = useIconPack();
  const Component = ICON_PACKS[pack][name];
  return <Component {...rest} />;
}
