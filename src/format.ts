// Small formatting helpers shared by the panels.

// 0xRRGGBB number → '#rrggbb' for <input type="color"> and CSS.
export function hexToCss(n: number): string {
  return '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
}

// '#rrggbb' from an <input type="color"> → 0xRRGGBB number.
export function cssToHex(s: string): number {
  return parseInt(s.slice(1), 16);
}

// Meters with a fixed number of decimals, e.g. "1.20 m".
export function meters(v: number, digits = 2): string {
  return v.toFixed(digits) + ' m';
}
