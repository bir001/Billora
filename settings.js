/* SETTINGS: business, barcode on/off, bill format, printer connection, backup */
const CONNS=[['rawbt','zap','RawBT app — instant, any printer','Bluetooth (classic/BLE), USB and LAN / Wi-Fi printers. Install the free RawBT app once, add your printer in it, then Billora prints in one tap.'],
 ['bt','bt','Direct Bluetooth (BLE)','Pair a BLE thermal printer. Chrome shows its own pairing window with the website name. For a pairing list inside the app, use the Billora Android app.'],
 ['usb','usb','Direct USB (OTG)','Connect with an OTG cable and pair here. Chrome on Android / desktop.'],
 ['browser','wifi','System print dialog','Any printer installed on the phone or PC: LAN, Wi-Fi, USB, Bluetooth. Shows the print screen each time.']];
V.settings=()=>{const s=DB.d.set,t=(k,l,ty='text')=>`<div class="full"><label class="lb">${l}</label><input type="${ty}" value="${esc(s[k])}" onchange="setK('${k}',this.type==='number'?+this.value:this.value)"></div>`,
 yn=(k,l)=>`<div class="full"><label class="lb">${l}</label><select onchange="setK('${k}',this.value==='1');render()"><option value="1" ${s[k]?'selected':''}>Enabled</option><option value="0" ${!s[k]?'selected':''}>Disabled</option></select></div>`;
 return `<div class="pagehead"><div><h1>Settings</h1><p>Business, bill format and printer</p></div></div>
 <div class="panel card"><h3>Business</h3><div class="fg">${t('name','Business name')}${t('addr','Address')}${t('phone','Mobile')}${t('gstin','GSTIN')}${t('logo','Logo URL')}${yn('gst','GST on bill')}${yn('bcOn','Barcode (scan & labels)')}${yn('kotOn','KOT button on billing screen')}</div></div>
 ${Native.on?nativePrinter(s):browserPrinter(s)}
 <div class="panel card"><h3>Bill Format</h3><button class="sum" style="width:100%;margin-bottom:14px" onclick="fmtSheet()">${I('printer',21)}<span><small>Paper size</small><b>${Paper.label()}</b></span>${I('right',16)}</button>
 <button class="sum" style="width:100%;margin-bottom:14px" onclick="tplSheet()">${I('file',21)}<span><small>Bill template</small><b>${(TPLS.find(x=>x[0]===s.tpl)||TPLS[0])[1]}</b></span>${I('right',16)}</button><div class="fg">${t('head','Bill heading')}${t('hdr','Header text')}${t('foot','Footer message')}${t('terms','Terms & conditions')}${t('pay','Payment details (UPI ID etc.)')}${t('font','Font size (A4 / system print)','number')}${t('margin','Margin (mm)','number')}${t('copies','Copies (2 = double print)','number')}
 </div></div>
 ${storagePanel()}
 <div class="panel card"><h3>Backup</h3><div class="acts"><button class="btn o" onclick="backup()">${I('down',18)} Export JSON</button><button class="btn o" onclick="$('#imp').click()">Import</button></div><input id="imp" type="file" accept=".json" class="hide" onchange="restore(this.files[0])"></div>
 <div class="about"><img src="logo-sm.png" alt=""><div><b>Billora POS</b> • v1.0</div><div>Fast touch billing & inventory</div></div>`};
function testPrint(){Print.run({no:0,t:Date.now(),cust:'Test',items:[{name:'Sample Item',qty:2,price:50,gst:5},{name:'नमस्ते चाय',qty:1,price:20,gst:0}],sub:120,disc:0,tax:5,total:125,pay:'Cash'})}
function setK(k,v){DB.d.set[k]=v;DB.save();toast('Saved')}
async function pair(k){try{k==='bt'?await Thermal.pairBT():await Thermal.pairUSB();toast('Paired: '+DB.d.set.pname);render()}catch(e){toast(e.message||'Pairing cancelled')}}
function setConn(m){if(m==='bt'||m==='usb')return pair(m);DB.d.set.conn=m;DB.save();render();if(m==='rawbt')toast('Make sure RawBT is installed and your printer is added in it')}
function backup(){Save.blob('billora-backup.json',new Blob([JSON.stringify(DB.d)],{type:'application/json'}))}
function restore(f){if(!f)return;f.text().then(t=>{try{DB.d=Object.assign(structuredClone(DEF),JSON.parse(t));DB.save();toast('Backup restored');render()}catch(e){toast('Invalid backup file')}})}

