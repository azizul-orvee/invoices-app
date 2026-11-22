# Status — last updated 2026-11-22

## Current state
v1 is built and working. Code is on GitHub at https://github.com/azizul-orvee/invoices-app (branch `main`). A live copy exists at https://invoices-app-plum.vercel.app (Vercel). As of 2026-11-22 it served the same build as `main`. Not set up from this folder (no `.vercel/`); probably the client's Vercel account; whether it auto-deploys from GitHub is unconfirmed. Tested in Chrome at desktop, 375px and 360px widths; not yet tested on a real iPhone/Android.

## ✅ Recently done
- 2026-11-22: phones lead with **Share** (sends the PDF file) instead of Download (which produced dead `blob:` links the client was sending on); "PDF is ready → Share" retry toast; History rows Share on phones; friendly `public/404.html` for dead links. **Uncommitted, not deployed.**
- Business profiles (create/edit/duplicate/delete, logo upload, brand colour, bank details, quick items); Creations Mobile Tyres seeded from the old invoice
- Invoice form: customer (with returning-customer autofill), vehicle reg, PO/reference, line items with qty, VAT-inclusive prices, paid / unpaid / part-paid
- Premium PDF (`src/pdf/InvoiceDocument.tsx`) with live on-screen preview of the real PDF
- Download, Share (phones), invoice history, backup export/import, draft autosave
- Put under git and pushed to GitHub (`azizul-orvee/invoices-app`, branch `main`)

## 🚧 In progress
- Nothing

## ⏭️ Next up
- Commit + push the 2026-11-22 Share fix (needs the user's go-ahead), then confirm the Vercel site picks it up and that `https://invoices-app-plum.vercel.app/<anything>` shows `404.html`
- Confirm who owns the Vercel project and whether it deploys from GitHub `main`
- Try it on a real phone (Share sheet, Download, Add to Home Screen)
- Add the ETR profile (user, in the app) and check the PDF with ETR's real logo
- Fill in the Creations bank details (Profiles) so unpaid invoices show how to pay

## 🐛 Known issues
- Console warning "Buffer is not defined" from react-pdf in the browser; PDFs still generate correctly.
- The seeded Creations logo is low resolution (288×70 px, taken from the old PDF). Uploading the original logo file will look sharper.
- Data is per browser/device; clearing site data deletes profiles and history (use Export backup).
- There are no invoice links. An address like `https://<site>/<uuid>` is a copied `blob:` URL from a phone download and only ever worked on that device. Send the PDF file (Share), not a link.

## ⚠️ Watch out
- Prices typed are VAT-inclusive; the PDF shows line items **excluding** VAT with a VAT 20% row.
- react-pdf quirks: never put `lineHeight` on the Page or a View; use the `T` text wrapper in `InvoiceDocument.tsx`.
- The PDF engine is a ~450 KB gzipped lazy chunk; it's preloaded on idle (`App.tsx`).
