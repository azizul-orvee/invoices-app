import { Font } from '@react-pdf/renderer';
import j400 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff?url';
import j500 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff?url';
import j600 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff?url';
import j700 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff?url';
import j800 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff?url';
import m400 from '@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff?url';
import m500 from '@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff?url';

let registered = false;

const abs = (u: string) => new URL(u, window.location.href).href;

export function registerFonts() {
  if (registered) return;
  registered = true;
  Font.register({
    family: 'Jakarta',
    fonts: [
      { src: abs(j400), fontWeight: 400 },
      { src: abs(j500), fontWeight: 500 },
      { src: abs(j600), fontWeight: 600 },
      { src: abs(j700), fontWeight: 700 },
      { src: abs(j800), fontWeight: 800 },
    ],
  });
  Font.register({
    family: 'Mono',
    fonts: [
      { src: abs(m400), fontWeight: 400 },
      { src: abs(m500), fontWeight: 500 },
    ],
  });
  // Keep words whole — invoices should never hyphenate names or addresses.
  Font.registerHyphenationCallback((word) => [word]);
}
