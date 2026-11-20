BILLORA — FAST TOUCH BILLING POS (Enhanced Demo)

================================================
WHAT'S NEW / FEATURES
================================================
✓ Touch Billing (POS style)
  - New Bill button → category tabs (All + custom categories)
  - Large touch-friendly item cards
  - Live cart with qty +/−, tax, discount
  - Barcode scanner support (keyboard wedge / USB scanners)
  - Search by name / SKU / barcode

✓ Save + Print
  - Save bill
  - Save & Print
  - Double Print option
  - KOT (Kitchen Order Ticket) print

✓ Thermal Printer Ready
  - 2-inch (58mm) and 3-inch (80mm) bill formats
  - Normal / A4 option
  - Customizable header, address, phone, GSTIN, footer
  - Print via browser (works with most USB / Bluetooth thermal printers that support system print)

✓ Inventory
  - Stock tracking on every sale
  - Purchase / Stock-In entry
  - Low stock alerts

✓ Reports
  - Today / This Week / This Month / All Time
  - Sales totals, collected, pending
  - 7-day chart + top items

✓ Multi-user (local)
  - Multiple users with PIN login
  - Roles: Admin / Cashier
  - Default PIN for demo users: 1234

✓ Other
  - Customers directory
  - Products with category, barcode, SKU, unit
  - Business profile & print settings
  - JSON backup export / import
  - 4 themes (Royal, Midnight, Ocean, Indigo)
  - Mobile-first responsive UI

================================================
HOW TO RUN
================================================
1. Keep these 3 files in the same folder:
   - index.html
   - style.css
   - app.js

2. Open index.html in Chrome / Edge / Firefox
   OR upload the folder to GitHub and enable GitHub Pages.

3. First screen asks for User + PIN (demo PIN = 1234)

================================================
PRINTING NOTES (Important)
================================================
- This is a browser-based demo. Real USB / Bluetooth thermal printing
  depends on your operating system printer drivers.
- Recommended:
  1. Install your thermal printer drivers (58mm or 80mm).
  2. Set the printer as default or select it in the browser print dialog.
  3. In Billora Settings → choose 58mm or 80mm print size.
  4. Use "Save & Print" or "Print / PDF".
- For pure ESC/POS direct printing you would need a native app
  or a local print agent (not included in this pure web demo).

================================================
BARCODE SCANNER
================================================
- Most USB / Bluetooth barcode scanners work as keyboard.
- On the Billing screen just scan — item will be added automatically.
- You can also type barcode and press Enter.

================================================
DEMO LIMITATIONS
================================================
- Data is stored only in the current browser (localStorage).
- No cloud sync, no real multi-device, no payment gateway.
- No GST e-invoice / e-way bill / legal compliance.
- Multi-user is local PIN only (not secure server auth).
- Do NOT use as production accounting software without
  proper backend, authentication, database and tax workflows.

================================================
DEFAULT DEMO DATA
================================================
Users   : Owner / Cashier  (PIN 1234)
Items   : Premium Service, Product A, Consultation, Tea, Coffee, Samosa
Customers: Aarav Sharma, Meera Enterprises, Walk-in

Enjoy fast billing!
