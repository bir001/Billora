/* CATALOG: products + categories */
let PQ='';
function prodList(){const D=DB.d,l=D.prods.filter(p=>p.name.toLowerCase().includes(PQ.toLowerCase())||p.bc===PQ);return `${l.map(p=>`<div class="card li" onclick="prodForm('${p.id}')"><div class="th">${p.img?`<img src="${esc(p.img)}">`:`<div class="ph" style="font-size:24px">${esc(p.name[0])}</div>`}</div><div class="fl"><h4>${esc(p.name)}</h4><small class="muted">${esc(p.cat)}${p.bc?' • '+esc(p.bc):''}</small></div><div style="text-align:right"><b>${inr(p.price)}</b><br><span class="pill ${p.stock<=0?'bad':p.stock<=p.min?'low':'ok'}">${p.stock}</span></div></div>`).join('')||'<div class="emptybox">Koi product nahi</div>'}`}
V.products=()=>{const D=DB.d;
 return `<div class="pagehead"><div><h1>Products</h1><p>${D.prods.length} items • ${D.cats.length} categories</p></div><div class="acts" style="margin:0"><button class="btn o sm" onclick="catSheet()">Categories</button><button class="btn b sm" onclick="prodForm()">+ Add</button></div></div>
 <div class="sbox"><input placeholder="Search product…" value="${esc(PQ)}" oninput="PQ=this.value;$('#plist').innerHTML=prodList()"></div>
 <div class="list" id="plist">${prodList()}</div>`};
function prodForm(id){const D=DB.d,p=D.prods.find(x=>x.id===id)||{name:'',cat:D.cats[0],price:'',cost:'',gst:0,stock:0,min:5,bc:'',img:''},f=(k,l,t='text')=>`<div><label class="lb">${l}</label><input id="pf_${k}" type="${t}" value="${esc(p[k])}"></div>`;
 openSheet(`<h3>${id?'Edit':'New'} Product</h3><div class="fg"><div class="full">${f('name','Name')}</div><div class="full"><label class="lb">Category</label><select id="pf_cat">${D.cats.map(c=>`<option ${c===p.cat?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
 ${f('price','Selling price','number')}${f('cost','Cost price','number')}${f('gst','GST %','number')}${f('stock','Stock','number')}${f('min','Low stock alert','number')}${f('bc','Barcode')}<div class="full">${f('img','Image URL (optional)')}</div></div>
 <div class="acts"><button class="btn b" onclick="prodSave('${id||''}')">Save</button>${id?`<button class="btn o danger" onclick="prodDel('${id}')">Delete</button>`:''}</div>`)}
function prodSave(id){const D=DB.d,g=k=>$('#pf_'+k).value.trim(),n=k=>+g(k)||0;if(!g('name'))return toast('Naam likho');
 const o={name:g('name'),cat:$('#pf_cat').value,price:n('price'),cost:n('cost'),gst:n('gst'),stock:n('stock'),min:n('min'),bc:g('bc'),img:g('img')};
 if(id)Object.assign(D.prods.find(x=>x.id===id),o);else D.prods.push({id:uid(),...o});DB.save();closeAll();render()}
function prodDel(id){if(!confirm('Delete product?'))return;DB.d.prods=DB.d.prods.filter(x=>x.id!==id);DB.save();closeAll();render()}
function catSheet(){openSheet(`<h3>Categories</h3>${DB.d.cats.map((c,i)=>`<div class="cl"><div class="fl">${esc(c)}</div><button class="pill bad" onclick="catDel(${i})">Delete</button></div>`).join('')}<input id="nc" placeholder="Nayi category" style="margin-top:12px"><button class="btn b w" onclick="catAdd()">Add</button>`)}
function catAdd(){const v=$('#nc').value.trim();if(v&&!DB.d.cats.includes(v)){DB.d.cats.push(v);DB.save()}catSheet()}
function catDel(i){DB.d.cats.splice(i,1);DB.save();catSheet()}
