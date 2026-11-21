/* SETTINGS: business, bill customization, printer, theme, backup */
V.settings=()=>{const s=DB.d.set,t=(k,l,ty='text')=>`<div class="full"><label class="lb">${l}</label><input type="${ty}" value="${esc(s[k])}" onchange="setK('${k}',this.type==='number'?+this.value:this.value)"></div>`;
 return `<div class="pagehead"><div><h1>Settings</h1><p>Business, bill aur printer</p></div></div>
 <div class="panel card"><h3>Business</h3><div class="fg">${t('name','Business name')}${t('addr','Address')}${t('phone','Mobile')}${t('gstin','GSTIN')}${t('logo','Logo URL')}
 <div class="full"><label class="lb">GST bill me dikhao</label><select onchange="setK('gst',this.value==='1')"><option value="1" ${s.gst?'selected':''}>Yes</option><option value="0" ${!s.gst?'selected':''}>No</option></select></div></div></div>
 <div class="panel card"><h3>Bill Customization</h3><div class="fg">${t('head','Bill heading')}${t('hdr','Header text')}${t('foot','Footer message')}${t('terms','Terms & conditions')}${t('pay','Payment details (UPI ID etc.)')}${t('font','Font size','number')}${t('margin','Margin (mm)','number')}${t('copies','Copies (2 = double print)','number')}
 <div><label class="lb">Paper</label><select onchange="setK('paper',this.value)">${[['58','2-inch (58mm)'],['80','3-inch (80mm)'],['a4','A4']].map(p=>`<option value="${p[0]}" ${s.paper===p[0]?'selected':''}>${p[1]}</option>`).join('')}</select></div>
 <div><label class="lb">Template</label><select onchange="setK('tpl',this.value)"><option value="classic" ${s.tpl==='classic'?'selected':''}>Classic</option><option value="compact" ${s.tpl==='compact'?'selected':''}>Compact table</option></select></div></div>
 <button class="btn o w" onclick="Print.run({no:0,t:Date.now(),cust:'Test',items:[{name:'Sample Item',qty:2,price:50,gst:5}],sub:100,disc:0,tax:5,total:105,pay:'Cash'})">Test Print</button>
 <p class="muted" style="font-size:12px;margin-top:10px">USB/Bluetooth thermal printer ko phone/PC ke print system se connect karo (ya RawBT jaisa ESC/POS app). PDF ke liye print dialog me "Save as PDF" chuno.</p></div>
 <div class="panel card"><h3>Backup</h3><div class="acts"><button class="btn o" onclick="backup()">Export JSON</button><button class="btn o" onclick="$('#imp').click()">Import</button></div><input id="imp" type="file" accept=".json" class="hide" onchange="restore(this.files[0])"></div>`};
function setK(k,v){DB.d.set[k]=v;DB.save();toast('Saved')}
function backup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB.d)],{type:'application/json'}));a.download='billora-backup.json';a.click()}
function restore(f){if(!f)return;f.text().then(t=>{try{DB.d=Object.assign(structuredClone(DEF),JSON.parse(t));DB.save();toast('Restored');render()}catch(e){toast('Galat file')}})}
