# Architecture

Single-page, client-only React app. No routes, no server. Everything persists in `localStorage`.

## Folder map
```
index.html                 ← app shell, mobile meta tags
public/
├── 404.html               ← self-contained "this link doesn't open an invoice" page; static hosts serve it for unknown paths
├── favicon.svg
└── logos/creations-mobile-tyres.png   ← seeded logo (extracted from the old invoice PDF)
src/
├── main.tsx               ← React root
├── App.tsx                ← state owner: profiles, history, current invoice, sheets, PDF render loop, download/share
├── index.css              ← Tailwind import, fonts, design tokens, brand CSS vars (@property for colour transitions)
├── types.ts               ← Profile, Invoice, LineItem, Customer, payment types
├── seed.ts                ← first-run Creations Mobile Tyres profile + blankProfile()
├── lib/
│   ├── money.ts           ← VAT_RATE, calcTotals (integer pence), formatMoney
│   ├── invoice.ts         ← newInvoice, nextInvoiceNumber, newItem, fileNameFor, METHOD_LABEL
│   ├── storage.ts         ← localStorage read/write, uid, backup export/parse
│   ├── dates.ts           ← ISO date helpers, en-GB formatting
│   ├── color.ts           ← hex/mix/luminance helpers, onColor, readableOnWhite
│   └── image.ts           ← logo upload → trimmed PNG data URL + dominant colour guess
├── pdf/
│   ├── InvoiceDocument.tsx← THE invoice design (react-pdf components)
│   ├── fonts.ts           ← registers Jakarta + Mono fonts (Vite ?url imports)
│   └── generate.ts        ← renderInvoicePdf(profile, invoice) → Blob; measures logo size
└── components/
    ├── ui.tsx             ← Field, Section, Button, Segmented, Sheet (bottom sheet / side drawer), Monogram, cx
    ├── NumberInput.tsx    ← decimal text input that doesn't fight typing
    ├── InvoiceForm.tsx    ← invoice header strip, Customer, Work & price (line items), Payment sections
    ├── ProfileSwitcher.tsx← horizontal chips to pick the business
    ├── ProfilesSheet.tsx  ← profile list, profile editor, backup export/import
    ├── HistorySheet.tsx   ← saved invoices: search, filter, re-download (Share on phones), open, duplicate, delete
    └── PdfPreview.tsx     ← lazy-loads pdf.js, draws each PDF page to a canvas
```

## Screens
| Surface | File | Purpose |
|---|---|---|
| Main page | `src/App.tsx` + `InvoiceForm.tsx` | Pick profile, fill invoice; desktop shows sticky live preview on the right |
| Phone action bar | `src/App.tsx` | Fixed bottom: total, Preview, **Share** (PDF download on phones that can't share files) |
| Preview sheet (phone) | `src/App.tsx` | Full PDF preview + Download (secondary) / Share (primary) |
| Not-found page | `public/404.html` | Static page for unknown addresses, e.g. a copied `blob:` link |
| Profiles sheet | `ProfilesSheet.tsx` | Create/edit/duplicate/delete business profiles; backup |
| History sheet | `HistorySheet.tsx` | Every downloaded/shared invoice |

## Data models (`src/types.ts`)
- **Profile** — business identity printed on every invoice: companyName, label (switcher name), logo (data URL or `/logos/...` path), brandColor, address, phone, mobile, email, website, vatNumber, companyNumber, invoicePrefix, paymentTermsDays, bank details, defaultNote, terms, quickItems.
- **Invoice** — id, profileId, number, issueDate, dueDate, customer, vehicleReg, reference, items[], status (`paid|unpaid|partial`), method (`card|cash|bank|other`), amountPaid, notes, savedAt.
- **LineItem** — description, detail, qty, price (**unit price incl. VAT**).

localStorage keys (`src/lib/storage.ts`): `invoice-studio:v1:profiles`, `:history`, `:active-profile`, `:draft`.

## Data flow
1. `App.tsx` boots from localStorage (seeds Creations profile on first run) and restores the last draft.
2. Form edits call `update(fn)` → new `invoice` state → draft autosaved (250 ms debounce).
3. Desktop (≥1024px), or phone with Preview open: after 420 ms debounce, `pdf/generate.ts` (lazy chunk) builds the PDF Blob → `PdfPreview` renders it with pdf.js.
4. Download/Share: validate (customer name + one priced line) → reuse the cached Blob if current, else render → save file / `navigator.share` → invoice upserted into history.
5. Switching profile: an unsaved draft moves to the new profile (renumbered); an already-saved invoice is left alone and a fresh one starts.

## VAT maths (`src/lib/money.ts`)
Per line, in pence: `unitNet = round(unitGross / 1.2)`, `net = round(qty × unitNet)`, `gross = round(qty × unitGross)`, `vat = gross − net`. Totals are sums. Guarantees: total = exactly what was typed, qty × unit price = line amount; VAT may differ from 20% of subtotal by a penny on some multi-quantity lines.

## Integrations
| Service | Where in code | Notes |
|---|---|---|
| Web Share API | `App.tsx` `sharePdf()` / `share()` / `shareFromHistory()` | Only shown when the browser can share files; the main action on phones (`shareFirst`). If the tap "expired" while the PDF was being made (`NotAllowedError`), a toast offers a one-tap retry; other share errors fall back to download |

## Key modules
- `src/pdf/InvoiceDocument.tsx` — the premium invoice layout. Header (title + meta, logo or monogram), From / Bill to / Vehicle plate, statement panel with status pill, line-item table (header repeats on new pages), payment + totals with brand-coloured balance box, terms, fixed footer with legal line + page x of y.
- `src/lib/money.ts` — the only place VAT is calculated.
- `src/App.tsx` — orchestration; keep business rules in `lib/`.
