/* FAST BILLING: touch POS, search/barcode, qty, discount, GST, payment, save+print */
const Cart={items:[],disc:0,dtype:'amt',pay:'Cash',cust:'',q:'',cat:'All'};
function calc(items,disc,dtype){const sub=items.reduce((s,i)=>s+i.price*i.qty,0),d=Math.min(sub,dtype==='pct'?sub*disc/100:+disc||0),f=sub?1-d/sub:1,
 tax=items.reduce((s,i)=>s+i.price*i.qty*f*(i.gst||0)/100,0);return{sub,disc:d,tax,total:Math.round(sub-d+tax)}}
V.billing=()=>{const D=DB.d;return `<div class="pos"><div class="pagehead"><div><h1>Fast Billing</h1><p>Product touch karo, bill ban jayega</p></div><button class="btn o sm" onclick="Cart.items=[];Cart.disc=0;Cart.cust='';render()">+ New Bill</button></div>
 <div class="sbox"><input id="bq" placeholder="Search ya barcode scan karo…" value="${esc(Cart.q)}" oninput="Cart.q=this.value;billGrid()" onkeydown="if(event.key==='Enter')scanEnter()"></div>
 <div class="chips">${['All',...D.cats].map(c=>`<button class="${Cart.cat===c?'on':''}" onclick="Cart.cat='${esc(c)}';render()">${esc(c)}</button>`).join('')}</div>
 <div class="grid" id="bgrid"></div></div><div id="cbar"></div>`+(setTimeout(()=>{billGrid();cartBar()}),'')};
function billGrid(){const D=DB.d,q=Cart.q.toLowerCase(),l=D.prods.filter(p=>(Cart.cat==='All'||p.cat===Cart.cat)&&(!q||p.name.toLowerCase().includes(q)||p.bc===Cart.q));
 $('#bgrid').innerHTML=l.map(p=>`<div class="card pc" onclick="addItem('${p.id}')"><div class="pi">${p.img?`<img src="${esc(p.img)}" loading="lazy">`:`<div class="ph">${esc(p.name[0])}</div>`}<span class="stkb">${p.stock<=0?'Out':p.stock}</span></div><div class="pb"><h4>${esc(p.name)}</h4><div class="pr"><b>${inr(p.price)}</b><span class="add">+</span></div></div></div>`).join('')||'<div class="emptybox">Koi product nahi mila. Products me add karo.</div>'}
function scanEnter(){const p=DB.d.prods.find(p=>p.bc&&p.bc===Cart.q.trim());if(p){addItem(p.id);Cart.q='';$('#bq').value='';billGrid()}}
function addItem(id){const p=DB.d.prods.find(x=>x.id===id),c=Cart.items.find(i=>i.id===id);if(p.stock<=(c?c.qty:0))return toast('Stock khatam: '+p.name);
 c?c.qty++:Cart.items.push({id,name:p.name,price:p.price,cost:p.cost,gst:p.gst,cat:p.cat,qty:1});cartBar()}
function cartBar(){const el=$('#cbar');if(!el)return;const n=Cart.items.reduce((s,i)=>s+i.qty,0),t=calc(Cart.items,Cart.disc,Cart.dtype).total;
 el.innerHTML=n?`<div class="cartbar" onclick="cartSheet()"><span>🛒 ${n} items</span><span>${inr(t)} ›</span></div>`:''}
function qtyChg(id,d){const i=Cart.items.find(x=>x.id===id),p=DB.d.prods.find(x=>x.id===id);if(d>0&&i.qty>=p.stock)return toast('Itna stock nahi hai');i.qty+=d;if(i.qty<=0)Cart.items=Cart.items.filter(x=>x!==i);cartBar();Cart.items.length?cartSheet():closeAll()}
function cartSheet(){const D=DB.d,t=calc(Cart.items,Cart.disc,Cart.dtype);
 openSheet(`<h3>Current Bill</h3>${Cart.items.map(i=>`<div class="cl"><div class="fl"><h4>${esc(i.name)}</h4><small>${inr(i.price)}${i.gst?' • GST '+i.gst+'%':''}</small></div><div class="qty"><button onclick="qtyChg('${i.id}',-1)">−</button><span>${i.qty}</span><button onclick="qtyChg('${i.id}',1)">+</button></div><b>${inr(i.price*i.qty)}</b></div>`).join('')}
 <div class="fg" style="margin-top:12px"><div><label class="lb">Discount</label><input type="number" min="0" value="${Cart.disc||''}" onchange="Cart.disc=+this.value;cartSheet();cartBar()"></div><div><label class="lb">Type</label><select onchange="Cart.dtype=this.value;cartSheet();cartBar()"><option value="amt" ${Cart.dtype==='amt'?'selected':''}>₹ Amount</option><option value="pct" ${Cart.dtype==='pct'?'selected':''}>% Percent</option></select></div></div>
 <label class="lb">Customer (optional)</label><select onchange="Cart.cust=this.value"><option value="">Walk-in</option>${D.custs.map(c=>`<option value="${c.id}" ${Cart.cust===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
 <div class="seg">${['Cash','UPI','Card','Credit'].map(p=>`<button class="${Cart.pay===p?'on':''}" onclick="Cart.pay='${p}';cartSheet()">${p}</button>`).join('')}</div>
 <div class="ln"><span>Subtotal</span><b>${inr(t.sub)}</b></div>${t.disc?`<div class="ln ok"><span>Discount</span><b>-${inr(t.disc)}</b></div>`:''}${D.set.gst?`<div class="ln"><span>GST</span><b>${inr(t.tax)}</b></div>`:''}<div class="ln tt"><span>Grand Total</span><b>${inr(t.total)}</b></div>
 <div class="acts"><button class="btn b" onclick="saveBill(true)">Save & Print</button><button class="btn o" onclick="saveBill(false)">Save</button><button class="btn o" onclick="kotPrint()">KOT</button></div>`)}
function kotPrint(){Print.run({no:'KOT',t:Date.now(),items:Cart.items,cust:''},true)}
function saveBill(pr){const D=DB.d;if(Cart.pay==='Credit'&&!Cart.cust)return toast('Credit ke liye customer select karo');
 const t=calc(Cart.items,Cart.disc,Cart.dtype),c=D.custs.find(x=>x.id===Cart.cust),
 b={id:uid(),no:D.seq++,t:Date.now(),items:structuredClone(Cart.items),...t,pay:Cart.pay,custId:Cart.cust,cust:c?c.name:'',by:'Owner'};
 b.items.forEach(i=>{const p=D.prods.find(x=>x.id===i.id);if(p)p.stock-=i.qty});if(c&&b.pay==='Credit')c.due=(c.due||0)+b.total;
 D.bills.unshift(b);DB.save();Cart.items=[];Cart.disc=0;Cart.cust='';Cart.pay='Cash';closeAll();toast('Bill #'+b.no+' saved');render();if(pr)Print.run(b)}
