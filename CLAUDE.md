@AGENTS.md

# Claude Code specifics
- Follow the Hard rules in AGENTS.md: never commit or push unless explicitly asked; never change the production database.
- Follow the Documentation rules in AGENTS.md on every task — update docs/ai/ before saying you're done.
- Check changes with `npm run typecheck` and `npm run build`. Preview with the `invoice-studio` (dev, :5173) or `invoice-studio-build` (production preview, :4173) entries in `.claude/launch.json`.
- To review the PDF design without the browser, render `InvoiceDocument` in Node with Vite's `runnerImport` + `@react-pdf/renderer`'s `renderToFile`, registering the fonts from `node_modules/@fontsource/*/files/*.woff` by file path, then open the PDF.
