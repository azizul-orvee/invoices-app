# Decisions

Why things are the way they are. Newest first.

## 2026-11-19 — Line items printed excluding VAT, rounding favours "qty × unit = amount"
**Context:** The user types VAT-inclusive prices ("20% of whatever price I give is VAT"). The old invoice showed gross line prices next to a "Taxable" row, which reads awkwardly.
**Decision:** The PDF shows unit price and amount excluding VAT, then Subtotal (excl. VAT), VAT (20%), Total (incl. VAT). Per line: unit net is rounded first, line net = qty × unit net, VAT = line gross − line net. The total always equals exactly what was typed.
**Alternatives considered:** Rounding line net from the line gross (VAT always exactly 20% of subtotal, but qty × unit price could be a penny off — more visible to customers). Showing gross line prices (non-standard for UK VAT invoices).
**Consequences:** On some multi-quantity lines, VAT can be a penny away from 20% of the subtotal. HMRC accepts line-level rounding.

## 2026-11-19 — react-pdf + pdf.js instead of HTML-to-PDF
**Context:** Needed a one-tap "Download" producing a premium, crisp PDF on phones and desktop, plus a live preview.
**Decision:** Build the invoice with `@react-pdf/renderer` (vector text, embedded fonts, real pagination) and preview the actual generated PDF with `pdfjs-dist` on a canvas.
**Alternatives considered:** `window.print()` (no direct download, poor on phones); html2canvas/jsPDF (blurry raster text, large files); pdfmake (no border radius / weaker layout); keeping a separate HTML preview (two designs to keep in sync).
**Consequences:** ~450 KB gzipped lazy chunk for the PDF engine (preloaded on idle). react-pdf has lineHeight quirks — see the `T` wrapper in `src/pdf/InvoiceDocument.tsx`.

## 2026-11-19 — Browser localStorage, no backend
**Context:** User asked for a frontend only; one user, a few businesses.
**Decision:** Profiles, history and the current draft live in `localStorage`. Logos are stored as trimmed PNG data URLs (max 900px). Backup export/import moves data between devices.
**Alternatives considered:** A backend/database (more cost and setup for a single user); IndexedDB (more code for little gain at this size).
**Consequences:** Data is per browser. Storage quota (~5 MB) limits how many large logos can be kept; the app warns if saving fails.

## 2026-11-19 — One shared draft across profiles
**Context:** User flow is "tap ETR, fill details, download". Users may start typing on the wrong profile.
**Decision:** A single draft. Switching profile moves an unsaved draft to the new profile (renumbered, default note swapped); if the open invoice was already downloaded/saved, a fresh invoice starts instead.
**Consequences:** Saved invoices are never silently re-assigned to another business.
