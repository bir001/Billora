BILLORA POS — GitHub Pages PWA

FILES TO UPLOAD TO THE ROOT OF ONE GITHUB REPOSITORY:
index.html, style.css, app.js, config.js, manifest.json, sw.js, icon.svg

PUBLISH:
1. Create a GitHub repository.
2. Upload all files directly to the repository root (not inside another folder).
3. Repository Settings > Pages > Deploy from a branch > main > /(root) > Save.
4. Open the published HTTPS address in Chrome on Android/PC.
5. Android Chrome menu > Install app / Add to Home screen.

CURRENT WORKING FEATURES:
- Touch-first POS billing, category filters, product search, keyboard-wedge barcode scanning
- Live cart totals, GST, discount, cash/UPI/card/credit, save bill, reprint
- 58mm/80mm receipt layout, copies/double print, browser print-to-PDF
- KOT ticket and kitchen status
- Product/category management, purchase entry, stock adjustment and sales stock deduction
- Customer list, date-based reports, CSV export, JSON backup/restore
- PWA manifest + service worker cache for app shell/offline opening
- Optional Supabase login and workspace cloud pull/push + realtime update listener

IMPORTANT LIMITATIONS / NEXT SETUP:
- Local data is saved in the current browser/device by default. It does NOT magically sync across devices until Supabase is configured.
- Open config.js and paste Supabase Project URL and anon/public key (never service_role key).
- In Supabase SQL Editor, run the SQL copied from Billora > Users & Sync > Copy database setup SQL.
- Create/login owner account, insert owner membership row in workspace_members with workspace_id matching the same workspace ID shown in Billora, user_id = owner's Auth UUID, role='owner'. Add each staff user's UUID similarly with role cashier/manager/staff.
- Then press Pull/Push in Users & Sync. Use the same workspace ID on every device. This starter stores a workspace snapshot as JSONB; for production high-concurrency multi-cashier use normalized transaction tables, server-side stock locking, audit logs and tested conflict handling.
- The browser-based version cannot guarantee direct USB/Bluetooth ESC/POS printing or silent printing on every device. It invokes the system print dialog; paired printer compatibility depends on OS/browser/driver. A native Android/desktop print bridge is required for guaranteed direct ESC/POS printing.
- Offline mode caches the app shell and keeps local data on that device. Offline changes are not automatically merged to cloud; push/pull is manual in this starter to avoid overwriting another cashier's work. Do not use as production accounting until cloud schema, role policies, concurrency and GST workflows are tested.
