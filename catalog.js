/* CATALOG: products + categories + barcode fields */
let PQ='';
let PV=localStorage.getItem('bl_pv')||'list';
const stPill=p=>`<span class="pill ${p.stock<=0?'bad':p.stock<=p.min?'low':'ok'}">${p.stock<=0?'Out':p.stock}</span>`;
function prodList(){const D=DB.d,q=PQ.toLowerCase();let l=D.prods.filter(p=>p.name.toLowerCase().includes(q)||(p.bc||'').toLowerCase()===q);
 if(PV==='low')l=l.filter(p=>p.stock<=p.min);
 const row=p=>`<div class="card li" onclick="prodForm('${p.id}')"><div class="th">${p.img?`<img src="${esc(p.img)}">`:`<div class="ph" style="font-size:24px">${esc(p.name[0])}</div>`}</div><div class="fl"><h4>${esc(p.name)}</h4><small class="muted">${esc(p.cat)}${D.set.bcOn&&p.bc?' • '+esc(p.bc):''}</small></div><div style="text-align:right"><b>${inr(p.price)}</b><br>${stPill(p)}</div></div>`,
  tl=p=>`<div class="pt" onclick="prodForm('${p.id}')"><div class="pn">${esc(p.name)}</div><div class="ps"><b style="font-size:13px">${inr(p.price)}</b>${stPill(p)}</div></div>`;
 if(!l.length)return `<div class="emptybox">${PV==='low'?'No low-stock items':'No items yet'}</div>`;
 if(PV==='grid')return `<div class="pgrid">${l.map(tl).join('')}</div>`;
 if(PV==='cat')return D.cats.concat(['']).map(c=>{const g=l.filter(p=>c?p.cat===c:!D.cats.includes(p.cat));return g.length?`<div class="gh">${esc(c||'Other')} • ${g.length}</div><div class="pgrid">${g.map(tl).join('')}</div>`:''}).join('');
 return `<div class="list">${l.map(row).join('')}</div>`}
V.products=()=>{const D=DB.d,low=D.prods.filter(p=>p.stock<=p.min).length;return `<div class="pagehead"><div><h1>Products</h1><p>${D.prods.length} items • ${D.cats.length} categories</p></div><div class="acts" style="margin:0"><button class="btn o sm" onclick="catSheet()">Categories</button>${D.set.bcOn?`<button class="btn o sm" onclick="Label.open()">${I('tag',15)}</button>`:''}<button class="btn b sm" onclick="prodForm()">+ Add</button></div></div>
 <div class="vt">${[['list','list','List'],['grid','grid','Grid'],['cat','box','Category'],['low','alert','Low stock'+(low?' ('+low+')':'')]].map(v=>`<button class="${PV===v[0]?'on':''}" onclick="PV='${v[0]}';localStorage.setItem('bl_pv',PV);render()">${I(v[1],15)} ${v[2]}</button>`).join('')}</div>
 <input placeholder="Search item or barcode…" value="${esc(PQ)}" oninput="PQ=this.value;$('#plist').innerHTML=prodList()"><div id="plist">${prodList()}</div>`};
function prodForm(id){const D=DB.d,p=D.prods.find(x=>x.id===id)||{name:'',cat:D.cats[0],price:'',cost:'',gst:0,stock:0,min:5,bc:'',img:''},f=(k,l,t='text')=>`<div><label class="lb">${l}</label><input id="pf_${k}" type="${t}" value="${esc(p[k])}"></div>`,ed=true;
 openSheet(`<h3>${id?'Edit':'New'} Product</h3><div class="fg"><div class="full">${f('name','Name')}</div><div class="full"><label class="lb">Category</label><select id="pf_cat">${D.cats.map(c=>`<option ${c===p.cat?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
 ${f('price','Selling price','number')}${f('cost','Cost price','number')}${f('gst','GST %','number')}${f('stock','Stock','number')}${f('min','Low stock alert','number')}
 ${D.set.bcOn?`<div class="full"><label class="lb">Barcode</label><div class="row"><input id="pf_bc" value="${esc(p.bc)}" style="margin:0"><button class="btn o sm" onclick="$('#pf_bc').value=Barcode.gen();bcPrev()">Generate</button></div><div class="bcv" id="bcv" style="margin:8px 0">${p.bc?Barcode.svg(p.bc):''}</div></div>`:''}
 <div class="full">${f('img','Image URL (optional)')}</div></div>
 ${ed?`<div class="acts"><button class="btn b" onclick="prodSave('${id||''}')">Save</button>${id?`<button class="btn o danger" onclick="prodDel('${id}')">Delete</button>`:''}</div>${id&&D.set.bcOn?`<div class="acts"><button class="btn o" onclick="Label.open('${id}')">${I('tag',18)} Labels (Barcode / QR)</button></div>`:''}`:''}`)}
function bcPrev(){$('#bcv').innerHTML=Barcode.svg($('#pf_bc').value||'0')}
function prodSave(id){const D=DB.d,g=k=>($('#pf_'+k)?$('#pf_'+k).value.trim():''),n=k=>+g(k)||0;if(!g('name'))return toast('Enter a name');
 const old=D.prods.find(x=>x.id===id),bc=g('bc');if(bc&&D.prods.some(x=>x.id!==id&&x.bc===bc))return toast('This barcode is already used by another item');
 const o={name:g('name'),cat:$('#pf_cat').value,price:n('price'),cost:n('cost'),gst:n('gst'),stock:n('stock'),min:n('min'),bc:$('#pf_bc')?bc:(old?old.bc:''),img:g('img')};
 id?Object.assign(old,o):D.prods.push({id:uid(),...o});DB.save();closeAll();render()}
function prodDel(id){Dlg.confirm('Delete this item?',()=>{DB.d.prods=DB.d.prods.filter(x=>x.id!==id);DB.save();closeAll();render()},{yes:'Delete',danger:1})}
function catSheet(){openSheet(`<h3>Categories</h3>${DB.d.cats.map((c,i)=>`<div class="cl"><div class="fl">${esc(c)}</div><button class="pill bad" onclick="catDel(${i})">Delete</button></div>`).join('')}<input id="nc" placeholder="New category" style="margin-top:12px"><button class="btn b w" onclick="catAdd()">Add</button>`)}
function catAdd(){const v=$('#nc').value.trim();if(v&&!DB.d.cats.includes(v)){DB.d.cats.push(v);DB.save()}catSheet()}
function catDel(i){DB.d.cats.splice(i,1);DB.save();catSheet()}
