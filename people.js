/* PEOPLE: customers (with credit due) + suppliers */
function people(kind,title){const l=DB.d[kind];return `<div class="pagehead"><div><h1>${title}</h1><p>${l.length} total</p></div><button class="btn b sm" onclick="perForm('${kind}')">+ Add</button></div>
 <div class="list">${l.map(c=>`<div class="card li" onclick="perForm('${kind}','${c.id}')"><div class="av sm">${esc(c.name[0])}</div><div class="fl"><h4>${esc(c.name)}</h4><small class="muted">${esc(c.phone||'')}</small></div>${c.due>0?`<span class="pill bad">Due ${inr(c.due)}</span>`:''}</div>`).join('')||'<div class="emptybox">Abhi koi nahi</div>'}</div>`}
V.customers=()=>people('custs','Customers');V.suppliers=()=>people('sups','Suppliers');
function perForm(k,id){const c=DB.d[k].find(x=>x.id===id)||{name:'',phone:'',addr:''};openSheet(`<h3>${id?'Edit':'New'}</h3><label class="lb">Name</label><input id="pn" value="${esc(c.name)}"><label class="lb">Mobile</label><input id="pp" value="${esc(c.phone)}"><label class="lb">Address</label><input id="pa" value="${esc(c.addr)}">
 <div class="acts"><button class="btn b" onclick="perSave('${k}','${id||''}')">Save</button>${c.due>0?`<button class="btn o" onclick="perPay('${k}','${id}')">Payment mila</button>`:''}${id?`<button class="btn o danger" onclick="perDel('${k}','${id}')">Delete</button>`:''}</div>`)}
function perSave(k,id){const o={name:$('#pn').value.trim(),phone:$('#pp').value.trim(),addr:$('#pa').value.trim()};if(!o.name)return toast('Naam likho');
 id?Object.assign(DB.d[k].find(x=>x.id===id),o):DB.d[k].push({id:uid(),due:0,...o});DB.save();closeAll();render()}
function perPay(k,id){const c=DB.d[k].find(x=>x.id===id),a=+prompt('Kitna mila? (due '+c.due+')');if(a>0){c.due=Math.max(0,c.due-a);DB.save();closeAll();render()}}
function perDel(k,id){if(confirm('Delete?')){DB.d[k]=DB.d[k].filter(x=>x.id!==id);DB.save();closeAll();render()}}
