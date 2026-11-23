/* FAST BILLING: full-touch POS, parallel bills (tabs), sticky checkout bar */
const newCart=()=>({id:uid(),items:[],disc:0,dtype:'amt',pay:'Cash',cname:'',cphone:'',q:'',cat:'All',note:''});
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
 <div class="tabs">${TAB.l.map((c,i)=>{const n=c.items.reduce((s,x)=>s+x.qty,0);return `<button class="${i===TAB.i?'on':''}" onclick="tabSet(${i})">Bill ${i+1}${n?' • '+n:''}</button>`}).join('')}<button class="plus" onclick="tabNew()">${I('plus',15)} New Bill</button></div>
 <div class="srow"><div class="sf">${I('search',18)}<input id="bq" placeholder="${bc?'Search or scan barcode…':'Search items…'}" value="${esc(Cart.q)}" oninput="Cart.q=this.value;billGrid()" onkeydown="if(event.key==='Enter')scanEnter()"></div>${bc?`<button class="ib" onclick="camScan()" aria-label="Scan">${I('scan',20)}</button>`:''}</div>
 <div class="chips">${['All',...D.cats].map(c=>`<button class="${Cart.cat===c?'on':''}" onclick="Cart.cat='${esc(c)}';render()">${esc(c)}</button>`).join('')}</div>
 <div class="pgrid" id="bgrid"></div></div><div class="chk" id="cbar"></div>`};
AFTER.billing=()=>{billGrid();cartBar()};
const tile=p=>{const c=Cart.items.find(i=>i.id===p.id),q=c?c.qty:0;return `<div class="pt ${q?'sel':''} ${p.stock<=0?'out':''}" data-id="${p.id}" onclick="addItem('${p.id}')"><div class="pn">${esc(p.name)}</div><div class="ps"><span class="stk ${p.stock<=p.min?'low':''}">${p.stock<=0?'Out of stock':'Qty '+p.stock}</span>${q?`<span class="qb" onclick="event.stopPropagation();subItem('${p.id}')">${I('minus',13)}${q}</span>`:''}</div></div>`};
function billGrid(){const D=DB.d,q=Cart.q.toLowerCase(),l=D.prods.filter(p=>(Cart.cat==='All'||p.cat===Cart.cat)&&(!q||p.name.toLowerCase().includes(q)||(D.set.bcOn&&p.bc&&p.bc.toLowerCase().includes(q))));
 $('#bgrid').innerHTML=l.map(tile).join('')||'<div class="emptybox" style="grid-column:1/-1">No items found. Add products from the Items page.</div>'}
function updTile(id){const e=$(`#bgrid [data-id="${id}"]`),p=DB.d.prods.find(x=>x.id===id);if(e&&p)e.outerHTML=tile(p)}
function scanEnter(){const p=find(Cart.q);if(p){addItem(p.id);Cart.q='';$('#bq').value='';billGrid()}}
function addItem(id){const p=DB.d.prods.find(x=>x.id===id),c=Cart.items.find(i=>i.id===id);if(p.stock<=(c?c.qty:0))return toast('Out of stock: '+p.name);
 c?c.qty++:Cart.items.push({id,name:p.name,price:p.price,cost:p.cost,gst:p.gst,cat:p.cat,qty:1});updTile(id);cartBar()}
function subItem(id){const c=Cart.items.find(i=>i.id===id);if(!c)return;c.qty--;if(c.qty<=0)Cart.items=Cart.items.filter(i=>i!==c);updTile(id);cartBar()}
function setPay(p){Cart.pay=p;cartBar()}
function cartBar(){tabSave();const el=$('#cbar');if(!el)return;const n=Cart.items.reduce((s,i)=>s+i.qty,0),t=calc(Cart.items,Cart.disc,Cart.dtype),d=n?'':'disabled';
 el.innerHTML=`<div class="chk-in"><div class="pays">${['Cash','UPI','Card','Credit'].map(p=>`<button class="${Cart.pay===p?'on':''}" onclick="setPay('${p}')">${p}</button>`).join('')}<button class="fmt" id="fmtb" onclick="fmtSheet()">${I('printer',17)} ${Paper.label()}</button></div>
 <div class="chk-row"><button class="sum" onclick="cartSheet()" ${d}>${I('cart',21)}<span><small>${n} item${n===1?'':'s'}</small><b>${inr(t.total)}</b></span>${I('right',16)}</button><button class="btn o kb2" onclick="saveBill(false)" ${d} ${Print.busy?'disabled':''}>Save</button>${DB.d.set.kotOn?`<button class="btn o kb2" onclick="kotSave()" ${d} ${Print.busy?'disabled':''}>KOT</button>`:''}<button class="btn ${Print.busy?'busy':'b'} kb2" onclick="saveBill(true)" ${d} ${Print.busy?'disabled':''}>${Print.busy?I('check',18)+' Printing…':I('printer',18)+' Print'}</button></div></div>`}
