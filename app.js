/* ===== Billora — Fast Touch Billing POS ===== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const nowTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const seed = {
  business: {
    name: 'Your Business',
    phone: '9876543210',
    email: '',
    address: 'Shop No. 12, Main Market, Jaunpur, UP',
    gst: '',
    currency: 'INR',
    printSize: '80',          // 58 | 80 | A4
    headerText: '',
    footerText: 'Thank you! Visit again.',
    showGst: true,
    doublePrint: false,
    kotEnabled: true
  },
  users: [
    { id: 'U1', name: 'Owner', role: 'admin', pin: '1234' },
    { id: 'U2', name: 'Cashier', role: 'cashier', pin: '1234' }
  ],
  categories: [
    { id: 'CAT1', name: 'Services' },
    { id: 'CAT2', name: 'Products' },
    { id: 'CAT3', name: 'Food' }
  ],
  customers: [
    { id: 'C001', name: 'Aarav Sharma', phone: '9876543210', email: 'aarav@example.com', address: 'Jaunpur, UP' },
    { id: 'C002', name: 'Meera Enterprises', phone: '9876501234', email: '', address: 'Azamgarh, UP' },
    { id: 'WALKIN', name: 'Walk-in Customer', phone: '', email: '', address: '' }
  ],
  products: [
    { id: 'P001', name: 'Premium Service', sku: 'SRV-01', barcode: '8901001', price: 1500, stock: 999, categoryId: 'CAT1', unit: 'Nos' },
    { id: 'P002', name: 'Product A', sku: 'PRD-01', barcode: '8901002', price: 850, stock: 32, categoryId: 'CAT2', unit: 'Nos' },
    { id: 'P003', name: 'Consultation', sku: 'SRV-02', barcode: '8901003', price: 500, stock: 999, categoryId: 'CAT1', unit: 'Nos' },
    { id: 'P004', name: 'Tea', sku: 'FD-01', barcode: '8901004', price: 20, stock: 200, categoryId: 'CAT3', unit: 'Cup' },
    { id: 'P005', name: 'Coffee', sku: 'FD-02', barcode: '8901005', price: 40, stock: 150, categoryId: 'CAT3', unit: 'Cup' },
    { id: 'P006', name: 'Samosa', sku: 'FD-03', barcode: '8901006', price: 15, stock: 80, categoryId: 'CAT3', unit: 'Pcs' }
  ],
  invoices: [
    {
      id: 'BILL-1001', customerId: 'C001', date: today(), time: '10:30',
      items: [{ productId: 'P001', name: 'Premium Service', qty: 1, price: 1500 }],
      tax: 18, discount: 0, status: 'paid', notes: '', userId: 'U1', type: 'sale'
    },
    {
      id: 'BILL-1002', customerId: 'C002', date: today(), time: '14:15',
      items: [{ productId: 'P002', name: 'Product A', qty: 2, price: 850 }],
      tax: 18, discount: 100, status: 'unpaid', notes: '', userId: 'U1', type: 'sale'
    }
  ],
  purchases: [],
  currentUser: null
};

let db;
try {
  db = JSON.parse(localStorage.getItem('billora_db_v2')) || structuredClone(seed);
} catch (e) {
  db = structuredClone(seed);
}

// ensure walk-in exists
if (!db.customers.find(c => c.id === 'WALKIN')) {
  db.customers.unshift({ id: 'WALKIN', name: 'Walk-in Customer', phone: '', email: '', address: '' });
}

let route = 'home';
let filter = 'all';
let searchTerm = '';
let reportRange = 'month';
let activeCat = 'all';
let cart = [];           // {productId, name, qty, price, unit}
let billCustomer = 'WALKIN';
let billTax = 18;
let billDiscount = 0;
let billNotes = '';
let barcodeBuffer = '';
let pinBuffer = '';
let selectedLoginUser = null;

/* ---------- helpers ---------- */
function save() {
  localStorage.setItem('billora_db_v2', JSON.stringify(db));
}
function toast(t) {
  const el = $('#toast');
  el.textContent = t;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 2400);
}
function fmt(d) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}
function customer(id) {
  return db.customers.find(x => x.id === id) || { name: 'Walk-in', phone: '' };
}
function product(id) {
  return db.products.find(p => p.id === id);
}
function total(inv) {
  const sub = inv.items.reduce((s, x) => s + x.qty * x.price, 0);
  return Math.max(0, sub + (sub * (inv.tax || 0) / 100) - Number(inv.discount || 0));
}
function cartSub() {
  return cart.reduce((s, x) => s + x.qty * x.price, 0);
}
function cartTotal() {
  const sub = cartSub();
  return Math.max(0, sub + (sub * billTax / 100) - Number(billDiscount || 0));
}
function paid() {
  return db.invoices.filter(x => x.status === 'paid' && x.type !== 'purchase').reduce((s, x) => s + total(x), 0);
}
function due() {
  return db.invoices.filter(x => x.status !== 'paid' && x.type !== 'purchase').reduce((s, x) => s + total(x), 0);
}
function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function nextBillNo() {
  const nums = db.invoices.map(i => parseInt((i.id || '').replace(/\D/g, '')) || 0);
  const max = nums.length ? Math.max(...nums) : 1000;
  return 'BILL-' + (max + 1);
}

