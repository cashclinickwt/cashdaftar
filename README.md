# Cash Daftar — كاش دفتر (site)

SaaS accounting for Kuwaiti SMEs, a Cash Clinic product. Static site — no build step — served from GitHub Pages.
Backend lives in the separate `cash-daftar-backend` folder (Firebase project `cash-daftar`).

## Structure
- `index.html` — landing page (Arabic RTL default / English toggle) with pricing
- `app.html` + `assets/js/app.js` + `assets/css/app.css` — the app (auth, onboarding, ledger, sales, spending, costing, reports, XBRL export, billing, settings, admin)
- `success.html` — Tap redirect page after payment (polls `getSubscriptionStatus`)
- `assets/js/config.js` — **paste the Firebase web config here** (Project settings → Your apps)
- `assets/ds/` — Cash Clinic design system (fonts + tokens, unchanged)
- `assets/brand/` — Cash Daftar mark, lockups, favicon (Golden Ochre sub-brand of Cash Clinic)

## IMPORTANT: .nojekyll
The empty `.nojekyll` file in the repo root MUST stay. Without it GitHub Pages runs Jekyll and the deploy fails.

## Deploy (GitHub Pages — branch mode)
New repo `cash-daftar` → Settings → Pages → Source: "Deploy from a branch" → `main` / (root). Push these files to the repo root.
Then add `USERNAME.github.io` to Firebase Auth → Authorized domains, and set `APP_URL` in the backend `.env`.

## Custom domain (later)
Add a `CNAME` file containing `cashdaftar.com`, point DNS to GitHub Pages, add the domain to Firebase Auth authorized domains, update `APP_URL` and redeploy functions.

## Notes
- All writes go through Cloud Functions; the browser only reads its own company's data (Firestore rules).
- Subscription is prepaid per period (30 / 365 days) via Tap — no auto-renewal in v1.
- XBRL export is a generic IFRS-taxonomy mapping until the official MoC (قيّد) template is supplied; edit the `xbrl` field per account in the backend `coa.js` or per company from Chart of accounts.