function qtyChg(id,d){const i=Cart.items.find(x=>x.id===id),p=DB.d.prods.find(x=>x.id===id);if(d>0&&i.qty>=p.stock)return toast('Not enough stock');i.qty+=d;if(i.qty<=0)Cart.items=Cart.items.filter(x=>x!==i);cartBar();Cart.items.length?cartSheet():closeAll()}
function custFill(v){Cart.cphone=v.trim();const c=DB.d.custs.find(x=>x.phone===Cart.cphone);if(c){Cart.cname=c.name;cartSheet()}tabSave()}
function cartSheet(){const D=DB.d,t=calc(Cart.items,Cart.disc,Cart.dtype);
 openSheet(`<h3>Bill ${TAB.i+1}</h3>${Cart.items.map(i=>`<div class="cl"><div class="fl"><h4>${esc(i.name)}</h4><small>${inr(i.price)}${i.gst?' • GST '+i.gst+'%':''}</small></div><div class="qty"><button onclick="qtyChg('${i.id}',-1)">−</button><span>${i.qty}</span><button onclick="qtyChg('${i.id}',1)">+</button></div><b>${inr(i.price*i.qty)}</b></div>`).join('')}
 <div class="fg" style="margin-top:12px"><div><label class="lb">Discount</label><input type="number" min="0" value="${Cart.disc||''}" onchange="Cart.disc=+this.value;cartSheet();cartBar()"></div><div><label class="lb">Type</label><select onchange="Cart.dtype=this.value;cartSheet();cartBar()"><option value="amt" ${Cart.dtype==='amt'?'selected':''}>₹ Amount</option><option value="pct" ${Cart.dtype==='pct'?'selected':''}>% Percent</option></select></div>
 <div><label class="lb">Customer mobile</label><input type="tel" inputmode="numeric" list="cl" value="${esc(Cart.cphone)}" onchange="custFill(this.value)" placeholder="Optional"><datalist id="cl">${D.custs.filter(c=>c.phone).map(c=>`<option value="${esc(c.phone)}">${esc(c.name)}</option>`).join('')}</datalist></div>
 <div><label class="lb">Customer name</label><input value="${esc(Cart.cname)}" onchange="Cart.cname=this.value;tabSave()" placeholder="Optional"></div>
 <div class="full"><label class="lb">Note / Table (for KOT)</label><input value="${esc(Cart.note)}" onchange="Cart.note=this.value;tabSave()" placeholder="e.g. Table 3"></div></div>
 <div class="ln"><span>Subtotal</span><b>${inr(t.sub)}</b></div>${t.disc?`<div class="ln ok"><span>Discount</span><b>-${inr(t.disc)}</b></div>`:''}${D.set.gst?`<div class="ln"><span>GST</span><b>${inr(t.tax)}</b></div>`:''}<div class="ln tt"><span>Grand Total (${Cart.pay})</span><b>${inr(t.total)}</b></div>
 <div class="acts"><button class="btn b" onclick="saveBill(true)">${I('printer',18)} Save & Print</button><button class="btn o" onclick="saveBill(false)">Save</button></div><div class="acts"><button class="btn o" onclick="kotSave()">KOT</button><button class="btn o danger" onclick="Dlg.confirm('Discard this bill?',tabDrop,{yes:'Discard',danger:1})">Discard</button></div>`)}
function saveBill(pr){const D=DB.d;if(!Cart.items.length)return;const ph=(Cart.cphone||'').trim(),nm=(Cart.cname||'').trim();
 if(Cart.pay==='Credit'&&!ph&&!nm){toast('Enter customer name or mobile for Credit');return cartSheet()}
 let c=null;if(ph||nm){c=D.custs.find(x=>ph&&x.phone===ph)||(!ph&&D.custs.find(x=>x.name.toLowerCase()===nm.toLowerCase()));if(!c){c={id:uid(),name:nm||'Customer',phone:ph,due:0};D.custs.push(c)}}
 const t=calc(Cart.items,Cart.disc,Cart.dtype),b={id:uid(),no:D.seq++,t:Date.now(),items:structuredClone(Cart.items),...t,pay:Cart.pay,custId:c?c.id:'',cust:c?c.name:'',phone:c?c.phone:'',note:Cart.note};
 b.items.forEach(i=>{const p=D.prods.find(x=>x.id===i.id);if(p)p.stock-=i.qty});if(c&&b.pay==='Credit')c.due=(c.due||0)+b.total;
 D.bills.unshift(b);DB.save();if(pr){Print.busy=1;setTimeout(()=>{Print.busy=0;cartBar()},2800)}TAB.l.splice(TAB.i,1);if(!TAB.l.length)TAB.l.push(newCart());TAB.i=Math.min(TAB.i,TAB.l.length-1);Cart=TAB.l[TAB.i];tabSave();closeAll();toast('Bill #'+b.no+' saved');render();if(pr)Print.run(b)}