/* ---------- auth ---------- */
function needLogin() {
  return !db.currentUser;
}
function showLogin() {
  const screen = $('#loginScreen');
  screen.classList.remove('hide');
  selectedLoginUser = db.users[0]?.id || null;
  pinBuffer = '';
  renderLogin();
}
function renderLogin() {
  $('#userSelect').innerHTML = db.users.map(u =>
    `<button class="btn ${selectedLoginUser === u.id ? 'b' : 'o'} sm" style="margin:4px" onclick="selectUser('${u.id}')">${esc(u.name)} (${u.role})</button>`
  ).join('');
  updatePinDots();
  $('#numpad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map(k =>
    `<button onclick="pressPin('${k}')">${k}</button>`
  ).join('');
}
function selectUser(id) {
  selectedLoginUser = id;
  pinBuffer = '';
  renderLogin();
}
function updatePinDots() {
  const dots = $$('#pinDots i');
  dots.forEach((d, i) => d.classList.toggle('on', i < pinBuffer.length));
}
function pressPin(k) {
  if (k === 'C') { pinBuffer = ''; updatePinDots(); return; }
  if (k === '✓') {
    const user = db.users.find(u => u.id === selectedLoginUser);
    if (user && user.pin === pinBuffer) {
      db.currentUser = { id: user.id, name: user.name, role: user.role };
      save();
      $('#loginScreen').classList.add('hide');
      toast('Welcome, ' + user.name);
      render();
    } else {
      toast('Wrong PIN');
      pinBuffer = '';
      updatePinDots();
    }
    return;
  }
  if (pinBuffer.length < 4) {
    pinBuffer += k;
    updatePinDots();
    if (pinBuffer.length === 4) setTimeout(() => pressPin('✓'), 180);
  }
}
function logout() {
  db.currentUser = null;
  save();
  showLogin();
}

/* ---------- navigation ---------- */
const navItems = [
  ['home', '⌂', 'Home'],
  ['billing', '▣', 'Billing'],
  ['invoices', '▤', 'Bills'],
  ['products', '▦', 'Items'],
  ['more', '⋯', 'More']
];

function nav() {
  $('#nav').innerHTML = navItems.map(([r, i, t]) => {
    const active = route === r || (r === 'more' && ['customers', 'reports', 'purchase', 'settings', 'users'].includes(route));
    return `<a href="#${r}" class="${active ? 'on' : ''} ${r === 'billing' ? 'fab' : ''}" onclick="navigate('${r}');return false">
      <b style="font-size:20px">${i}</b><span class="navlabel">${t}</span></a>`;
  }).join('');
}

function openDrawer() {
  $('#drawer').classList.add('open');
  $('#ov').classList.add('on');
}
function closeAll() {
  $('#drawer').classList.remove('open');
  $('#sheet').classList.remove('open');
  $('#ov').classList.remove('on');
}
function toggleTheme() {
  const a = ['royal', 'midnight', 'ocean', 'indigo'];
  const n = a[(a.indexOf(document.documentElement.dataset.theme) + 1) % a.length];
  document.documentElement.dataset.theme = n;
  localStorage.setItem('billora_theme', n);
  toast('Theme: ' + n);
}
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('billora_theme', t);
  toast('Theme changed');
  closeAll();
}

function drawer() {
  const links = [
    ['home', '⌂', 'Dashboard'],
    ['billing', '▣', 'New Bill (POS)'],
    ['invoices', '▤', 'All Bills'],
    ['products', '▦', 'Products & Services'],
    ['customers', '♙', 'Customers'],
    ['purchase', '⬇', 'Purchase / Stock In'],
    ['reports', '▥', 'Reports'],
    ['settings', '⚙', 'Business & Print'],
    ['users', '👤', 'Users']
  ];
  const user = db.currentUser;
  $('#drawer').innerHTML = `
    <div class="dh">
      <a class="logo"><span class="logo-mark">B</span><i class="wm">bill<span>ora</span></i></a>
      <button class="ib" onclick="closeAll()">✕</button>
    </div>
    <div class="card panel" style="background:var(--hero);color:#fff;padding:14px">
      <small>LOGGED IN</small>
      <h3 style="margin:4px 0">${esc(user?.name || 'Guest')}</h3>
      <p style="opacity:.8;font-size:12px">${user?.role || ''} · ${esc(db.business.name)}</p>
    </div>
    ${links.map(([r, i, t]) => `<a href="#${r}" onclick="navigate('${r}');closeAll();return false">${i}　${t}</a>`).join('')}
    <h5>APPEARANCE</h5>
    <div class="themes">
      <button class="sw" onclick="setTheme('royal')">🔵 Royal</button>
      <button class="sw" onclick="setTheme('midnight')">🌙 Midnight</button>
      <button class="sw" onclick="setTheme('ocean')">🌊 Ocean</button>
      <button class="sw" onclick="setTheme('indigo')">🟣 Indigo</button>
    </div>
    <button class="btn o w" style="margin-top:18px" onclick="logout()">Logout</button>
    <p class="muted" style="font-size:11px;margin:16px 5px">Billora POS Demo · Data stays on this device</p>`;
}

function navigate(r) {
  if (r === 'more') {
    openDrawer();
    return;
  }
  route = r;
  searchTerm = '';
  if (r === 'billing') {
    // keep cart
  } else {
    // optional: clear cart when leaving billing
  }
  render();
  location.hash = r;
}

function head(title, sub, btn = '') {
  return `<div class="pagehead"><div><h1>${title}</h1><p>${sub}</p></div>${btn}</div>`;
}
function card(title, body, extra = '') {
  return `<section class="card panel"><div class="row"><h3>${title}</h3>${extra}</div>${body}</section>`;
}
function empty(t, d) {
  return `<div class="emptybox"><b>${t}</b>${d}</div>`;
}

