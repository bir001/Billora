BILLORA POS - Nanu Cart theme (flat files, koi folder nahi)

GITHUB PE LAGANA
1. Zip extract karo, saari files repo ke root me upload karo (index.html root me honi chahiye).
2. Repo Settings > Pages > Branch main / root > Save.

SUPABASE (login + sync) - ek baar setup
1. supabase.com par project banao.
2. SQL Editor me supabase.sql ka poora text paste karke Run karo.
3. Authentication > Providers > Email: "Confirm email" band kar do (aasan login ke liye).
4. Project Settings > API se Project URL aur anon public key copy karo.
5. Billora > Settings > Cloud Sync me dono daalo > Save & Reload > Sign up (pehla account = Owner).
6. Staff ke liye: Owner ka Business code (Settings/Staff page me) staff signup me daale, phir Owner Staff & Users me role de.
Dusre device par wahi login karo - data apne aap sync hoga.

ROLES: Owner (sab), Manager (settings/staff chhod kar sab), Cashier (billing, bills, KOT, customers), Staff (billing, bills, products dekhna).
NOTE: role restrictions app ke andar lagi hain; cloud database level par sab same business ke users ek hi data table padh/likh sakte hain.

FEATURES: parallel multi-bill tabs, touch billing, barcode (scan/camera/labels, Settings me on/off), GST, discount, Cash/UPI/Card/Credit,
58mm/80mm/A4 print, double print, KOT, sales+purchase return, purchase, live stock, low stock, customers/suppliers, reports (custom range), Excel/PDF export, backup.
Barcode type: Code 39 (generate), scan me Code128/EAN bhi chalte hain agar product me wahi code daala ho.
