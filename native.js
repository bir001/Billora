/* NATIVE: bridge to the Billora Android app (in-app Bluetooth / USB / LAN printing, file save) */
const Native={on:typeof window.BilloraNative!=='undefined',tab:'bt',scanning:false,devs:{bt:[],usb:[]},
 raw(m,...a){try{return window.BilloraNative[m](...a)}catch(e){return null}},
 printer(){try{return JSON.parse(this.raw('printer')||'null')}catch(e){return null}},
 has(){const p=this.printer();return !!(p&&p.type)},
 b64(u){let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)},
 send(bytes){this.raw('print',this.b64(bytes));return Promise.resolve()},
 ev(e){const D=this.devs;
  if(e.ev==='bt-found'){const i=D.bt.findIndex(x=>x.addr===e.addr);i<0?D.bt.push(e):D.bt[i]=e;this.paint()}
  else if(e.ev==='bt-done'){this.scanning=false;this.paint()}
  else if(e.ev==='bt-error'){this.scanning=false;toast(e.msg);this.paint()}
  else if(e.ev==='printer'){toast('Printer ready: '+e.name);closeAll();if(location.hash==='#settings')render()}
  else if(e.ev==='print')toast(e.ok?'Sent to printer':'Print failed: '+e.msg);
  else if(e.ev==='saved')toast('Saved to Downloads: '+e.name)},
 paint(){const el=$('#pl');if(!el)return;const t=this.tab;
  if(t==='bt')el.innerHTML=`<button class="btn b w" onclick="Native.scan()">${I('bt',18)} ${this.scanning?'Searching…':'Search devices'}</button>`+(this.devs.bt.map((d,i)=>`<div class="card li" onclick="Native.pick('bt',${i})"><div class="qi" style="margin:0">${I('bt',20)}</div><div class="fl"><h4>${esc(d.name)}</h4><small class="muted">${esc(d.addr)}</small></div>${d.paired?'<span class="pill ok">Paired</span>':''}</div>`).join('')||`<div class="emptybox">${this.scanning?'Looking for nearby printers…':'Turn your printer on and tap Search'}</div>`);
  else if(t==='usb'){let l=[];try{l=JSON.parse(this.raw('listUsb')||'[]')}catch(e){}this.devs.usb=l;el.innerHTML=l.map((d,i)=>`<div class="card li" onclick="Native.pick('usb',${i})"><div class="qi" style="margin:0">${I('usb',20)}</div><div class="fl"><h4>${esc(d.name)}</h4></div></div>`).join('')||'<div class="emptybox">Connect the printer with an OTG cable, then reopen this tab</div>'}
  else{const p=this.printer()||{};el.innerHTML=`<label class="lb">Printer IP address</label><input id="lip" inputmode="decimal" placeholder="192.168.1.50" value="${p.type==='lan'?esc(p.addr.split(':')[0]):''}"><label class="lb">Port</label><input id="lpt" type="number" value="${p.type==='lan'?esc(p.addr.split(':')[1]):9100}"><button class="btn b w" onclick="Native.lan()">Save & test</button>`}},
 scan(){this.scanning=true;this.devs.bt=[];this.raw('scanBt');this.paint()},
 pick(k,i){const d=this.devs[k][i];if(k==='bt')this.raw('useBt',d.addr,d.name);else this.raw('useUsb',d.id,d.name);toast('Connecting…')},
 lan(){const ip=$('#lip').value.trim(),p=+$('#lpt').value||9100;if(!ip)return toast('Enter the printer IP');this.raw('useLan',ip,p);toast('Connecting…')}
};
window.onNative=e=>Native.ev(e);
function printerSheet(){const p=Native.printer(),t=Native.tab;
 openSheet(`<h3>Printer</h3><p class="mut">${p&&p.type?'Connected: <b>'+esc(p.name)+'</b> ('+p.type.toUpperCase()+')':'No printer selected'}</p>
 <div class="seg">${[['bt','Bluetooth'],['usb','USB'],['lan','LAN / Wi-Fi']].map(x=>`<button class="${t===x[0]?'on':''}" onclick="Native.tab='${x[0]}';printerSheet()">${x[1]}</button>`).join('')}</div><div id="pl"></div>
 ${p&&p.type?`<button class="btn o w danger" onclick="Native.raw('clearPrinter');printerSheet()">Remove printer</button>`:''}`);Native.paint()}
const Save={blob(name,blob){if(Native.on){const r=new FileReader();r.onload=()=>Native.raw('saveFile',name,blob.type||'application/octet-stream',String(r.result).split(',')[1]);r.readAsDataURL(blob)}
 else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()}}};
