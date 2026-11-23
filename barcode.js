/* BARCODE & QR: Code 128 + QR generator, label designer (50x25 / 50x50 / custom, preview, copies), camera + keyboard scanners */
const LIBS={},QRLIB='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js',ZXLIB='https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
function loadLib(u){return LIBS[u]||(LIBS[u]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>{delete LIBS[u];toast('Internet is needed once to load this feature');no(new Error('lib'))};document.head.appendChild(s)}))}
const C128=['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
const Barcode={
 gen(){return 'BL'+String(Math.floor(Math.random()*1e8)).padStart(8,'0')},
 mods(txt){const v=[104];for(const ch of String(txt)){const c=ch.charCodeAt(0);v.push(c>=32&&c<=126?c-32:31)}let sum=104;v.slice(1).forEach((x,i)=>sum+=x*(i+1));v.push(sum%103,106);
  const out=[];v.forEach(x=>{const p=C128[x];for(let i=0;i<p.length;i++)out.push([i%2===0,+p[i]])});return out},
 svg(txt,h=40,q=10){let x=q,r='';this.mods(txt).forEach(([b,w])=>{if(b)r+=`<rect x="${x}" y="0" width="${w}" height="${h}"/>`;x+=w});
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x+q} ${h}" preserveAspectRatio="none" fill="#000" shape-rendering="crispEdges">${r}</svg>`},
 async qr(txt){await loadLib(QRLIB);const q=qrcode(0,'M');q.addData(String(txt));q.make();const n=q.getModuleCount();return{n,dark:(r,c)=>q.isDark(r,c)}},
 async qrSvg(txt){const m=await this.qr(txt);let d='';for(let r=0;r<m.n;r++){let c=0;while(c<m.n){if(m.dark(r,c)){const s=c;while(c<m.n&&m.dark(r,c))c++;d+=`M${s+4} ${r+4}h${c-s}v1h-${c-s}z`}else c++}}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.n+8} ${m.n+8}" shape-rendering="crispEdges"><path d="${d}"/></svg>`}
};
function find(code){const c=String(code).trim().toUpperCase();return DB.d.set.bcOn?DB.d.prods.find(p=>p.bc&&p.bc.toUpperCase()===c):null}
/* ---------- labels ---------- */
const Label={st:{id:'',type:'bar',size:'50x25',w:50,h:25,name:true,price:true,code:true,copies:1},SZ:{'50x25':[50,25],'50x50':[50,50]},
 dims(){const s=this.st;return s.size==='custom'?[Math.max(15,+s.w||50),Math.max(10,+s.h||25)]:this.SZ[s.size]},
 prod(){return DB.d.prods.find(p=>p.id===this.st.id)},
 open(id){const D=DB.d;if(id)this.st.id=id;if(!this.prod())this.st.id=(D.prods[0]||{}).id||'';if(!this.prod())return toast('Add an item first');this.sheet()},
 set(k,v){this.st[k]=v;this.sheet()},
 gen(){const p=this.prod();p.bc=Barcode.gen();DB.save();this.sheet()},
 sheet(){const s=this.st,p=this.prod(),B=(k,v,l)=>`<button class="${s[k]===v?'on':''}" onclick="Label.set('${k}','${v}')">${l}</button>`,T=(k,l)=>`<button class="${s[k]?'on':''}" onclick="Label.set('${k}',${!s[k]})">${l}</button>`;
  openSheet(`<h3>Print labels</h3><label class="lb">Item</label><select onchange="Label.st.id=this.value;Label.sheet()">${DB.d.prods.map(x=>`<option value="${x.id}" ${x.id===s.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
  ${p.bc?`<p class="muted" style="margin:-4px 0 8px">Code: <b>${esc(p.bc)}</b></p>`:`<button class="btn o w" onclick="Label.gen()">Generate a code for this item</button>`}
  <label class="lb">Label type</label><div class="seg">${B('type','bar','Barcode')}${B('type','qr','QR code')}</div>
  <label class="lb">Label size (mm)</label><div class="seg">${B('size','50x25','50 × 25')}${B('size','50x50','50 × 50')}${B('size','custom','Custom')}</div>
  ${s.size==='custom'?`<div class="fg"><div><label class="lb">Width mm</label><input type="number" value="${s.w}" onchange="Label.st.w=+this.value;Label.preview()"></div><div><label class="lb">Height mm</label><input type="number" value="${s.h}" onchange="Label.st.h=+this.value;Label.preview()"></div></div>`:''}
  <label class="lb">Show on label</label><div class="seg">${T('name','Name')}${T('price','Price')}${T('code','Code text')}</div>
  <label class="lb">Copies</label><div class="row"><input type="number" min="1" value="${s.copies}" onchange="Label.st.copies=Math.max(1,+this.value||1)" style="margin:0"><button class="btn o sm" onclick="Label.set('copies',Math.max(1,${p.stock}))">= stock (${p.stock})</button></div>
  <label class="lb" style="margin-top:12px">Preview</label><div id="lprev" class="lprev">…</div>
  <div class="acts"><button class="btn b" onclick="Label.print()">${I('printer',18)} Print labels</button><button class="btn o" onclick="Label.thermal()">Thermal printer</button></div>`);this.preview()},
 async html(p){const s=this.st,[w,h]=this.dims(),wide=w>=h*1.5,fs=Math.max(1.9,Math.min(w,h)/9),code=p.bc;let g;
  try{g=!code?'<div style="color:#c00;font-size:3mm">No code</div>':s.type==='qr'?await Barcode.qrSvg(code):Barcode.svg(code,40)}catch(e){g='<div style="color:#c00;font-size:3mm">QR needs internet once</div>'}
  const q=wide?h-4:Math.min(w-4,h*.62),gs=s.type==='qr'?`width:${q}mm;height:${q}mm;flex:none`:`width:100%;height:${wide?h*.42:h*.38}mm`,
  nm=s.name?`<div style="font-weight:700;font-size:${fs}mm;line-height:1.15;max-height:${fs*2.4}mm;overflow:hidden">${esc(p.name)}</div>`:'',cd=s.code&&code?`<div style="font-size:${fs*.85}mm">${esc(code)}</div>`:'',pr=s.price?`<div style="font-weight:800;font-size:${fs*1.25}mm">${inr(p.price)}</div>`:'';
  const inner=wide&&s.type==='qr'?`<div style="display:flex;gap:1.5mm;align-items:center;height:100%"><div style="${gs}">${g}</div><div style="flex:1;text-align:left;min-width:0">${nm}${cd}${pr}</div></div>`
   :`<div style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;height:100%;gap:.6mm">${nm}<div style="${gs};display:flex;justify-content:center">${g}</div><div style="display:flex;gap:2mm;align-items:baseline;justify-content:center;width:100%">${cd}${pr}</div></div>`;
  return `<div class="lbl" style="width:${w}mm;height:${h}mm;padding:1.2mm;box-sizing:border-box;overflow:hidden;background:#fff;color:#000;font-family:Arial,sans-serif;text-align:center">${inner}</div>`},
 async preview(){const p=this.prod(),el=$('#lprev');if(!p||!el)return;const [w,h]=this.dims(),k=Math.min(1.7,300/(w*3.78)),html=await this.html(p);if(!$('#lprev'))return;
  $('#lprev').innerHTML=`<div style="width:${w*3.78*k}px;height:${h*3.78*k}px;margin:auto"><div style="transform:scale(${k*1.0});transform-origin:0 0;width:${w}mm;height:${h}mm;zoom:1;box-shadow:0 2px 10px rgba(0,0,0,.25)">${html}</div></div>`},
 async print(){const p=this.prod();if(!p.bc)return toast('Generate a code first');const one=await this.html(p),n=Math.max(1,this.st.copies),[w,h]=this.dims();
  Print.raw(Array(n).fill(`<div class="pg">${one}</div>`).join(''),`${w}mm ${h}mm`,0)},
 /* thermal / ESC-POS raster */
 async canvas(p){const s=this.st,[w,h]=this.dims(),W=Math.min(Math.round(w*8),Paper.dots()),H=Math.round(h*8),cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),F='system-ui,sans-serif';
  c.fillStyle='#fff';c.fillRect(0,0,W,H);c.fillStyle='#000';c.textBaseline='top';c.textAlign='center';const fs=Math.max(14,Math.round(H/8));let y=4;
  const clip=(t,f)=>{c.font=f;t=String(t);while(t.length>1&&c.measureText(t).width>W-8)t=t.slice(0,-1);return t};
  if(s.name){const f=`700 ${fs}px ${F}`;c.fillText(clip(p.name,f),W/2,y);y+=fs+4}
  const bottom=(s.code?fs:0)+(s.price?fs+4:0)+8,area=Math.max(20,H-y-bottom);
  if(s.type==='qr'){const m=await Barcode.qr(p.bc),sz=Math.max(1,Math.floor(Math.min(area,W-8)/(m.n+2))),x0=Math.round((W-sz*m.n)/2);for(let r=0;r<m.n;r++)for(let k=0;k<m.n;k++)if(m.dark(r,k))c.fillRect(x0+k*sz,y+sz+r*sz,sz,sz);y+=sz*(m.n+2)}
  else{const mm=Barcode.mods(p.bc),tot=mm.reduce((a,b)=>a+b[1],0),u=Math.max(1,Math.floor((W-8)/(tot+20)));let x=Math.round((W-u*(tot+20))/2)+u*10;mm.forEach(([b,wd])=>{if(b)c.fillRect(x,y,wd*u,area);x+=wd*u});y+=area+4}
  if(s.code){c.font=`500 ${Math.round(fs*.85)}px ${F}`;c.fillText(p.bc,W/2,y);y+=fs}
  if(s.price){c.font=`800 ${Math.round(fs*1.2)}px ${F}`;c.fillText(inr(p.price),W/2,y)}
  return cv},
 async thermal(){const p=this.prod();if(!p.bc)return toast('Generate a code first');if(Native.on?!Native.has():DB.d.set.conn==='browser')return toast('Connect a thermal printer in Settings first');
  try{const cv=await this.canvas(p),W=cv.width,H=cv.height,px=cv.getContext('2d').getImageData(0,0,W,H).data,bw=Math.ceil(W/8),o=[],n=Math.max(1,this.st.copies);
   for(let k=0;k<n;k++){o.push(27,64);for(let y0=0;y0<H;y0+=128){const h=Math.min(128,H-y0);o.push(29,118,48,0,bw&255,bw>>8,h&255,h>>8);for(let y=y0;y<y0+h;y++)for(let bx=0;bx<bw;bx++){let v=0;for(let bit=0;bit<8;bit++){const x=bx*8+bit;if(x<W){const i=(y*W+x)*4;if(px[i]*.299+px[i+1]*.587+px[i+2]*.114<150)v|=128>>bit}}o.push(v)}}o.push(27,100,2)}
   await Thermal.send(new Uint8Array(o));toast('Labels sent to printer')}catch(e){toast('Printer: '+(e.message||e))}}
};
/* ---------- scanners ---------- */
async function openScanner(onCode){
 openSheet('<h3>Scan code</h3><video id="cv" playsinline muted style="width:100%;border-radius:16px;background:#000;min-height:230px"></video><p class="mut" id="cm">Point the camera at a barcode or QR code</p>');
 let last='',lt=0;const hit=c=>{const n=Date.now();if(c===last&&n-lt<1600)return;last=c;lt=n;navigator.vibrate&&navigator.vibrate(60);onCode(String(c))};
 try{if('BarcodeDetector' in window){const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}),v=$('#cv');if(!v){st.getTracks().forEach(t=>t.stop());return}v.srcObject=st;await v.play();
   const det=new BarcodeDetector(),loop=async()=>{if(!$('#cv'))return st.getTracks().forEach(t=>t.stop());try{const r=await det.detect(v);if(r[0])hit(r[0].rawValue)}catch(e){}setTimeout(loop,130)};loop()}
  else{await loadLib(ZXLIB);const rd=new ZXing.BrowserMultiFormatReader(),v=$('#cv');rd.decodeFromConstraints({video:{facingMode:'environment'}},v,(r,e)=>{if(r)hit(r.getText())});const w=setInterval(()=>{if(!$('#cv')){try{rd.reset()}catch(e){}clearInterval(w)}},500)}}
 catch(e){const m=$('#cm');if(m)m.textContent='Camera could not start. Allow camera permission and try again.'}}
function camScan(){openScanner(code=>{const p=find(code);if(p){addItem(p.id);toast('Added: '+p.name)}else toast('Not found: '+code)})}
/* USB / Bluetooth keyboard scanners (1D and 2D) type the code fast and press Enter */
(function(){let buf='',t=0;document.addEventListener('keydown',e=>{if(location.hash!=='#billing'||!DB.d.set.bcOn)return;if(/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))return;const n=Date.now();if(n-t>80)buf='';t=n;
 if(e.key==='Enter'){if(buf.length>=3){const p=find(buf);if(p){addItem(p.id);e.preventDefault()}else toast('Not found: '+buf)}buf='';return}if(e.key&&e.key.length===1)buf+=e.key})})();
