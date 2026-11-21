/* FAST BILLING: many parallel bills (tabs), touch POS, search/barcode, discount, GST, payment */
const newCart=()=>({id:uid(),items:[],disc:0,dtype:'amt',pay:'Cash',cust:'',q:'',cat:'All',note:''});
const TAB={l:[],i:0};
try{const s=JSON.parse(localStorage.getItem('billora_tabs'));if(s&&s.l&&s.l.length){TAB.l=s.l;TAB.i=Math.min(s.i,s.l.length-1)}}catch(e){}
if(!TAB.l.length)TAB.l=[newCart()];
let Cart=TAB.l[TAB.i];
const tabSave=()=>localStorage.setItem('billora_tabs',JSON.stringify(TAB));
function tabSet(i){TAB.i=i;Cart=TAB.l[i];tabSave();render()}
function tabNew(){TAB.l.push(newCart());tabSet(TAB.l.length-1)}
function tabDrop(){TAB.l.splice(TAB.i,1);if(!TAB.l.length)TAB.l.push(newCart());tabSet(Math.min(TAB.i,TAB.l.length-1));closeAll()}
function calc(items,disc,dtype){const sub=items.reduce((s,i)=>s+i.price*i.qty,0),d=Math.min(sub,dtype==='pct'?sub*disc/100:+disc||0),f=sub?1-d/sub:1,
 tax=items.reduce((s,i)=>s+i.price*i.qty*f*(i.gst||0)/100,0);return{sub,disc:d,tax,total:Math.round(sub-d+tax)}}
V.billing=()=>{const D=DB.d,bc=D.set.bcOn;return `<div class="pos">
 <div class="tabs">${TAB.l.map((c,i)=>{const n=c.items.reduce((s,x)=>s+x.qty,0);return `<button class="${i===TAB.i?'on':''}" onclick="tabSet(${i})">Bill ${i+1}${n?' • '+n:''}</button>`}).join('')}<button class="plus" onclick="tabNew()">＋ New Bill</button></div>
 <div class="row" style="gap:8px;align-items:flex-start"><div style="flex:1"><input id="bq" placeholder="${bc?'Search ya barcode scan karo…':'Search product…'}" value="${esc(Cart.q)}" oninput="Cart.q=this.value;billGrid()" onkeydown="if(event.key==='Enter')scanEnter()"></div>${bc?'<button class="ib" onclick="camScan()" aria-label="Scan">📷</button>':''}</div>
 <div class="chips">${['All',...D.cats].map(c=>`<button class="${Cart.cat===c?'on':''}" onclick="Cart.cat='${esc(c)}';render()">${esc(c)}</button>`).join('')}</div>
 <div class="grid" id="bgrid"></div></div><div id="cbar"></div>`};
AFTER.billing=()=>{billGrid();cartBar()};
function billGrid(){const D=DB.d,q=Cart.q.toLowerCase(),l=D.prods.filter(p=>(Cart.cat==='All'||p.cat===Cart.cat)&&(!q||p.name.toLowerCase().includes(q)||(D.set.bcOn&&p.bc&&p.bc.toLowerCase().includes(q))));
 $('#bgrid').innerHTML=l.map(p=>`<div class="card pc" onclick="addItem('${p.id}')"><div class="pi">${p.img?`<img src="${esc(p.img)}" loading="lazy">`:`<div class="ph">${esc(p.name[0])}</div>`}<span class="stkb">${p.stock<=0?'Out':p.stock}</span></div><div class="pb"><h4>${esc(p.name)}</h4><div class="pr"><b>${inr(p.price)}</b><span class="add">+</span></div></div></div>`).join('')||'<div class="emptybox" style="grid-column:1/-1">Koi product nahi mila</div>'}
function scanEnter(){const p=find(Cart.q);if(p){addItem(p.id);Cart.q='';$('#bq').value='';billGrid()}}
function addItem(id){const p=DB.d.prods.find(x=>x.id===id),c=Cart.items.find(i=>i.id===id);if(p.stock<=(c?c.qty:0))return toast('Stock khatam: '+p.name);
 c?c.qty++:Cart.items.push({id,name:p.name,price:p.price,cost:p.cost,gst:p.gst,cat:p.cat,qty:1});cartBar()}
