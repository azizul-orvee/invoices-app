# Status — last updated 2026-11-19

## Current state
v1 is built and working locally (dev and production build). Not deployed yet. Code is on GitHub at https://github.com/azizul-orvee/invoices-app (branch `main`). Tested in Chrome at desktop and 375px phone widths; not yet tested on a real iPhone/Android.

## ✅ Recently done
- Business profiles (create/edit/duplicate/delete, logo upload, brand colour, bank details, quick items); Creations Mobile Tyres seeded from the old invoice
- Invoice form: customer (with returning-customer autofill), vehicle reg, PO/reference, line items with qty, VAT-inclusive prices, paid / unpaid / part-paid
- Premium PDF (`src/pdf/InvoiceDocument.tsx`) with live on-screen preview of the real PDF
- Download, Share (phones), invoice history, backup export/import, draft autosave
- Put under git and pushed to GitHub (`azizul-orvee/invoices-app`, branch `main`)

## 🚧 In progress
- Nothing

## ⏭️ Next up
- Add the ETR profile (user, in the app) and check the PDF with ETR's real logo
- Deploy to a static host and try it on a real phone (Share sheet, Download, Add to Home Screen)

## 🐛 Known issues
- Console warning "Buffer is not defined" from react-pdf in the browser; PDFs still generate correctly.
- The seeded Creations logo is low resolution (288×70 px, taken from the old PDF). Uploading the original logo file will look sharper.
- Data is per browser/device; clearing site data deletes profiles and history (use Export backup).

## ⚠️ Watch out
- Prices typed are VAT-inclusive; the PDF shows line items **excluding** VAT with a VAT 20% row.
- react-pdf quirks: never put `lineHeight` on the Page or a View; use the `T` text wrapper in `InvoiceDocument.tsx`.
- The PDF engine is a ~450 KB gzipped lazy chunk; it's preloaded on idle (`App.tsx`).