function nativePrinter(s){const p=Native.printer()||{};return `<div class="panel card"><h3>Printer</h3>
 <button class="sum" style="width:100%;margin-bottom:12px" onclick="printerSheet()">${I(p.type==='usb'?'usb':p.type==='lan'?'wifi':'bt',22)}<span><small>${p.type?p.type.toUpperCase()+' printer':'No printer selected'}</small><b>${p.type?esc(p.name):'Search & connect'}</b></span>${I('right',16)}</button>
 <label class="lb">Print style</label><div class="seg"><button class="${s.style!=='gfx'?'on':''}" onclick="setK('style','txt');render()">Text — fastest</button><button class="${s.style==='gfx'?'on':''}" onclick="setK('style','gfx');render()">Graphic — any language</button></div>
 <div class="acts"><button class="btn b" onclick="testPrint()">${I('printer',18)} Test Print</button></div>
 <p class="muted" style="font-size:12px;margin-top:10px">Bluetooth, USB and LAN printers are searched inside this app. A4 / A5 use the Android print screen.</p></div>`}
function browserPrinter(s){const adv=s.conn==='bt'||s.conn==='usb';return `<div class="panel card"><h3>Printer</h3>
 <div class="conn">${CONNS.filter(c=>c[0]==='rawbt'||c[0]==='browser').map(c=>`<button class="${s.conn===c[0]?'on':''}" onclick="setConn('${c[0]}')">${I(c[1],24)}<div><b>${c[2]}</b><small>${c[3]}</small></div>${s.conn===c[0]?`<span class="tick">${I('check',20)}</span>`:''}</button>`).join('')}</div>
 <div class="conn"><a class="sum" href="${APK_URL}" style="text-decoration:none;color:inherit">${I('down',22)}<span><small>Best option</small><b>Billora Android app</b><small style="display:block">Search & pair Bluetooth / USB / LAN printers inside the app</small></span>${I('right',16)}</a></div>
 <label class="lb">Print style (thermal)</label><div class="seg"><button class="${s.style!=='gfx'?'on':''}" onclick="setK('style','txt');render()">Text — fastest</button><button class="${s.style==='gfx'?'on':''}" onclick="setK('style','gfx');render()">Graphic — any language</button></div>
 <div class="acts"><button class="btn b" onclick="testPrint()">${I('printer',18)} Test Print</button></div>
 <details style="margin-top:12px"${adv?' open':''}><summary class="muted" style="cursor:pointer;font-size:13px">Advanced: pair directly from Chrome (shows the browser's own pairing window)</summary><div class="conn" style="margin-top:8px">${CONNS.filter(c=>c[0]==='bt'||c[0]==='usb').map(c=>`<button class="${s.conn===c[0]?'on':''}" onclick="setConn('${c[0]}')">${I(c[1],24)}<div><b>${c[2]}</b><small>${c[3]}</small>${s.conn===c[0]&&s.pname?`<small><b style="display:inline">Paired: ${esc(s.pname)}</b></small>`:''}</div>${s.conn===c[0]?`<span class="tick">${I('check',20)}</span>`:''}</button>`).join('')}</div></details></div>`}
function storagePanel(){const g=!!GOOGLE_CLIENT_ID;return `<div class="panel card"><h3>Data export & storage</h3>
 <div class="acts"><button class="btn o" onclick="gSheets()">${I('file',18)} Google Sheets</button><button class="btn o" onclick="gDrive()">${I('cloud',18)} Google Drive</button></div>
 <div class="acts"><button class="btn o" onclick="exportCSV()">${I('down',18)} CSV (Notion / any sheet)</button></div>
 <p class="muted" style="font-size:12px;margin-top:8px">${g?'Google sign-in opens in Chrome / the installed web app. ':'Google export needs a one-time Google Cloud setup (see FIREBASE-SETUP.txt). '}${Native.on?'Google blocks sign-in inside app windows, so use CSV here or Google export from Chrome. ':''}Notion: export CSV, then in Notion choose Import > CSV.</p></div>`}