function cartBar(){tabSave();const el=$('#cbar');if(!el)return;const n=Cart.items.reduce((s,i)=>s+i.qty,0),t=calc(Cart.items,Cart.disc,Cart.dtype).total;
 el.innerHTML=n?`<div class="cartbar" onclick="cartSheet()"><span>🛒 ${n} items</span><span>${inr(t)} ›</span></div>`:''}
function qtyChg(id,d){const i=Cart.items.find(x=>x.id===id),p=DB.d.prods.find(x=>x.id===id);if(d>0&&i.qty>=p.stock)return toast('Itna stock nahi hai');i.qty+=d;if(i.qty<=0)Cart.items=Cart.items.filter(x=>x!==i);cartBar();Cart.items.length?cartSheet():closeAll()}
function cartSheet(){const D=DB.d,t=calc(Cart.items,Cart.disc,Cart.dtype);
 openSheet(`<h3>Bill ${TAB.i+1}</h3>${Cart.items.map(i=>`<div class="cl"><div class="fl"><h4>${esc(i.name)}</h4><small>${inr(i.price)}${i.gst?' • GST '+i.gst+'%':''}</small></div><div class="qty"><button onclick="qtyChg('${i.id}',-1)">−</button><span>${i.qty}</span><button onclick="qtyChg('${i.id}',1)">+</button></div><b>${inr(i.price*i.qty)}</b></div>`).join('')}
 <div class="fg" style="margin-top:12px"><div><label class="lb">Discount</label><input type="number" min="0" value="${Cart.disc||''}" onchange="Cart.disc=+this.value;cartSheet();cartBar()"></div><div><label class="lb">Type</label><select onchange="Cart.dtype=this.value;cartSheet();cartBar()"><option value="amt" ${Cart.dtype==='amt'?'selected':''}>₹ Amount</option><option value="pct" ${Cart.dtype==='pct'?'selected':''}>% Percent</option></select></div></div>
 <label class="lb">Customer (optional)</label><select onchange="Cart.cust=this.value"><option value="">Walk-in</option>${D.custs.map(c=>`<option value="${c.id}" ${Cart.cust===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
 <label class="lb">Note / Table (KOT ke liye)</label><input value="${esc(Cart.note)}" onchange="Cart.note=this.value" placeholder="Table 3">
 <div class="seg">${['Cash','UPI','Card','Credit'].map(p=>`<button class="${Cart.pay===p?'on':''}" onclick="Cart.pay='${p}';tabSave();cartSheet()">${p}</button>`).join('')}</div>
 <div class="ln"><span>Subtotal</span><b>${inr(t.sub)}</b></div>${t.disc?`<div class="ln ok"><span>Discount</span><b>-${inr(t.disc)}</b></div>`:''}${D.set.gst?`<div class="ln"><span>GST</span><b>${inr(t.tax)}</b></div>`:''}<div class="ln tt"><span>Grand Total</span><b>${inr(t.total)}</b></div>
 <div class="acts"><button class="btn b" onclick="saveBill(true)">Save & Print</button><button class="btn o" onclick="saveBill(false)">Save</button></div><div class="acts"><button class="btn o" onclick="kotSave()">KOT</button><button class="btn o danger" onclick="if(confirm('Ye bill hata dein?'))tabDrop()">Discard</button></div>`)}
function saveBill(pr){const D=DB.d;if(!Cart.items.length)return;if(Cart.pay==='Credit'&&!Cart.cust)return toast('Credit ke liye customer select karo');
 const t=calc(Cart.items,Cart.disc,Cart.dtype),c=D.custs.find(x=>x.id===Cart.cust),
 b={id:uid(),no:(window.Cloud&&Cloud.on?D.dev:'')+D.seq++,t:Date.now(),items:structuredClone(Cart.items),...t,pay:Cart.pay,custId:Cart.cust,cust:c?c.name:'',note:Cart.note,by:ME.name};
 b.items.forEach(i=>{const p=D.prods.find(x=>x.id===i.id);if(p)p.stock-=i.qty});if(c&&b.pay==='Credit')c.due=(c.due||0)+b.total;
 D.bills.unshift(b);DB.save();TAB.l.splice(TAB.i,1);if(!TAB.l.length)TAB.l.push(newCart());TAB.i=Math.min(TAB.i,TAB.l.length-1);Cart=TAB.l[TAB.i];tabSave();closeAll();toast('Bill #'+b.no+' saved');render();if(pr)Print.run(b)}
