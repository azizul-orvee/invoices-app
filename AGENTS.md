# AGENTS.md — Invoice Studio

> Start here. This file is the entry point for any AI assistant or developer working on this project.

## What this is
A browser-only invoice maker for the owner's UK mobile-tyre businesses (Creations Mobile Tyres, Emergency Tyre Rescue, more to come). Pick a business profile, type the customer and the VAT-inclusive price, hit Download — a premium A4 PDF comes out. It replaces a paid invoicing tool and must work well on a phone.

## Read these next
1. `docs/ai/STATUS.md` — where things stand right now and what's next (read first)
2. `docs/ai/CHANGELOG.md` — history of every change (read the latest entries)
3. `docs/ai/PROJECT.md` — stack, setup, commands, deploy
4. `docs/ai/ARCHITECTURE.md` — code map and data flow
5. `docs/ai/DECISIONS.md` — why things are the way they are

## Other docs
- `README.md` — short human guide: run, build, deploy, how to use
- `docs/samples/*.pdf` — example output of the PDF design (fake customer data; the ETR one is a mock-up with placeholder details)

## Quick facts
- **Stack:** Vite 8 + React 19 + TypeScript, Tailwind CSS 4, @react-pdf/renderer 4 (PDF), pdfjs-dist 6 (on-screen preview)
- **Run locally:** `npm install` then `npm run dev` (http://localhost:5173)
- **Build:** `npm run build` → static files in `dist/`
- **Deploy:** any static host (Netlify, Vercel, Cloudflare Pages). Live on Vercel at https://invoices-app-plum.vercel.app. **Every push to `main` goes live automatically**, so a push is a production deploy (see `docs/ai/PROJECT.md`).
- **Package manager:** npm
- **No backend, no database.** All data (profiles, history, draft) lives in the browser's `localStorage`.

## Conventions
- **The one money rule:** every price the user types INCLUDES 20% VAT. `src/lib/money.ts` splits it into net + VAT in whole pence. Never change this without asking.
- Money is handled in integer pence internally (`calcTotals`), formatted only at display time (`formatMoney`).
- The PDF (`src/pdf/InvoiceDocument.tsx`) is the single source of truth — the on-screen preview renders the real PDF with pdf.js, so there is no separate HTML invoice to keep in sync.
- In the PDF, use the `T` wrapper instead of react-pdf `Text` for normal text (see DECISIONS: react-pdf lineHeight bugs). Nested spans inside a `T` use plain `Text`.
- UI theme colour comes from the active profile's `brandColor` via CSS variables (`--brand`, `--on-brand`, `--brand-soft`, `--brand-text`) set in `src/App.tsx`.
- Inputs use 16px font on mobile (prevents iOS zoom); tap targets ≥ 44px.

## Don't touch without asking
- VAT logic and rounding in `src/lib/money.ts`
- Invoice numbering format in `src/lib/invoice.ts` (`PREFIX-YYYY-MMDD-NN`, matches the old system)
- `localStorage` keys in `src/lib/storage.ts` (renaming them wipes users' saved profiles/history)

## 🚫 Hard rules (MANDATORY for every AI tool)
1. **No `git commit` and no `git push` unless the user explicitly asks in that message.** Commit permission is not push permission. Read-only git (`status`, `log`, `diff`) is fine. Leave finished work uncommitted.
2. **Production database is read-only.** (This project currently has no database — data is in the user's browser.) If a database is ever added: no writes, migrations, schema pushes, seeds, or resets against production unless the user explicitly asks. Check which DB `DATABASE_URL` points to before any DB command; if it's production or unclear, stop and ask. Develop and test on a dev/local DB. If any record in production is created or changed during development/testing, delete/restore it before finishing, verify, and log the cleanup in the changelog.

## 📝 Documentation rules (MANDATORY for every AI tool)
This project documents itself. Whatever tool you are (Claude Code, Cursor, Copilot, Codex, etc.):
1. **Before working:** read `docs/ai/STATUS.md` and the latest entries in `docs/ai/CHANGELOG.md`.
2. **After ANY change, before finishing:**
   - Add a dated entry at the TOP of `docs/ai/CHANGELOG.md` (format below).
   - Update `docs/ai/STATUS.md` (done / in progress / next / known issues).
   - `ARCHITECTURE.md` is the agreed plan. If your change fits it, you may add detail (new paths, routes, models). If your change deviates from it, do NOT rewrite it to match your code — stop and tell the user. Only after they approve: update it and add a `DECISIONS.md` entry.
   - Update `PROJECT.md` if stack/commands/env/deploy changed, `DECISIONS.md` if you made a non-obvious choice.
3. Be specific, include file paths, never write secrets (env var names only).

Changelog entry format:
    ## YYYY-MM-DD — Short title
    **Type:** feature | fix | refactor | style | content | config | deps | deploy | docs
    **Tool:** <which AI/human>
    **What changed:**
    - <change with `file/path`>
    **Why:** <reason>
    **Notes / gotchas:** <optional, include any test-data cleanup done>
