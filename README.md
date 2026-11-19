# Invoice Studio

Premium VAT invoices for several businesses, from one app, on phone or desktop.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. On the same Wi-Fi you can open it on your phone using the "Network" address Vite prints.

## Use it

1. **Pick the business** at the top (Creations is set up already). Tap **New profile** to add Emergency Tyre Rescue or any other business: logo, brand colour, address, VAT number, bank details, quick items.
2. **Fill in the customer** and the **work & price**. Prices you type **include 20% VAT** — the invoice works out the net and VAT for you.
3. Choose **Paid / Unpaid / Part paid**.
4. Tap **Download PDF** (or **Share** on a phone to send it straight to WhatsApp, email, etc).

Every downloaded invoice is kept in **History** to re-download, open or duplicate.

Your profiles and history are saved in this browser only. To use them on another device: **Profiles → Export backup**, then **Import backup** on the other device.

## Put it online

It's a static site — no server needed.

```bash
npm run build
```

Upload the `dist/` folder to Netlify, Vercel or Cloudflare Pages (build command `npm run build`, output folder `dist`).
