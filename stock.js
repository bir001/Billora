/* STOCK: live inventory, manual adjustment, purchase entry */
V.stock=()=>{const D=DB.d,low=D.prods.filter(p=>p.stock<=p.min);
 return `<div class="pagehead"><div><h1>Inventory</h1><p>Live stock • ${low.length} low stock alert</p></div><div class="acts" style="margin:0"><button class="btn o sm" onclick="exportStock()">Excel</button><button class="btn b sm" onclick="buyForm()">+ Purchase</button></div></div>
 <div class="list">${D.prods.map(p=>`<div class="card li"><div class="fl"><h4>${esc(p.name)}</h4><small class="muted">Cost ${inr(p.cost)}</small></div><span class="pill ${p.stock<=0?'bad':p.stock<=p.min?'low':'ok'}">${p.stock}</span><button class="pill" onclick="adjForm('${p.id}')">Adjust</button></div>`).join('')}</div>
 <div class="panel card"><h3>Recent Purchases</h3>${D.buys.slice(0,10).map(b=>`<div class="ln"><span>${esc(b.name)} × ${b.qty} <small>(${esc(b.sup||'—')})</small></span><b>${inr(b.qty*b.cost)}</b></div>`).join('')||'<p class="muted">No purchases yet</p>'}</div>`};
function adjForm(id){const p=DB.d.prods.find(x=>x.id===id);openSheet(`<h3>Adjust: ${esc(p.name)}</h3><p class="mut">Current stock: ${p.stock}</p><label class="lb">New stock</label><input id="adj" type="number" value="${p.stock}"><button class="btn b w" onclick="adjSave('${id}')">Update</button>`)}
function adjSave(id){DB.d.prods.find(x=>x.id===id).stock=+$('#adj').value||0;DB.save();closeAll();render()}
function buyForm(){const D=DB.d;openSheet(`<h3>Purchase Entry</h3><label class="lb">Supplier</label><select id="bs"><option value="">—</option>${D.sups.map(s=>`<option>${esc(s.name)}</option>`).join('')}</select>
 <label class="lb">Product</label><select id="bp">${D.prods.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
 <div class="fg"><div><label class="lb">Quantity</label><input id="bq2" type="number"></div><div><label class="lb">Cost / unit</label><input id="bc2" type="number"></div></div><button class="btn b w" onclick="buySave()">Save Purchase</button>`)}
function buySave(){const D=DB.d,p=D.prods.find(x=>x.id===$('#bp').value),q=+$('#bq2').value,c=+$('#bc2').value||p.cost;if(!p||q<=0)return toast('Enter quantity');
 p.stock+=q;p.cost=c;D.buys.unshift({id:uid(),t:Date.now(),name:p.name,qty:q,cost:c,sup:$('#bs').value});DB.save();closeAll();render()}
