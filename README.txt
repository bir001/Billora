BILLORA POS — Fast touch billing & inventory (PWA)

DEPLOY (GitHub Pages)
1. Extract the zip. All files sit at the top level, there are no folders.
2. Upload every file to your repository root (index.html must be in the root).
3. Settings > Pages > Deploy from branch (main / root).
4. Open the site in Chrome. An "Install Billora App" banner appears at the top. Tap Install.

FEATURES
- Full-touch POS: compact item tiles (name + stock), tap to add, tap the badge to remove
- Sticky checkout bar: payment mode, print format (2 inch / 3 inch / A4), Save, Print
- Multiple parallel bills (tabs), customer name + mobile only (optional)
- Barcode: scan / camera / generate / label print (can be disabled in Settings)
- Returns (sales & purchase), KOT management, purchase, live stock, low-stock alerts
- Reports with custom date range, Excel and PDF export, JSON backup
- Bill formats: 2 inch, 3 inch, 4 inch, A5, A4 and custom roll width
- Printing: RawBT app (instant, any Bluetooth / USB / LAN / Wi-Fi printer), direct Bluetooth (BLE), direct USB, or system print dialog. Text and Graphic (Hindi/Kannada) styles
- 8 bill templates (Classic, One line, Table, Compact, Minimal, GST detail, Bold, Dotted) with live preview

- Forms and panels open from the top so the phone keyboard never covers them
- 6 themes (left menu > Theme), splash screen, offline-ready PWA

NOTES
- Data is stored on the device (browser storage). Use Settings > Export JSON for backups.
- Browsers cannot open raw LAN sockets, so LAN printers print through RawBT (add the LAN printer inside RawBT) or the system print dialog.
- Direct printing needs Chrome. Bluetooth must be a BLE-capable printer; USB needs an OTG cable.
  Otherwise choose "System" print and use your printer's Android print service.

CLOUD / PLANS (new): see FIREBASE-SETUP.txt. Files: firebase-config.js, cloud.js, account.js, admin.html, admin.js, firestore.rules.
LABELS / SCANNERS (new): Items > tag icon, or an item > Labels. Barcode (Code 128) or QR, sizes 50x25 / 50x50 / custom, preview, copies, system print or thermal printer.
Scan with the phone camera (1D + 2D) or any USB / Bluetooth scanner on the billing screen.
