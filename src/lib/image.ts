import { rgbToHex } from './color';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = src;
  });
}

const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

/**
 * Turns any uploaded image (PNG, JPG, SVG, WebP…) into a trimmed PNG data URL,
 * at most 900px on the long side, so it is crisp in the PDF but small enough to store.
 */
export async function processLogo(file: File): Promise<{ dataUrl: string; suggestedColor: string | null }> {
  const img = await loadImage(await readAsDataURL(file));
  const w0 = img.naturalWidth || 600;
  const h0 = img.naturalHeight || 300;
  const scale = Math.min(1, 900 / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Trim transparent / near-white borders so the logo sits tight in the layout.
  const isBlank = (i: number) => data[i + 3] < 12 || (data[i] > 246 && data[i + 1] > 246 && data[i + 2] > 246);
  let top = h, left = w, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isBlank((y * w + x) * 4)) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  let out = canvas;
  if (right >= left && bottom >= top && (right - left + 1 < w || bottom - top + 1 < h)) {
    const pad = 2;
    const tx = Math.max(0, left - pad), ty = Math.max(0, top - pad);
    const tw = Math.min(w - tx, right - left + 1 + pad * 2), th = Math.min(h - ty, bottom - top + 1 + pad * 2);
    out = document.createElement('canvas');
    out.width = tw;
    out.height = th;
    out.getContext('2d')!.drawImage(canvas, tx, ty, tw, th, 0, 0, tw, th);
  }

  return { dataUrl: out.toDataURL('image/png'), suggestedColor: dominantColor(data) };
}

/** Most common saturated colour in the image — a good first guess at the brand colour. */
function dominantColor(data: Uint8ClampedArray): string | null {
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 240 && min > 225) continue; // white-ish
    if (max - min < 28) continue; // grey / black
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    buckets.set(key, e);
  }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
  return best ? rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n) : null;
}
