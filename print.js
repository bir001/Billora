/* PRINT: any paper size, 8 bill templates, text or graphic ESC/POS, native app / RawBT / Bluetooth / USB / system dialog */
const FMT={58:'2 inch',80:'3 inch',104:'4 inch',a5:'A5',a4:'A4',custom:'Custom'};
const FMTD={58:'58mm roll',80:'80mm roll',104:'104mm roll',a5:'148 × 210 mm',a4:'210 × 297 mm',custom:'Your own width'};
const TPLS=[['classic','Classic','Name, then qty × rate and amount'],['oneline','One line','Name   1x20   40'],['table','Table','Item | Qty | Rate | Amt'],['compact','Compact','Name   x2   amount'],['minimal','Minimal','Name ........ amount'],['gst','GST detail','Shows GST % on every item'],['bold','Bold','Bold items and big total'],['dotted','Dotted','Name .......... amount']];
const Paper={
 sheet:()=>['a4','a5'].includes(DB.d.set.paper),
 mm(){const s=DB.d.set;return s.paper==='custom'?(+s.cw||80):({58:58,80:80,104:104}[s.paper]||80)},
 dots(){const s=DB.d.set;if(s.paper==='custom'){const m=this.mm();return Math.floor(m<=60?m-10:m-8)*8}return{58:384,80:576,104:832}[s.paper]||576},
 chars(){return Math.max(16,Math.floor(this.dots()/12))},
 label(){const s=DB.d.set;return FMT[s.paper]+(s.paper==='custom'?' '+this.mm()+'mm':'')}
};
const SAMPLE={no:101,t:Date.now(),cust:'Ravi',phone:'',items:[{name:'Rice 1kg',qty:1,price:60,gst:5},{name:'Biscuit Pack',qty:2,price:10,gst:12},{name:'Cold Drink',qty:3,price:40,gst:18}],sub:200,disc:0,tax:16.4,total:216,pay:'Cash'};
const Print={busy:0,
 /* ---- neutral line model: text | LR | hr | cols ---- */
 model(b,kot,sym,tpl){const s=DB.d.set,tp=tpl||s.tpl,m=[],T=(t,al=0,bd=0,sz=0)=>m.push({t:String(t),al,bd,sz}),LR=(l,r,bd=0,sz=0,fill)=>m.push({l:String(l),r:String(r),bd,sz,fill}),H=()=>m.push({hr:1}),C=(c,bd=0)=>m.push({cols:c.map(x=>({t:String(x[0]),w:x[1],a:x[2]})),bd}),f=x=>(+x).toFixed(2);
  T(kot?'KOT':s.name,1,1,1);
  if(!kot){if(s.addr)T(s.addr,1);if(s.phone)T('Ph: '+s.phone,1);if(s.gst&&s.gstin)T('GSTIN: '+s.gstin,1);if(s.hdr)T(s.hdr,1);T(b.head||s.head,1,1)}
  H();T((kot?'KOT #':'Bill #')+b.no+(b.cancelled?' (CANCELLED)':''));T(fmtD(b.t));if(b.cust)T('Customer: '+b.cust+(b.phone?' '+b.phone:''));if(b.note)T(b.note);H();
  if(!kot&&tp==='table'){C([['Item',.44,'l'],['Qty',.12,'r'],['Rate',.22,'r'],['Amt',.22,'r']],1);H()}
  b.items.forEach(i=>{const a=f(i.qty*i.price),q=i.qty+'x'+i.price;
   if(kot)return LR(i.name,'x'+i.qty,1);
   if(tp==='oneline')C([[i.name,.5,'l'],[q,.27,'r'],[a,.23,'r']]);
   else if(tp==='bold')C([[i.name,.5,'l'],[q,.27,'r'],[a,.23,'r']],1);
   else if(tp==='table')C([[i.name,.44,'l'],[i.qty,.12,'r'],[i.price,.22,'r'],[a,.22,'r']]);
   else if(tp==='compact')C([[i.name,.64,'l'],['x'+i.qty,.12,'r'],[a,.24,'r']]);
   else if(tp==='minimal')LR(i.name,a);
   else if(tp==='dotted')LR(i.name+' x'+i.qty,a,0,0,'.');
   else if(tp==='gst'){T(i.name);LR('   '+i.qty+' x '+i.price+(i.gst?' +'+i.gst+'% GST':''),a)}
   else{T(i.name);LR('   '+i.qty+' x '+i.price,a)}});H();
  if(!kot){LR('Subtotal',f(b.sub));if(b.disc)LR('Discount','-'+f(b.disc));if(s.gst&&b.tax)LR('GST',f(b.tax));LR('TOTAL',sym+b.total,1,tp==='bold'||tp==='classic'||tp==='gst'?1:0);T('Paid by: '+b.pay);
   if(s.pay){H();T(s.pay,1)}if(s.terms){H();T(s.terms)}H();T(s.foot,1)}
  return m},
 fmtLine(x,w,a){const ww=x.sz?Math.floor(w/2):w;
  if(x.hr)return '-'.repeat(w);
  if(x.cols){let used=0;const tot=x.cols.reduce((s,c)=>s+c.w,0),L=x.cols.length;return x.cols.map((c,i)=>{const n=i===L-1?ww-used:Math.floor(ww*c.w/tot);used+=n;let t=a(c.t);const mx=(c.a==='l'&&i<L-1)?n-1:n;if(t.length>mx)t=t.slice(0,Math.max(0,mx));const p=n-t.length;return c.a==='r'?' '.repeat(p)+t:t+' '.repeat(p)}).join('')}
  if(x.l!==undefined){const l=a(x.l),r=a(x.r),g=ww-l.length-r.length;return g>0?l+(x.fill||' ').repeat(g)+r:l.slice(0,Math.max(1,ww-r.length-1))+' '+r}
  const t=a(x.t);return x.al===1&&t.length<ww?' '.repeat((ww-t.length)>>1)+t:t},
 preview(tpl){const w=Paper.chars(),a=t=>String(t).replace(/[^\x20-\x7E]/g,'?');return this.model(SAMPLE,false,'Rs ',tpl).map(x=>this.fmtLine(x,w,a)).join('\n')},
 /* ---- TEXT mode (fast, ASCII) ---- */
 txt(b,kot,n){const w=Paper.chars(),m=this.model(b,kot,'Rs '),a=t=>String(t).replace(/[^\x20-\x7E]/g,'?'),o=[27,64];
  for(let k=0;k<n;k++){m.forEach(x=>{o.push(27,97,0,27,69,x.bd?1:0,29,33,x.sz?0x11:0);for(const ch of this.fmtLine(x,w,a))o.push(ch.charCodeAt(0));o.push(10)});o.push(27,69,0,29,33,0,27,100,4,29,86,66,0)}
  return new Uint8Array(o)},
 /* ---- GRAPHIC mode (any language) ---- */
 gfx(b,kot,n){const W=Paper.dots(),m=this.model(b,kot,'₹'),F='system-ui,"Noto Sans","Noto Sans Devanagari","Noto Sans Kannada",sans-serif';
  const wrap=(c,t,w)=>{const out=[];let cur='';for(const word of t.split(/\s+/)){const x=cur?cur+' '+word:word;if(c.measureText(x).width<=w)cur=x;else{if(cur)out.push(cur);cur=word;while(c.measureText(cur).width>w&&cur.length>1){let i=cur.length-1;while(i>1&&c.measureText(cur.slice(0,i)).width>w)i--;out.push(cur.slice(0,i));cur=cur.slice(i)}}}out.push(cur);return out};
  const clip=(c,t,w)=>{t=String(t);while(t.length>1&&c.measureText(t).width>w)t=t.slice(0,-1);return t};
  const paint=(c,draw)=>{let y=8;c.textBaseline='top';c.fillStyle='#000';
   for(const x of m){const sz=x.sz?34:24,lh=Math.round(sz*1.4);c.font=`${x.bd?'700':'500'} ${sz}px ${F}`;
    if(x.hr){if(draw)for(let i=0;i<W;i+=14)c.fillRect(i,y+6,8,2);y+=18;continue}
    if(x.cols){if(draw){const tot=x.cols.reduce((s,k)=>s+k.w,0);let x0=0;for(const k of x.cols){const cw=W*k.w/tot;c.textAlign=k.a==='r'?'right':'left';c.fillText(clip(c,k.t,cw-6),k.a==='r'?x0+cw:x0,y);x0+=cw}}y+=lh;continue}
    if(x.l!==undefined){const rw=c.measureText(x.r).width;if(draw){c.textAlign='left';c.fillText(clip(c,x.l,W-rw-14),0,y);c.textAlign='right';c.fillText(x.r,W,y);if(x.fill){c.fillStyle='#000';const lw=c.measureText(clip(c,x.l,W-rw-14)).width;c.textAlign='left';for(let px=lw+8;px<W-rw-8;px+=10)c.fillRect(px,y+lh-10,3,3)}}y+=lh;continue}
    for(const t of wrap(c,x.t,W)){if(draw){c.textAlign=x.al===1?'center':'left';c.fillText(t,x.al===1?W/2:0,y)}y+=lh}}
   return y+36};
  const tc=document.createElement('canvas');tc.width=W;const H=paint(tc.getContext('2d'),false),cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);paint(c,true);
  const px=c.getImageData(0,0,W,H).data,bw=Math.ceil(W/8),o=[];
  for(let k=0;k<n;k++){o.push(27,64);for(let y0=0;y0<H;y0+=128){const h=Math.min(128,H-y0);o.push(29,118,48,0,bw&255,bw>>8,h&255,h>>8);
    for(let y=y0;y<y0+h;y++)for(let bx=0;bx<bw;bx++){let v=0;for(let bit=0;bit<8;bit++){const x=bx*8+bit;if(x<W){const i=(y*W+x)*4;if(px[i]*.299+px[i+1]*.587+px[i+2]*.114<150)v|=128>>bit}}o.push(v)}}
   o.push(27,100,4,29,86,66,0)}
  return new Uint8Array(o)},
 /* ---- HTML (system print / app print / A4 & A5 sheets) ---- */
 htmlSheet(b,kot){const s=DB.d.set,cp=s.tpl==='compact'||s.tpl==='table';
  const rows=b.items.map(i=>kot?`<tr><td>${esc(i.name)}</td><td class="r">x${i.qty}</td></tr>`:`<tr><td>${esc(i.name)}</td><td class="r">${i.qty}</td><td class="r">${i.price}</td>${s.gst&&!cp?`<td class="r">${i.gst||0}%</td>`:''}<td class="r">${(i.qty*i.price).toFixed(2)}</td></tr>`).join('');
  const head=kot?'':`<tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th>${s.gst&&!cp?'<th class="r">GST</th>':''}<th class="r">Amt</th></tr>`,line=(l,v)=>`<tr><td>${l}</td><td class="r">${v}</td></tr>`;
  return `<div class="rc a4" style="${s.paper==='a5'?'max-width:520px;':''}font-size:${s.font}px">${s.logo&&!kot?`<div class="c"><img src="${esc(s.logo)}" style="max-height:60px"></div>`:''}<h2>${esc(kot?'KOT':s.name)}</h2>
  ${kot?'':`<div>${esc(s.addr)}${s.phone?'<br>Ph: '+esc(s.phone):''}${s.gst&&s.gstin?'<br>GSTIN: '+esc(s.gstin):''}${s.hdr?'<br>'+esc(s.hdr):''}</div><p><b>${esc(b.head||s.head)}</b></p>`}
  <hr><div>${kot?'KOT':'Bill'} #${b.no} • ${fmtD(b.t)}${b.cust?' • '+esc(b.cust)+(b.phone?' ('+esc(b.phone)+')':''):''}${b.note?' • '+esc(b.note):''}</div><hr><table>${head}${rows}</table><hr>
  ${kot?'':`<table>${line('Subtotal',b.sub.toFixed(2))}${b.disc?line('Discount','-'+b.disc.toFixed(2)):''}${s.gst&&b.tax?line('GST',b.tax.toFixed(2)):''}<tr class="t"><td>TOTAL</td><td class="r">${inr(b.total)}</td></tr>${line('Paid by',b.pay)}</table>${s.pay?`<hr><div>${esc(s.pay)}</div>`:''}${s.terms?`<hr><small>${esc(s.terms)}</small>`:''}<hr><div class="c">${esc(s.foot)}</div>`}</div>`},
 html(b,kot){if(Paper.sheet())return this.htmlSheet(b,kot);const s=DB.d.set,sz=x=>x.sz?'font-size:1.35em;':'',bd=x=>x.bd?'font-weight:700;':'';
  const rows=this.model(b,kot,'₹').map(x=>x.hr?'<div class="hr2"></div>':x.cols?`<div class="cr" style="grid-template-columns:${x.cols.map(c=>c.w+'fr').join(' ')};${bd(x)}">${x.cols.map(c=>`<span style="text-align:${c.a==='r'?'right':'left'}">${esc(c.t)}</span>`).join('')}</div>`:x.l!==undefined?`<div class="lr ${x.fill?'dot':''}" style="${bd(x)}${sz(x)}"><span>${esc(x.l)}</span><span>${esc(x.r)}</span></div>`:`<div style="text-align:${x.al===1?'center':'left'};${bd(x)}${sz(x)}">${esc(x.t)}</div>`).join('');
  return `<div class="rc" style="width:${Paper.mm()}mm;font-size:${s.font}px">${s.logo&&!kot?`<div class="c"><img src="${esc(s.logo)}" style="max-height:60px"></div>`:''}${rows}</div>`},
 raw(h,size,margin){const css=`body{margin:0;font-family:monospace}.pg{page-break-after:always}`;
  if(Native.on){const rules=[...document.styleSheets].flatMap(sh=>{try{return[...sh.cssRules]}catch(e){return[]}}).filter(r=>r.selectorText&&/^\.(rc|lbl)/.test(r.selectorText)).map(r=>r.cssText).join('');
   return Native.raw('printHtml',`<html><head><meta name="viewport" content="width=device-width"><style>@page{size:${size};margin:${margin}mm}${css}${rules}</style></head><body>${h}</body></html>`,size)}
  let st=$('#pgstyle');if(!st){st=document.createElement('style');st.id='pgstyle';document.head.appendChild(st)}
  st.textContent=`@page{size:${size};margin:${margin}mm}`;$('#printarea').innerHTML=h;setTimeout(()=>window.print(),150)},
 sys(b,kot){const s=DB.d.set,n=kot?1:Math.max(1,+s.copies||1),h=this.html(b,kot);
  this.raw(Array(n).fill(`<div class="pg">${h}</div>`).join(''),Paper.sheet()?s.paper.toUpperCase():Paper.mm()+'mm auto',s.margin)},
 run(b,kot){const s=DB.d.set;
  if(Paper.sheet()||(Native.on?!Native.has():s.conn==='browser')){if(Native.on&&!Paper.sheet())toast('No printer selected — Settings > Printer');return this.sys(b,kot)}
  const n=kot?1:Math.max(1,+s.copies||1);let bytes;try{bytes=s.style==='gfx'?this.gfx(b,kot,n):this.txt(b,kot,n)}catch(e){return this.sys(b,kot)}
  return Thermal.send(bytes).then(()=>{if(!Native.on)toast(s.conn==='rawbt'?'Sent to RawBT':'Printing…')}).catch(e=>{toast('Printer: '+(e.message||e));this.sys(b,kot)})},
 as(paper,id){DB.d.set.paper=paper;DB.save();this.run(DB.d.bills.find(x=>x.id===id))},
 page(){this.raw(`<div class="pg">${$('#app').innerHTML}</div>`,'A4',10)}
};
function fmtSheet(){const s=DB.d.set;openSheet(`<h3>Print format</h3><p class="mut">The bill is generated automatically in the size you pick</p>
 <div class="fmts">${Object.keys(FMT).map(f=>`<button class="${s.paper===f?'on':''}" onclick="setFmt('${f}')">${I('printer',22)}<b>${FMT[f]}</b><small>${f==='custom'?(s.cw||80)+'mm roll':FMTD[f]}</small></button>`).join('')}</div>
 <label class="lb">Custom roll width (mm)</label><input type="number" inputmode="numeric" value="${s.cw||''}" placeholder="e.g. 76" onchange="DB.d.set.cw=+this.value;setFmt('custom')">`)}
function setFmt(f){DB.d.set.paper=f;DB.save();closeAll();if($('#cbar'))cartBar();if(location.hash==='#settings')render()}
function tplSheet(){const s=DB.d.set;openSheet(`<h3>Bill template</h3><p class="mut">Pick how items appear on the bill (${TPLS.length} styles)</p>${TPLS.map(t=>`<button class="tpl ${s.tpl===t[0]?'on':''}" onclick="setTpl('${t[0]}')"><div class="row"><b>${t[1]}</b>${s.tpl===t[0]?I('check',18):''}</div><small>${t[2]}</small><pre>${esc(Print.preview(t[0]))}</pre></button>`).join('')}`)}
function setTpl(t){DB.d.set.tpl=t;DB.save();closeAll();if(location.hash==='#settings')render();toast('Template: '+(TPLS.find(x=>x[0]===t)||[])[1])}
