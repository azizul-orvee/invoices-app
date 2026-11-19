export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [17, 19, 24];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** Mix `hex` into white (or another colour) by `amount` (0 → base, 1 → hex). */
export function mix(hex: string, amount: number, base = '#ffffff') {
  const a = hexToRgb(hex);
  const b = hexToRgb(base);
  return rgbToHex(b[0] + (a[0] - b[0]) * amount, b[1] + (a[1] - b[1]) * amount, b[2] + (a[2] - b[2]) * amount);
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable text colour to place on top of `hex`. */
export const onColor = (hex: string) => (luminance(hex) > 0.45 ? '#111318' : '#FFFFFF');

/** Brand colours that are too light to read as text get darkened for text use. */
export function readableOnWhite(hex: string) {
  let c = hex;
  for (let i = 0; i < 6 && luminance(c) > 0.32; i++) c = mix(c, 0.8, '#000000');
  return c;
}

export function isHex(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
}