/* ---------- HOME ---------- */
function home() {
  const recent = [...db.invoices].filter(x => x.type !== 'purchase').slice(-6).reverse();
  const monthKey = today().slice(0, 7);
  const monthInvs = db.invoices.filter(x => x.date?.slice(0, 7) === monthKey && x.type !== 'purchase');
  return `
    ${head('Good day 👋', `Business overview · ${fmt(today())} · ${esc(db.currentUser?.name || '')}`,
      `<button class="btn b" onclick="navigate('billing')">＋ New Bill</button>`)}
    <div class="stats">
      <div class="stat"><span class="ico">↗</span><small>Collected</small><strong>${money(paid())}</strong><span class="trend">Paid bills</span></div>
      <div class="stat"><span class="ico">◷</span><small>Outstanding</small><strong>${money(due())}</strong><span class="trend" style="color:var(--bad)">Pending</span></div>
      <div class="stat"><span class="ico">▤</span><small>Total bills</small><strong>${db.invoices.filter(x => x.type !== 'purchase').length}</strong><span class="trend">${monthInvs.length} this month</span></div>
      <div class="stat"><span class="ico">▦</span><small>Items</small><strong>${db.products.length}</strong><span class="trend">${db.products.filter(p => p.stock < 10).length} low stock</span></div>
    </div>
    ${card('Quick actions', `
      <div class="quick">
        <button onclick="navigate('billing')"><b>▣</b>New Bill<span>Touch billing</span></button>
        <button onclick="openForm('product')"><b>▦</b>Add Item<span>Product / service</span></button>
        <button onclick="navigate('purchase')"><b>⬇</b>Purchase<span>Stock in</span></button>
        <button onclick="navigate('reports')"><b>▥</b>Reports<span>Sales summary</span></button>
      </div>`)}
    ${card('Recent bills', recent.length ? billTable(recent) : empty('No bills yet', 'Start by creating a new bill.'),
      `<a onclick="navigate('invoices')">View all →</a>`)}`;
}

