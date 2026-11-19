# Project Overview — Invoice Studio

## Purpose
Make premium-looking VAT invoices in seconds, on phone or desktop, for several businesses from one app. Primary action: fill in customer + price → **Download PDF** (or **Share** on phones). Replaces a paid invoicing tool whose PDFs looked basic.

## Owner / client
Internal tool for the owner of UK mobile-tyre businesses:
- **Creations Mobile Tyres** (seeded as the first profile from the old invoice: address, phones, email, website, VAT no., logo)
- **Emergency Tyre Rescue (ETR)** — to be added by the user as a profile
- More businesses can be added as profiles at any time.

## Tech stack
| Layer | Tech |
|---|---|
| Framework | React 19 + Vite 8 (Rolldown) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), tokens in `src/index.css` |
| PDF generation | `@react-pdf/renderer` 4 (vector PDF, embedded fonts) |
| PDF preview | `pdfjs-dist` 6 legacy build (renders the real PDF to canvas) |
| Fonts | Plus Jakarta Sans + Geist Mono via `@fontsource/*` (self-hosted, Latin subset) |
| Icons | `lucide-react` |
| Database / ORM | None — browser `localStorage` |
| Auth | None |
| Hosting | Static. TODO: confirm with user (Netlify / Vercel / Cloudflare Pages) |

## Getting started
```bash
npm install
npm run dev      # http://localhost:5173 (also on your LAN, so you can open it on your phone)
```

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 (`host: true`) |
| `npm run build` | Type-check (`tsc --noEmit`) then production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | TypeScript only |

## Environment variables (names only — never values)
None.

## Deployment
Any static host. Build command `npm run build`, publish directory `dist`. No server, no env vars. Data is per-browser, so users move profiles between devices with **Profiles → Export / Import backup** (JSON file).

## External accounts / dashboards
- **GitHub repo:** https://github.com/azizul-orvee/invoices-app (default branch `main`)
