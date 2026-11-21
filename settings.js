/* SETTINGS: business, barcode on/off, bill format, printer connection, backup */
const CONNS=[['rawbt','zap','RawBT app — instant, any printer','Bluetooth (classic/BLE), USB and LAN / Wi-Fi printers. Install the free RawBT app once, add your printer in it, then Billora prints in one tap.'],
 ['bt','bt','Direct Bluetooth (BLE)','Pair a BLE thermal printer here, no extra app. Chrome on Android.'],
 ['usb','usb','Direct USB (OTG)','Connect with an OTG cable and pair here. Chrome on Android / desktop.'],
 ['browser','wifi','System print dialog','Any printer installed on the phone or PC: LAN, Wi-Fi, USB, Bluetooth. Shows the print screen each time.']];
V.settings=()=>{const s=DB.d.set,t=(k,l,ty='text')=>`<div class="full"><label class="lb">${l}</label><input type="${ty}" value="${esc(s[k])}" onchange="setK('${k}',this.type==='number'?+this.value:this.value)"></div>`,
 yn=(k,l)=>`<div class="full"><label class="lb">${l}</label><select onchange="setK('${k}',this.value==='1');render()"><option value="1" ${s[k]?'selected':''}>Enabled</option><option value="0" ${!s[k]?'selected':''}>Disabled</option></select></div>`;
 return `<div class="pagehead"><div><h1>Settings</h1><p>Business, bill format and printer</p></div></div>
 <div class="panel card"><h3>Business</h3><div class="fg">${t('name','Business name')}${t('addr','Address')}${t('phone','Mobile')}${t('gstin','GSTIN')}${t('logo','Logo URL')}${yn('gst','GST on bill')}${yn('bcOn','Barcode (scan & labels)')}</div></div>
 <div class="panel card"><h3>Printer</h3>
 <div class="conn">${CONNS.map(c=>`<button class="${s.conn===c[0]?'on':''}" onclick="setConn('${c[0]}')">${I(c[1],24)}<div><b>${c[2]}</b><small>${c[3]}</small>${s.conn===c[0]&&s.pname&&(c[0]==='bt'||c[0]==='usb')?`<small><b style="display:inline">Paired: ${esc(s.pname)}</b></small>`:''}</div>${s.conn===c[0]?`<span class="tick">${I('check',20)}</span>`:''}</button>`).join('')}</div>
 <label class="lb">Print style (thermal)</label><div class="seg"><button class="${s.style!=='gfx'?'on':''}" onclick="setK('style','txt');render()">Text — fastest</button><button class="${s.style==='gfx'?'on':''}" onclick="setK('style','gfx');render()">Graphic — any language</button></div>
 <div class="acts"><button class="btn b" onclick="testPrint()">${I('printer',18)} Test Print</button><a class="btn o" href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter" target="_blank" rel="noopener">Get RawBT</a></div>
 <p class="muted" style="font-size:12px;margin-top:10px">A4 / A5 sheets always use the system print dialog. For Hindi, Kannada or any non-English names choose Graphic style.</p></div>
 <div class="panel card"><h3>Bill Format</h3><button class="sum" style="width:100%;margin-bottom:14px" onclick="fmtSheet()">${I('printer',21)}<span><small>Paper size</small><b>${Paper.label()}</b></span>${I('right',16)}</button>
 <div class="fg">${t('head','Bill heading')}${t('hdr','Header text')}${t('foot','Footer message')}${t('terms','Terms & conditions')}${t('pay','Payment details (UPI ID etc.)')}${t('font','Font size (A4 / system print)','number')}${t('margin','Margin (mm)','number')}${t('copies','Copies (2 = double print)','number')}
 <div class="full"><label class="lb">Template (A4 / system print)</label><select onchange="setK('tpl',this.value)"><option value="classic" ${s.tpl==='classic'?'selected':''}>Classic</option><option value="compact" ${s.tpl==='compact'?'selected':''}>Compact table</option></select></div></div></div>
 <div class="panel card"><h3>Backup</h3><div class="acts"><button class="btn o" onclick="backup()">${I('down',18)} Export JSON</button><button class="btn o" onclick="$('#imp').click()">Import</button></div><input id="imp" type="file" accept=".json" class="hide" onchange="restore(this.files[0])"></div>`};
function testPrint(){Print.run({no:0,t:Date.now(),cust:'Test',items:[{name:'Sample Item',qty:2,price:50,gst:5},{name:'नमस्ते चाय',qty:1,price:20,gst:0}],sub:120,disc:0,tax:5,total:125,pay:'Cash'})}
function setK(k,v){DB.d.set[k]=v;DB.save();toast('Saved')}
async function pair(k){try{k==='bt'?await Thermal.pairBT():await Thermal.pairUSB();toast('Paired: '+DB.d.set.pname);render()}catch(e){toast(e.message||'Pairing cancelled')}}
function setConn(m){if(m==='bt'||m==='usb')return pair(m);DB.d.set.conn=m;DB.save();render();if(m==='rawbt')toast('Make sure RawBT is installed and your printer is added in it')}
function backup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB.d)],{type:'application/json'}));a.download='billora-backup.json';a.click()}
function restore(f){if(!f)return;f.text().then(t=>{try{DB.d=Object.assign(structuredClone(DEF),JSON.parse(t));DB.save();toast('Backup restored');render()}catch(e){toast('Invalid backup file')}})}
