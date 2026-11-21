/* REPORTS: dashboard, all bills, sales/profit reports, CSV export */
let RG='today';
const sod=d=>{d=new Date(d);d.setHours(0,0,0,0);return d.getTime()};
function inRange(r){const n=Date.now(),t0=sod(n),m={today:t0,week:t0-6*864e5,month:t0-29*864e5,year:t0-364*864e5,all:0};return DB.d.bills.filter(b=>!b.cancelled&&b.t>=m[r])}
function summary(l){const s={n:l.length,gross:0,disc:0,tax:0,net:0,cost:0,Cash:0,UPI:0,Card:0,Credit:0},top={},cat={};
 l.forEach(b=>{s.gross+=b.sub;s.disc+=b.disc;s.tax+=b.tax;s.net+=b.total;s[b.pay]+=b.total;b.items.forEach(i=>{s.cost+=i.cost*i.qty;(top[i.name]=top[i.name]||{q:0,a:0}).q+=i.qty;top[i.name].a+=i.price*i.qty;cat[i.cat||'—']=(cat[i.cat||'—']||0)+i.price*i.qty})});
 s.profit=s.net-s.tax-s.cost;s.top=Object.entries(top).sort((a,b)=>b[1].q-a[1].q).slice(0,5);s.cat=Object.entries(cat).sort((a,b)=>b[1]-a[1]);return s}
V.home=()=>{const D=DB.d,s=summary(inRange('today')),low=D.prods.filter(p=>p.stock<=p.min).length;
 return `<div class="pagehead"><div><h1>${esc(D.set.name)}</h1><p>Aaj ka business ek nazar me</p></div></div>
 <div class="stats"><div class="stat"><small>Aaj ki sale</small><strong>${inr(s.net)}</strong></div><div class="stat"><small>Bills</small><strong>${s.n}</strong></div><div class="stat"><small>Profit</small><strong>${inr(s.profit)}</strong></div><div class="stat"><small>Low stock</small><strong>${low}</strong></div></div>
 <div class="quick" style="margin-top:14px"><button onclick="go('billing')"><b>🧾</b>New Bill</button><button onclick="go('products')"><b>📦</b>Products</button><button onclick="go('stock')"><b>🏬</b>Stock</button><button onclick="go('reports')"><b>📊</b>Reports</button></div>`};
V.bills=()=>`<div class="pagehead"><div><h1>All Bills</h1><p>${DB.d.bills.length} bills</p></div></div><div class="list">${DB.d.bills.map(b=>`<div class="card li" onclick="billView('${b.id}')"><div class="fl"><h4>#${b.no} ${b.cust?'• '+esc(b.cust):''}</h4><small class="muted">${fmtD(b.t)} • ${b.pay} • ${b.by}</small></div><div style="text-align:right"><b>${inr(b.total)}</b>${b.cancelled?'<br><span class="pill bad">Cancelled</span>':''}</div></div>`).join('')||'<div class="emptybox">Abhi koi bill nahi</div>'}</div>`;
function billView(id){const b=DB.d.bills.find(x=>x.id===id);openSheet(`<h3>Bill #${b.no}</h3>${b.items.map(i=>`<div class="ln"><span>${esc(i.name)} × ${i.qty}</span><b>${inr(i.qty*i.price)}</b></div>`).join('')}<div class="ln tt"><span>Total (${b.pay})</span><b>${inr(b.total)}</b></div>
 <div class="acts"><button class="btn b" onclick="Print.run(DB.d.bills.find(x=>x.id==='${id}'))">Print</button>${b.cancelled?'':`<button class="btn o danger" onclick="billCancel('${id}')">Cancel Bill</button>`}</div>`)}
function billCancel(id){if(!confirm('Bill cancel karein? Stock wapas aa jayega.'))return;const D=DB.d,b=D.bills.find(x=>x.id===id);b.cancelled=true;b.cancelBy='Owner';
 b.items.forEach(i=>{const p=D.prods.find(x=>x.id===i.id);if(p)p.stock+=i.qty});const c=D.custs.find(x=>x.id===b.custId);if(c&&b.pay==='Credit')c.due=Math.max(0,c.due-b.total);DB.save();closeAll();render()}
V.reports=()=>{const s=summary(inRange(RG));const R=(l,v)=>`<div class="ln"><span>${l}</span><b>${inr(v)}</b></div>`;
 return `<div class="pagehead"><div><h1>Reports</h1><p>Sales, profit aur payments</p></div><button class="btn o sm" onclick="exportCSV()">Excel/CSV</button></div>
 <div class="seg">${[['today','Today'],['week','7 Days'],['month','30 Days'],['year','Year'],['all','All']].map(r=>`<button class="${RG===r[0]?'on':''}" onclick="RG='${r[0]}';render()">${r[1]}</button>`).join('')}</div>
 <div class="stats"><div class="stat"><small>Net sales</small><strong>${inr(s.net)}</strong></div><div class="stat"><small>Bills</small><strong>${s.n}</strong></div><div class="stat"><small>Profit</small><strong>${inr(s.profit)}</strong></div><div class="stat"><small>Discount</small><strong>${inr(s.disc)}</strong></div></div>
 <div class="panel card"><h3>Payments</h3>${R('Cash',s.Cash)}${R('UPI',s.UPI)}${R('Card',s.Card)}${R('Credit',s.Credit)}${R('Gross sales',s.gross)}${R('GST collected',s.tax)}</div>
 <div class="panel card"><h3>Best selling</h3>${s.top.map(t=>`<div class="ln"><span>${esc(t[0])} × ${t[1].q}</span><b>${inr(t[1].a)}</b></div>`).join('')||'<p class="muted">Data nahi</p>'}</div>
 <div class="panel card"><h3>Category-wise</h3>${s.cat.map(c=>R(esc(c[0]),c[1])).join('')||'<p class="muted">Data nahi</p>'}</div>`};
function exportCSV(){const rows=[['Bill','Date','Customer','Payment','Subtotal','Discount','GST','Total','Status']].concat(DB.d.bills.map(b=>[b.no,new Date(b.t).toISOString(),b.cust,b.pay,b.sub,b.disc,b.tax,b.total,b.cancelled?'Cancelled':'OK']));
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'}));a.download='billora-sales.csv';a.click()}