/* ---------- BILLING (POS) ---------- */
function billing() {
  const cats = db.categories;
  const items = db.products.filter(p => {
    if (activeCat !== 'all' && p.categoryId !== activeCat) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q) || (p.sku || '').toLowerCase().includes(q);
    }
    return true;
  });

  return `
    ${head('Touch Billing', 'Tap items · Barcode ready · Fast checkout',
      `<button class="btn o sm" onclick="clearCart()">Clear cart</button>`)}
    <div class="pos-wrap">
      <div class="pos-left">
        <div class="barcode-row">
          <input id="barcodeInput" class="search" style="max-width:100%;flex:1" placeholder="Scan barcode or search item…" 
            value="${esc(searchTerm)}" 
            oninput="onBarcodeInput(this.value)" 
            onkeydown="if(event.key==='Enter'){event.preventDefault();handleBarcodeEnter(this.value)}">
          <button class="btn b" onclick="document.getElementById('barcodeInput').focus()">🔍</button>
        </div>
        <div class="cat-scroll">
          <button class="cat-btn ${activeCat === 'all' ? 'on' : ''}" onclick="setCat('all')">All</button>
          ${cats.map(c => `<button class="cat-btn ${activeCat === c.id ? 'on' : ''}" onclick="setCat('${c.id}')">${esc(c.name)}</button>`).join('')}
          <button class="cat-btn" onclick="openForm('category')">＋</button>
        </div>
        <div class="item-grid">
          ${items.length ? items.map(p => {
            const oos = p.stock <= 0;
            return `<div class="item-card ${oos ? 'oos' : ''}" onclick="addToCart('${p.id}')">
              <div class="ic">${esc((p.name || '?')[0])}</div>
              <h4>${esc(p.name)}</h4>
              <div class="pr">${money(p.price)}</div>
              <div class="stk">${oos ? 'Out of stock' : 'Stock: ' + p.stock}</div>
            </div>`;
          }).join('') : empty('No items', 'Add products or change category.')}
        </div>
      </div>
      <div class="pos-right">
        <div class="cart-box">
          <div class="cart-head">
            <div class="row">
              <h3>Current Bill</h3>
              <small>${cart.length} items</small>
            </div>
          </div>
          <div class="cart-body" id="cartBody">
            ${cart.length ? cart.map((line, idx) => `
              <div class="cart-line">
                <div class="name">${esc(line.name)}<small>${money(line.price)} × ${line.qty}</small></div>
                <div class="qty-ctrl">
                  <button onclick="changeQty(${idx},-1)">−</button>
                  <span>${line.qty}</span>
                  <button onclick="changeQty(${idx},1)">＋</button>
                </div>
                <b style="min-width:60px;text-align:right">${money(line.qty * line.price)}</b>
              </div>`).join('') : '<p class="muted" style="text-align:center;padding:24px 8px">Tap items to add</p>'}
          </div>
          <div class="cart-foot">
            <div class="bill-meta">
              <select id="billCust" onchange="billCustomer=this.value">
                ${db.customers.map(c => `<option value="${c.id}" ${c.id === billCustomer ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              </select>
              <input type="number" id="billDisc" min="0" value="${billDiscount}" placeholder="Discount ₹" oninput="billDiscount=+this.value||0;updateCartUI()">
            </div>
            <div class="bill-meta">
              <input type="number" id="billTaxIn" min="0" max="100" value="${billTax}" placeholder="Tax %" oninput="billTax=+this.value||0;updateCartUI()">
              <input type="text" id="billNote" value="${esc(billNotes)}" placeholder="Notes" oninput="billNotes=this.value">
            </div>
            <div class="cart-row"><span>Subtotal</span><b id="cSub">${money(cartSub())}</b></div>
            <div class="cart-row"><span>Tax (${billTax}%)</span><b id="cTax">${money(cartSub() * billTax / 100)}</b></div>
            <div class="cart-row"><span>Discount</span><b id="cDisc">− ${money(billDiscount)}</b></div>
            <div class="cart-row grand"><span>Total</span><b id="cTotal">${money(cartTotal())}</b></div>
            <div class="cart-actions">
              <button class="btn o" onclick="saveBill(false)" ${!cart.length ? 'disabled' : ''}>Save</button>
              <button class="btn b" onclick="saveBill(true)" ${!cart.length ? 'disabled' : ''}>Save & Print</button>
            </div>
            <div class="cart-actions" style="margin-top:8px">
              <button class="btn o sm" onclick="printKOT()" ${!cart.length || !db.business.kotEnabled ? 'disabled' : ''}>KOT</button>
              <button class="btn o sm" onclick="saveBill(true,true)" ${!cart.length ? 'disabled' : ''}>Double Print</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function setCat(id) {
  activeCat = id;
  searchTerm = '';
  render();
  setTimeout(() => $('#barcodeInput')?.focus(), 50);
}
function onBarcodeInput(v) {
  searchTerm = v;
  // live filter only when not scanning fast
  if (v.length < 6) renderBillingPartial();
}
function handleBarcodeEnter(v) {
  const code = (v || '').trim();
  if (!code) return;
  const p = db.products.find(x => x.barcode === code || x.sku === code || x.id === code);
  if (p) {
    addToCart(p.id);
    searchTerm = '';
    const inp = $('#barcodeInput');
    if (inp) { inp.value = ''; inp.focus(); }
    toast('Added: ' + p.name);
  } else {
    // filter by name
    searchTerm = code;
    render();
    toast('Item not found by barcode');
  }
}
function addToCart(pid) {
  const p = product(pid);
  if (!p) return;
  if (p.stock <= 0) { toast('Out of stock'); return; }
  const existing = cart.find(x => x.productId === pid);
  if (existing) {
    if (existing.qty + 1 > p.stock) { toast('Not enough stock'); return; }
    existing.qty += 1;
  } else {
    cart.push({ productId: pid, name: p.name, qty: 1, price: p.price, unit: p.unit || 'Nos' });
  }
  updateCartUI();
  toast('+ ' + p.name);
}
function changeQty(idx, delta) {
  const line = cart[idx];
  if (!line) return;
  const p = product(line.productId);
  const newQ = line.qty + delta;
  if (newQ <= 0) {
    cart.splice(idx, 1);
  } else if (p && newQ > p.stock) {
    toast('Stock limit');
    return;
  } else {
    line.qty = newQ;
  }
  updateCartUI();
}
function clearCart() {
  cart = [];
  billDiscount = 0;
  billNotes = '';
  updateCartUI();
  toast('Cart cleared');
}
function updateCartUI() {
  // re-render only cart side if possible, else full
  if (route === 'billing') render();
}
function saveBill(doPrint, forceDouble = false) {
  if (!cart.length) { toast('Cart empty'); return; }
  // stock check
  for (const line of cart) {
    const p = product(line.productId);
    if (p && line.qty > p.stock) {
      toast('Insufficient stock: ' + p.name);
      return;
    }
  }
  const inv = {
    id: nextBillNo(),
    customerId: billCustomer || 'WALKIN',
    date: today(),
    time: nowTime(),
    items: cart.map(x => ({ productId: x.productId, name: x.name, qty: x.qty, price: x.price })),
    tax: billTax,
    discount: billDiscount,
    status: 'paid',
    notes: billNotes,
    userId: db.currentUser?.id || 'U1',
    type: 'sale'
  };
  // deduct stock
  inv.items.forEach(it => {
    const p = product(it.productId);
    if (p && p.stock < 900) p.stock = Math.max(0, p.stock - it.qty); // services keep high stock
  });
  db.invoices.push(inv);
  save();
  toast('Bill ' + inv.id + ' saved');
  if (doPrint) {
    viewBill(inv.id, true, forceDouble || db.business.doublePrint);
  } else {
    clearCart();
    render();
  }
}
function printKOT() {
  if (!cart.length) return;
  const html = `
    <div class="kot-paper" id="printarea">
      <h3>*** KOT ***</h3>
      <p class="center">${esc(db.business.name)}</p>
      <p class="center">${today()} ${nowTime()}</p>
      <hr class="sep">
      <table>
        ${cart.map(l => `<tr><td>${esc(l.name)}</td><td style="text-align:right">${l.qty}</td></tr>`).join('')}
      </table>
      <hr class="sep">
      <p class="center">Token / Table: —</p>
      <p class="center">${esc(db.currentUser?.name || '')}</p>
    </div>`;
  openPrintWindow(html, 'KOT');
}

/* ---------- BILLS LIST ---------- */
function invoices() {
  const list = db.invoices
    .filter(x => x.type !== 'purchase')
    .filter(x => (filter === 'all' || x.status === filter) &&
      (`${x.id} ${customer(x.customerId).name}`).toLowerCase().includes(searchTerm.toLowerCase()))
    .slice().reverse();

  return `
    ${head('Bills', 'All sales bills', `<button class="btn b" onclick="navigate('billing')">＋ New Bill</button>`)}
    <div class="chips w">
      <button class="${filter === 'all' ? 'on' : ''}" onclick="filter='all';render()">All</button>
      <button class="${filter === 'paid' ? 'on' : ''}" onclick="filter='paid';render()">Paid</button>
      <button class="${filter === 'unpaid' ? 'on' : ''}" onclick="filter='unpaid';render()">Unpaid</button>
    </div>
    <input class="search" placeholder="Search bill or customer…" value="${esc(searchTerm)}"
      oninput="searchTerm=this.value;render()">
    ${card('Bill register', list.length ? billTable(list) : empty('No bills', 'Create a new bill from Billing.'))}`;
}

function billTable(arr) {
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>Bill</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
    <tbody>${arr.map(x => `
      <tr>
        <td><b>${x.id}</b></td>
        <td>${esc(customer(x.customerId).name)}</td>
        <td>${fmt(x.date)} ${x.time || ''}</td>
        <td><b>${money(total(x))}</b></td>
        <td><span class="pill ${x.status}">${x.status}</span></td>
        <td><button class="iconbtn" onclick="viewBill('${x.id}')">View</button></td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

/* ---------- VIEW / PRINT BILL ---------- */
function viewBill(id, autoPrint = false, doublePrint = false) {
  const x = db.invoices.find(i => i.id === id);
  if (!x) return;
  const c = customer(x.customerId);
  const b = db.business;
  const sizeClass = b.printSize === '58' ? 'thermal58' : (b.printSize === '80' ? 'thermal80' : '');
  const sub = x.items.reduce((s, i) => s + i.qty * i.price, 0);
  const taxAmt = sub * (x.tax || 0) / 100;

  const paper = `
    <div class="invoice-paper ${sizeClass}" id="printarea">
      <div class="center">
        <h2>${esc(b.name)}</h2>
        <p style="margin:0;font-size:11px">${esc(b.address || '')}</p>
        <p style="margin:2px 0;font-size:11px">${esc(b.phone || '')}${b.email ? ' · ' + esc(b.email) : ''}</p>
        ${b.gst && b.showGst ? `<p style="margin:2px 0;font-size:11px">GSTIN: ${esc(b.gst)}</p>` : ''}
        ${b.headerText ? `<p style="margin:4px 0;font-size:11px">${esc(b.headerText)}</p>` : ''}
      </div>
      <hr class="sep">
      <div style="display:flex;justify-content:space-between;font-size:12px">
        <div>
          <b>${x.id}</b><br>
          ${fmt(x.date)} ${x.time || ''}
        </div>
        <div class="right">
          ${esc(c.name)}<br>
          ${esc(c.phone || '')}
        </div>
      </div>
      <hr class="sep">
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th class="right">Amt</th></tr></thead>
        <tbody>
          ${x.items.map(i => `<tr>
            <td>${esc(i.name)}</td>
            <td>${i.qty}</td>
            <td>${money(i.price)}</td>
            <td class="right">${money(i.qty * i.price)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <hr class="sep">
      <div style="font-size:12px">
        <div class="row"><span>Subtotal</span><b>${money(sub)}</b></div>
        <div class="row"><span>Tax (${x.tax || 0}%)</span><b>${money(taxAmt)}</b></div>
        <div class="row"><span>Discount</span><b>− ${money(x.discount || 0)}</b></div>
        <div class="row total" style="margin-top:6px"><span>TOTAL</span><b>${money(total(x))}</b></div>
      </div>
      <hr class="sep">
      <p class="center" style="font-size:11px;margin:6px 0">${esc(x.notes || b.footerText || 'Thank you!')}</p>
      <p class="center" style="font-size:10px;color:#666">Cashier: ${esc((db.users.find(u => u.id === x.userId) || {}).name || '')}</p>
    </div>`;

  $('#sheet-body').innerHTML = `
    <div class="row" style="margin-bottom:10px">
      <div><small class="muted">BILL</small><h3>${x.id}</h3></div>
      <span class="pill ${x.status}">${x.status}</span>
    </div>
    ${paper}
    <div class="actions" style="margin-top:14px">
      <button class="btn b" onclick="doPrintBill()">Print / PDF</button>
      <button class="btn o" onclick="togglePaid('${x.id}')">Mark ${x.status === 'paid' ? 'unpaid' : 'paid'}</button>
      <button class="btn o" onclick="shareBill('${x.id}')">Share</button>
      <button class="btn o" onclick="downloadPDF('${x.id}')">Save PDF</button>
    </div>`;
  $('#sheet').classList.add('open');
  $('#ov').classList.add('on');

  if (autoPrint) {
    setTimeout(() => {
      doPrintBill();
      if (doublePrint) setTimeout(() => doPrintBill(), 600);
      clearCart();
      closeAll();
      render();
    }, 300);
  }
}

function doPrintBill() {
  const area = $('#printarea');
  if (!area) return;
  openPrintWindow(area.outerHTML, 'Bill');
}

function openPrintWindow(html, title) {
  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) { toast('Allow popups for print'); return; }
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body{font-family:'Courier New',monospace;padding:8px;color:#111;margin:0}
      .invoice-paper,.kot-paper{max-width:100%;margin:0 auto}
      .thermal58{max-width:260px!important;font-size:12px}
      .thermal80{max-width:340px!important;font-size:12.5px}
      .center{text-align:center}.right{text-align:right}
      table{width:100%;border-collapse:collapse}
      td,th{padding:3px 2px;border-bottom:1px dashed #ccc;font-size:12px}
      .sep{border:0;border-top:1px dashed #999;margin:6px 0}
      .total{font-size:14px;font-weight:bold}
      .row{display:flex;justify-content:space-between}
      @media print{body{padding:0}}
    </style></head><body>${html}
    <script>window.onload=function(){setTimeout(function(){window.print();},200)}</script>
    </body></html>`);
  w.document.close();
}

function togglePaid(id) {
  const x = db.invoices.find(i => i.id === id);
  if (!x) return;
  x.status = x.status === 'paid' ? 'unpaid' : 'paid';
  save();
  closeAll();
  render();
  toast('Status updated');
}

function shareBill(id) {
  const x = db.invoices.find(i => i.id === id);
  if (!x) return;
  const c = customer(x.customerId);
  const msg = `Bill ${x.id} from ${db.business.name}\nAmount: ${money(total(x))}\nCustomer: ${c.name}\nStatus: ${x.status}`;
  if (navigator.share) {
    navigator.share({ title: 'Bill ' + x.id, text: msg }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(msg);
    toast('Copied to clipboard');
  } else toast(msg);
}

function downloadPDF(id) {
  // Simple approach: open print dialog so user can "Save as PDF"
  viewBill(id, false);
  setTimeout(() => {
    toast('Use Print → Save as PDF in the print dialog');
    doPrintBill();
  }, 400);
}

/* ---------- PRODUCTS ---------- */
function products() {
  return `
    ${head('Products & Services', 'Catalogue with categories & barcode',
      `<button class="btn b" onclick="openForm('product')">＋ Add Item</button>`)}
    ${card('Catalogue', db.products.length ? `
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Name</th><th>SKU / Barcode</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
        <tbody>${db.products.map(p => {
          const cat = db.categories.find(c => c.id === p.categoryId);
          return `<tr>
            <td><b>${esc(p.name)}</b></td>
            <td>${esc(p.sku || '')}<br><small class="muted">${esc(p.barcode || '')}</small></td>
            <td>${esc(cat?.name || '—')}</td>
            <td>${money(p.price)}</td>
            <td style="color:${p.stock < 10 ? 'var(--bad)' : 'inherit'}">${p.stock}</td>
            <td><button class="iconbtn" onclick="editProduct('${p.id}')">Edit</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>` : empty('No items', 'Add your first product or service.'))}
    ${card('Categories', `
      <div class="chips w">
        ${db.categories.map(c => `<span class="pill" style="margin:4px">${esc(c.name)}
          <button class="iconbtn" style="margin-left:6px;padding:2px 6px" onclick="deleteCategory('${c.id}')">×</button></span>`).join('')}
        <button class="btn o sm" onclick="openForm('category')">＋ Category</button>
      </div>`)}`;
}

function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  db.categories = db.categories.filter(c => c.id !== id);
  db.products.forEach(p => { if (p.categoryId === id) p.categoryId = ''; });
  save();
  render();
  toast('Category removed');
}

/* ---------- CUSTOMERS ---------- */
function customers() {
  return `
    ${head('Customers', 'Customer directory',
      `<button class="btn b" onclick="openForm('customer')">＋ Add</button>`)}
    ${card('List', db.customers.filter(c => c.id !== 'WALKIN').length ? `
      <div class="list">${db.customers.filter(c => c.id !== 'WALKIN').map(c => `
        <div class="row" style="padding:11px 0;border-bottom:1px solid var(--ln)">
          <div class="row" style="justify-content:flex-start;gap:10px">
            <div class="av">${esc((c.name || 'C')[0])}</div>
            <div><b>${esc(c.name)}</b><div class="muted" style="font-size:12px">${esc(c.phone || '')} · ${esc(c.email || '')}</div></div>
          </div>
          <button class="iconbtn" onclick="editCustomer('${c.id}')">Edit</button>
        </div>`).join('')}</div>` : empty('No customers', 'Add customers for faster billing.'))}`;
}

/* ---------- PURCHASE / STOCK ---------- */
function purchase() {
  return `
    ${head('Purchase / Stock In', 'Add stock from suppliers',
      `<button class="btn b" onclick="openPurchaseForm()">＋ New Purchase</button>`)}
    ${card('Recent purchases', db.purchases.length ? `
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Ref</th><th>Date</th><th>Items</th><th>Total</th></tr></thead>
        <tbody>${[...db.purchases].reverse().map(p => `
          <tr>
            <td><b>${p.id}</b></td>
            <td>${fmt(p.date)}</td>
            <td>${p.items.length} items</td>
            <td>${money(p.items.reduce((s, i) => s + i.qty * i.cost, 0))}</td>
          </tr>`).join('')}</tbody>
      </table></div>` : empty('No purchases yet', 'Record stock purchases here.'))}
    ${card('Low stock alert', `
      <div class="list">${db.products.filter(p => p.stock < 15).map(p => `
        <div class="row" style="padding:8px 0;border-bottom:1px solid var(--ln)">
          <span>${esc(p.name)}</span>
          <b style="color:var(--bad)">${p.stock} left</b>
        </div>`).join('') || '<p class="muted">All good</p>'}</div>`)}`;
}

function openPurchaseForm() {
  $('#sheet-body').innerHTML = `
    <h3>New Purchase</h3>
    <p class="muted">Add stock quantity & cost</p>
    <form onsubmit="savePurchase(event)">
      <label class="formlabel">Supplier / Note</label>
      <input name="note" placeholder="Optional">
      <div id="purLines">${purchaseLine()}</div>
      <button type="button" class="iconbtn" onclick="addPurLine()">＋ Add line</button>
      <button class="btn b w" style="margin-top:14px">Save Purchase</button>
    </form>`;
  $('#sheet').classList.add('open');
  $('#ov').classList.add('on');
}
function purchaseLine() {
  return `<div class="fieldgrid purline" style="padding:10px 0;border-bottom:1px solid var(--ln)">
    <div class="full">
      <label class="formlabel">Item</label>
      <select class="psel">${db.products.map(p => `<option value="${p.id}">${esc(p.name)} (Stock: ${p.stock})</option>`).join('')}</select>
    </div>
    <div><label class="formlabel">Qty</label><input class="pqty" type="number" min="1" value="1"></div>
    <div><label class="formlabel">Cost ₹</label><input class="pcost" type="number" min="0" step="0.01" value="0"></div>
  </div>`;
}
function addPurLine() {
  $('#purLines').insertAdjacentHTML('beforeend', purchaseLine());
}
function savePurchase(e) {
  e.preventDefault();
  const lines = [...document.querySelectorAll('.purline')].map(el => {
    const pid = el.querySelector('.psel').value;
    const qty = +el.querySelector('.pqty').value || 0;
    const cost = +el.querySelector('.pcost').value || 0;
    return { productId: pid, qty, cost };
  }).filter(x => x.qty > 0);
  if (!lines.length) { toast('Add items'); return; }
  lines.forEach(l => {
    const p = product(l.productId);
    if (p) p.stock += l.qty;
  });
  const pur = {
    id: 'PUR-' + uid(),
    date: today(),
    note: e.target.note.value,
    items: lines
  };
  db.purchases.push(pur);
  save();
  closeAll();
  render();
  toast('Purchase saved & stock updated');
}

/* ---------- REPORTS ---------- */
function reports() {
  const now = new Date();
  let from = today(), to = today();
  if (reportRange === 'week') {
    const d = new Date(); d.setDate(d.getDate() - 6);
    from = d.toISOString().slice(0, 10);
  } else if (reportRange === 'month') {
    from = today().slice(0, 8) + '01';
  } else if (reportRange === 'all') {
    from = '2020-01-01';
  }

  const sales = db.invoices.filter(x => x.type !== 'purchase' && x.date >= from && x.date <= to);
  const totalSales = sales.reduce((s, x) => s + total(x), 0);
  const paidAmt = sales.filter(x => x.status === 'paid').reduce((s, x) => s + total(x), 0);
  const unpaidAmt = totalSales - paidAmt;

  // last 7 days chart
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const key = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      v: db.invoices.filter(x => x.date === key && x.type !== 'purchase').reduce((s, x) => s + total(x), 0)
    };
  });
  const max = Math.max(1, ...days.map(d => d.v));

  return `
    ${head('Reports', 'Sales tracking by period')}
    <div class="chips w">
      <button class="${reportRange === 'today' ? 'on' : ''}" onclick="reportRange='today';render()">Today</button>
      <button class="${reportRange === 'week' ? 'on' : ''}" onclick="reportRange='week';render()">This Week</button>
      <button class="${reportRange === 'month' ? 'on' : ''}" onclick="reportRange='month';render()">This Month</button>
      <button class="${reportRange === 'all' ? 'on' : ''}" onclick="reportRange='all';render()">All Time</button>
    </div>
    <div class="stats">
      <div class="stat"><small>Gross Sales</small><strong>${money(totalSales)}</strong></div>
      <div class="stat"><small>Collected</small><strong>${money(paidAmt)}</strong></div>
      <div class="stat"><small>Pending</small><strong>${money(unpaidAmt)}</strong></div>
      <div class="stat"><small>Bills</small><strong>${sales.length}</strong></div>
    </div>
    ${card('Last 7 days', `
      <div class="chart">${days.map(d => `
        <div class="barcol"><i style="height:${Math.max(4, d.v / max * 100)}%" title="${money(d.v)}"></i>
        <small>${d.label}</small></div>`).join('')}</div>`)}
    ${card('Top items (selected period)', (() => {
      const map = {};
      sales.forEach(inv => inv.items.forEach(it => {
        map[it.name] = (map[it.name] || 0) + it.qty * it.price;
      }));
      const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
      return top.length ? top.map(([n, v]) => `
        <div class="row" style="padding:8px 0;border-bottom:1px solid var(--ln)">
          <span>${esc(n)}</span><b>${money(v)}</b>
        </div>`).join('') : '<p class="muted">No data</p>';
    })())}`;
}

/* ---------- SETTINGS ---------- */
function settings() {
  const b = db.business;
  return `
    ${head('Business & Print Settings', 'Header, footer, thermal size, options')}
    <form class="card panel" onsubmit="saveSettings(event)">
      <div class="fieldgrid">
        <div class="full"><label class="formlabel">Business Name</label>
          <input name="name" value="${esc(b.name)}" required></div>
        <div><label class="formlabel">Phone</label>
          <input name="phone" value="${esc(b.phone)}"></div>
        <div><label class="formlabel">Email</label>
          <input name="email" type="email" value="${esc(b.email)}"></div>
        <div class="full"><label class="formlabel">Address</label>
          <textarea name="address" rows="2">${esc(b.address)}</textarea></div>
        <div class="full"><label class="formlabel">GSTIN</label>
          <input name="gst" value="${esc(b.gst)}" placeholder="15-character GSTIN"></div>
        <div class="full"><label class="formlabel">Extra Header Text</label>
          <input name="headerText" value="${esc(b.headerText || '')}" placeholder="Optional line under address"></div>
        <div class="full"><label class="formlabel">Footer / Thank you text</label>
          <input name="footerText" value="${esc(b.footerText || '')}"></div>
        <div><label class="formlabel">Print Size</label>
          <select name="printSize">
            <option value="58" ${b.printSize === '58' ? 'selected' : ''}>2 inch (58mm Thermal)</option>
            <option value="80" ${b.printSize === '80' ? 'selected' : ''}>3 inch (80mm Thermal)</option>
            <option value="A4" ${b.printSize === 'A4' ? 'selected' : ''}>Normal / A4</option>
          </select></div>
        <div style="padding-top:18px">
          <label><input type="checkbox" name="showGst" ${b.showGst !== false ? 'checked' : ''}> Show GSTIN on bill</label><br>
          <label><input type="checkbox" name="doublePrint" ${b.doublePrint ? 'checked' : ''}> Default Double Print</label><br>
          <label><input type="checkbox" name="kotEnabled" ${b.kotEnabled !== false ? 'checked' : ''}> Enable KOT</label>
        </div>
      </div>
      <button class="btn b w">Save Settings</button>
    </form>
    ${card('Data', `
      <p class="muted" style="font-size:13px">All data is stored in this browser (localStorage). Export regularly.</p>
      <div class="actions">
        <button class="btn o sm" onclick="exportData()">Export Backup (JSON)</button>
        <button class="btn o sm" onclick="document.getElementById('importfile').click()">Import Backup</button>
        <input id="importfile" class="hide" type="file" accept="application/json" onchange="importData(event)">
        <button class="btn sm" style="background:#ffe3e3;color:#a22" onclick="resetData()">Reset Demo</button>
      </div>`)}`;
}

function saveSettings(e) {
  e.preventDefault();
  const f = e.target;
  db.business = {
    ...db.business,
    name: f.name.value,
    phone: f.phone.value,
    email: f.email.value,
    address: f.address.value,
    gst: f.gst.value,
    headerText: f.headerText.value,
    footerText: f.footerText.value,
    printSize: f.printSize.value,
    showGst: f.showGst.checked,
    doublePrint: f.doublePrint.checked,
    kotEnabled: f.kotEnabled.checked,
    currency: 'INR'
  };
  save();
  render();
  toast('Settings saved');
}

/* ---------- USERS ---------- */
function users() {
  return `
    ${head('Users', 'Simple multi-user (local PIN)')}
    ${card('Registered users', `
      <div class="list">${db.users.map(u => `
        <div class="row" style="padding:12px 0;border-bottom:1px solid var(--ln)">
          <div>
            <b>${esc(u.name)}</b>
            <div class="muted" style="font-size:12px">${u.role} · PIN: ****</div>
          </div>
          <button class="iconbtn" onclick="editUser('${u.id}')">Edit</button>
        </div>`).join('')}</div>
      <button class="btn o sm" style="margin-top:12px" onclick="openForm('user')">＋ Add User</button>
      <p class="muted" style="font-size:12px;margin-top:12px">Default PIN for all demo users is <b>1234</b>. Change in edit.</p>`)}`;
}

function editUser(id) {
  openForm('user', id);
}

/* ---------- FORMS (sheet) ---------- */
function openForm(type, id = '') {
  let obj = {};
  if (type === 'customer') obj = db.customers.find(x => x.id === id) || {};
  if (type === 'product') obj = db.products.find(x => x.id === id) || {};
  if (type === 'user') obj = db.users.find(x => x.id === id) || {};
  if (type === 'category') obj = {};

  let body = '';
  if (type === 'customer') {
    body = `
      <label class="formlabel">Name</label><input name="name" required value="${esc(obj.name || '')}">
      <label class="formlabel">Phone</label><input name="phone" value="${esc(obj.phone || '')}">
      <label class="formlabel">Email</label><input name="email" type="email" value="${esc(obj.email || '')}">
      <label class="formlabel">Address</label><textarea name="address" rows="2">${esc(obj.address || '')}</textarea>`;
  } else if (type === 'product') {
    body = `
      <label class="formlabel">Name</label><input name="name" required value="${esc(obj.name || '')}">
      <label class="formlabel">SKU</label><input name="sku" value="${esc(obj.sku || '')}">
      <label class="formlabel">Barcode</label><input name="barcode" value="${esc(obj.barcode || '')}" placeholder="Scan or type">
      <label class="formlabel">Category</label>
      <select name="categoryId">
        <option value="">— None —</option>
        ${db.categories.map(c => `<option value="${c.id}" ${obj.categoryId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select>
      <label class="formlabel">Price ₹</label><input name="price" type="number" min="0" step="0.01" required value="${obj.price ?? ''}">
      <label class="formlabel">Stock</label><input name="stock" type="number" min="0" value="${obj.stock ?? 0}">
      <label class="formlabel">Unit</label><input name="unit" value="${esc(obj.unit || 'Nos')}" placeholder="Nos / Kg / Cup">`;
  } else if (type === 'category') {
    body = `<label class="formlabel">Category Name</label><input name="name" required placeholder="e.g. Beverages">`;
  } else if (type === 'user') {
    body = `
      <label class="formlabel">Name</label><input name="name" required value="${esc(obj.name || '')}">
      <label class="formlabel">Role</label>
      <select name="role">
        <option value="admin" ${obj.role === 'admin' ? 'selected' : ''}>Admin</option>
        <option value="cashier" ${obj.role === 'cashier' ? 'selected' : ''}>Cashier</option>
      </select>
      <label class="formlabel">PIN (4 digit)</label><input name="pin" type="password" maxlength="4" value="${esc(obj.pin || '1234')}" required>`;
  }

  $('#sheet-body').innerHTML = `
    <h3>${id ? 'Edit' : 'Add'} ${type === 'product' ? 'Item' : type}</h3>
    <form onsubmit="saveEntity(event,'${type}','${id}')">
      ${body}
      <button class="btn b w">Save</button>
    </form>`;
  $('#sheet').classList.add('open');
  $('#ov').classList.add('on');
}

function saveEntity(e, type, id) {
  e.preventDefault();
  const f = e.target;
  if (type === 'customer') {
    const o = { id: id || 'C' + uid(), name: f.name.value, phone: f.phone.value, email: f.email.value, address: f.address.value };
    const ix = db.customers.findIndex(x => x.id === id);
    if (ix >= 0) db.customers[ix] = o; else db.customers.push(o);
  } else if (type === 'product') {
    const o = {
      id: id || 'P' + uid(),
      name: f.name.value,
      sku: f.sku.value,
      barcode: f.barcode.value,
      categoryId: f.categoryId.value,
      price: +f.price.value,
      stock: +f.stock.value,
      unit: f.unit.value || 'Nos'
    };
    const ix = db.products.findIndex(x => x.id === id);
    if (ix >= 0) db.products[ix] = o; else db.products.push(o);
  } else if (type === 'category') {
    db.categories.push({ id: 'CAT' + uid(), name: f.name.value });
  } else if (type === 'user') {
    const o = { id: id || 'U' + uid(), name: f.name.value, role: f.role.value, pin: f.pin.value };
    const ix = db.users.findIndex(x => x.id === id);
    if (ix >= 0) db.users[ix] = o; else db.users.push(o);
  }
  save();
  closeAll();
  render();
  toast('Saved');
}

function editCustomer(id) { openForm('customer', id); }
function editProduct(id) { openForm('product', id); }

/* ---------- DATA ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'billora-backup-' + today() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Backup downloaded');
}
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const x = JSON.parse(r.result);
      if (!x.business || !Array.isArray(x.invoices)) throw Error();
      db = x;
      save();
      render();
      toast('Backup imported');
    } catch (err) {
      toast('Invalid file');
    }
  };
  r.readAsText(file);
}
function resetData() {
  if (confirm('Reset all data to demo?')) {
    db = structuredClone(seed);
    save();
    render();
    toast('Demo data restored');
  }
}

/* ---------- RENDER ---------- */
function render() {
  if (needLogin()) {
    showLogin();
    return;
  }
  nav();
  drawer();
  const views = {
    home, billing, invoices, products, customers,
    purchase, reports, settings, users
  };
  $('#app').innerHTML = (views[route] || home)();
  $('#foot').innerHTML = `
    <div class="fb">
      <b style="font:800 20px Sora;color:#fff">Billora</b>
      <p>Fast touch billing · Inventory · Thermal ready</p>
    </div>
    <div class="fbot">Demo · Data stays in this browser · © ${new Date().getFullYear()} Billora</div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (route === 'billing') {
    setTimeout(() => $('#barcodeInput')?.focus(), 100);
  }
}

function renderBillingPartial() {
  // lightweight re-filter (full render is fine for demo)
  render();
}

/* ---------- boot ---------- */
window.addEventListener('hashchange', () => {
  const r = location.hash.slice(1);
  if (r && r !== route && r !== 'more') {
    route = r;
    render();
  }
});

// Global barcode listener (when focused elsewhere)
document.addEventListener('keydown', e => {
  if (route !== 'billing') return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  // simple buffer for scanner
  if (e.key === 'Enter' && barcodeBuffer.length > 2) {
    handleBarcodeEnter(barcodeBuffer);
    barcodeBuffer = '';
  } else if (e.key.length === 1) {
    barcodeBuffer += e.key;
    clearTimeout(window._bcTimer);
    window._bcTimer = setTimeout(() => { barcodeBuffer = ''; }, 80);
  }
});

render();
