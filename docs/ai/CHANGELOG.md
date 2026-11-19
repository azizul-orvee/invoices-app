# Changelog

All changes to this project, newest first. Every AI tool and human must add an entry here after each change.

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
