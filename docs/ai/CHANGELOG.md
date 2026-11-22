# Changelog

All changes to this project, newest first. Every AI tool and human must add an entry here after each change.

## 2026-11-22 — Share fix deployed to Vercel
**Type:** deploy
**Tool:** Claude Code
**What changed:**
- Pushed commit `a47531b` to GitHub `main`. Vercel rebuilt by itself and https://invoices-app-plum.vercel.app was serving it within about a minute.
- Checked live: the home page loads the same build as local (`assets/index-DwVr49on.js`); `/404.html` returns 200; the client's dead link `/7046808e-1bea-43ec-bf17-1db6c7a9a835` now returns 404 with the "This link doesn't open an invoice" page.
- `docs/ai/STATUS.md`, `docs/ai/PROJECT.md`, `AGENTS.md`: pushing to `main` deploys automatically (confirmed).
**Why:** User asked to commit and push the Share fix to live.
**Notes / gotchas:** Still not tested on a real phone. Who owns the Vercel project is unconfirmed (probably the client).

## 2026-11-22 — Phones lead with Share; friendly page for dead links
**Type:** fix
**Tool:** Claude Code
**What changed:**
- `src/App.tsx`: on phones that can share files, **Share** is now the main button. The phone action bar shows Preview + Share; the Preview sheet shows Download (secondary) + Share (primary). Desktop is unchanged (Download PDF main, Share secondary where supported). Phones that can't share files keep the old PDF download button.
- `src/App.tsx`: new `sharePdf()` helper used by Share and by History. If the browser rejects the share because making the PDF took too long (`NotAllowedError`), it shows a "Your PDF is ready" toast with a **Share** button instead of falling back to a download. Share errors while making the PDF now show the "Could not create the PDF" toast.
- `src/components/HistorySheet.tsx`: on phones the row's **PDF** button becomes **Share** (new optional `onShare` prop). Row buttons tightened (`px-2`, `gap-1`, delete pushed right with `ml-auto`) so a row fits on one line down to 360px.
- Phone action bar: buttons use `px-4!`, and the Preview label hides below 380px, so "Total paid · inc. VAT" and amounts up to £1,250.00 stay on one line at 360–375px.
- `public/404.html`: self-contained "This link doesn't open an invoice" page, served by static hosts (Vercel, Netlify, Cloudflare Pages) for any unknown address. Explains what to do for both the person who got the link and the person who made the invoice.
**Why:** The client sent a link `https://invoices-app-plum.vercel.app/<uuid>` that showed Vercel's 404. It was a `blob:` address: on phones, **Download** opens the PDF at `blob:https://<site>/<random id>`, which only exists in that tab for about a minute. He copied it from the address bar and sent it on. The phone bar's main button was a plain download, so this was the easy path.
**Notes / gotchas:** Tested in the built app (`npm run preview`) at 360, 375 and desktop widths, with `navigator.share` stubbed because the test browser can't share files: Share hands over the real PDF file and saves to History; the expired-tap retry works; History Share works. Not yet tested on a real iPhone/Android. `vite preview` serves `index.html` for unknown paths, so the 404 page was checked at `/404.html` directly; the Vercel behaviour needs checking after deploy. Test invoice data was only in the local preview browser and was deleted afterwards.

## 2026-11-19 — Put under git and pushed to GitHub
**Type:** config
**Tool:** Claude Code
**What changed:**
- `git init` on branch `main`, first commit of the whole project, remote `origin` = https://github.com/azizul-orvee/invoices-app
- `docs/ai/STATUS.md`, `docs/ai/PROJECT.md`: noted the GitHub repo
**Why:** User asked to put the project in their GitHub repo.
**Notes / gotchas:** `node_modules/` and `dist/` are git-ignored (`.gitignore`). No secrets in the repo; seeded bank details in `src/seed.ts` are blank.

## 2026-11-19 — Invoice Studio v1 built
**Type:** feature
**Tool:** Claude Code
**What changed:**
- Scaffolded Vite + React + TypeScript + Tailwind 4 app (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`)
- Business profiles with localStorage persistence (`src/lib/storage.ts`, `src/seed.ts`, `src/components/ProfilesSheet.tsx`, `src/components/ProfileSwitcher.tsx`); Creations Mobile Tyres profile seeded from the old invoice, logo extracted to `public/logos/creations-mobile-tyres.png`
- Invoice form with VAT-inclusive pricing and payment states (`src/components/InvoiceForm.tsx`, `src/lib/money.ts`, `src/lib/invoice.ts`)
- Premium PDF template with react-pdf (`src/pdf/InvoiceDocument.tsx`, `src/pdf/fonts.ts`, `src/pdf/generate.ts`) and pdf.js live preview (`src/components/PdfPreview.tsx`)
- Download, Web Share, invoice history (`src/components/HistorySheet.tsx`), backup export/import, draft autosave, mobile action bar and preview sheet (`src/App.tsx`)
- Docs: `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/ai/*`; dev/preview launch configs in `.claude/launch.json`
**Why:** Replace the paid invoicing software with an own app that supports several businesses and produces a much more premium PDF, usable on a phone.
**Notes / gotchas:** react-pdf hides fixed footers when `lineHeight` is on the Page and mis-sizes unitless `lineHeight` when `fontSize` is inherited — handled by the `T` wrapper. No test data outside the local browser was created.

## 2026-11-19 — Project documentation initialized
**Type:** docs
**Tool:** Claude Code
**What changed:**
- Created AGENTS.md, CLAUDE.md, and docs/ai/ documentation system
**Why:** So any session or AI tool can understand and continue the project without re-explaining
**Notes / gotchas:** Project state at this point: new project (empty folder, no git) built from scratch in this session. No existing docs to adopt.
