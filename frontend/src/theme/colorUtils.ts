/** Small hex-color helpers used to derive hover/soft accent shades from a single user-picked color. */

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Mixes a hex color toward black (amount < 0) or white (amount > 0), amount in [-1, 1]. */
export function mix(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mixed = rgb.map((c) => c + (target - c) * t) as [number, number, number];
  return toHex(mixed);
}

export function isValidHex(hex: string): boolean {
  return parseHex(hex) !== null;
}

export function darken(hex: string, amount = 0.15): string {
  return mix(hex, -amount);
}

export function lighten(hex: string, amount = 0.15): string {
  return mix(hex, amount);
}

/** A very light tint of the color, suitable for "soft" background chips. */
export function softTint(hex: string): string {
  return mix(hex, 0.88);
}
