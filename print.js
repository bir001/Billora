/* PRINT: any paper size, text or graphic ESC/POS, RawBT / Bluetooth / USB / system dialog */
const FMT={58:'2 inch',80:'3 inch',104:'4 inch',a5:'A5',a4:'A4',custom:'Custom'};
const Paper={
 sheet:()=>['a4','a5'].includes(DB.d.set.paper),
 mm(){const s=DB.d.set;return s.paper==='custom'?(+s.cw||80):({58:58,80:80,104:104}[s.paper]||80)},
 dots(){const s=DB.d.set;if(s.paper==='custom'){const m=this.mm();return Math.floor(m<=60?m-10:m-8)*8}return{58:384,80:576,104:832}[s.paper]||576},
 chars(){return Math.max(16,Math.floor(this.dots()/12))},
 label(){const s=DB.d.set;return FMT[s.paper]+(s.paper==='custom'?' '+this.mm()+'mm':'')}
};
const Print={
 html(b,kot){const s=DB.d.set,sh=Paper.sheet(),cp=s.tpl==='compact';
  const rows=b.items.map(i=>kot?`<tr><td>${esc(i.name)}</td><td class="r">x${i.qty}</td></tr>`:
   `<tr><td>${esc(i.name)}${sh||cp?'':`<br><small>${i.qty} x ${i.price}${s.gst&&i.gst?' +'+i.gst+'%':''}</small>`}</td>${sh||cp?`<td class="r">${i.qty}</td><td class="r">${i.price}</td>`:''}<td class="r">${(i.qty*i.price).toFixed(2)}</td></tr>`).join('');
  const head=kot?'':(sh||cp?'<tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr>':'');
  const line=(l,v)=>`<tr><td>${l}</td><td class="r">${v}</td></tr>`;
  return `<div class="rc ${sh?'a4':''}" style="${sh?(s.paper==='a5'?'max-width:520px;':''):`width:${Paper.mm()}mm;`}font-size:${s.font}px">
  ${s.logo&&!kot?`<div class="c"><img src="${esc(s.logo)}" style="max-height:60px"></div>`:''}<h2>${esc(kot?'KOT':s.name)}</h2>
  ${kot?'':`<div class="c">${esc(s.addr)}${s.phone?'<br>Ph: '+esc(s.phone):''}${s.gst&&s.gstin?'<br>GSTIN: '+esc(s.gstin):''}${s.hdr?'<br>'+esc(s.hdr):''}</div><div class="c"><b>${esc(b.head||s.head)}</b></div>`}
  <hr><div>${kot?'KOT':'Bill'} #${b.no} ${b.cancelled?'(CANCELLED)':''}<br>${fmtD(b.t)}${b.cust?'<br>Customer: '+esc(b.cust)+(b.phone?' ('+esc(b.phone)+')':''):''}${b.note?'<br>'+esc(b.note):''}</div><hr>
  <table>${head}${rows}</table><hr>
  ${kot?'':`<table>${line('Subtotal',b.sub.toFixed(2))}${b.disc?line('Discount','-'+b.disc.toFixed(2)):''}${s.gst&&b.tax?line('GST',b.tax.toFixed(2)):''}<tr class="t"><td>TOTAL</td><td class="r">${inr(b.total)}</td></tr>${line('Paid by',b.pay)}</table>
  ${s.pay?`<hr><div class="c">${esc(s.pay)}</div>`:''}${s.terms?`<hr><small>${esc(s.terms)}</small>`:''}<hr><div class="c">${esc(s.foot)}</div>`}</div>`},
 /* neutral line model used by both thermal encoders */
 model(b,kot,sym){const s=DB.d.set,m=[],T=(t,al=0,bd=0,sz=0)=>m.push({t:String(t),al,bd,sz}),LR=(l,r,bd=0,sz=0)=>m.push({l:String(l),r:String(r),bd,sz}),H=()=>m.push({hr:1}),f=x=>(+x).toFixed(2);
  T(kot?'KOT':s.name,1,1,1);
  if(!kot){if(s.addr)T(s.addr,1);if(s.phone)T('Ph: '+s.phone,1);if(s.gst&&s.gstin)T('GSTIN: '+s.gstin,1);if(s.hdr)T(s.hdr,1);T(b.head||s.head,1,1)}
  H();T((kot?'KOT #':'Bill #')+b.no+(b.cancelled?' (CANCELLED)':''));T(fmtD(b.t));if(b.cust)T('Customer: '+b.cust+(b.phone?' '+b.phone:''));if(b.note)T(b.note);H();
  b.items.forEach(i=>{if(kot)LR(i.name,'x'+i.qty);else{T(i.name);LR('   '+i.qty+' x '+i.price,f(i.qty*i.price))}});H();
  if(!kot){LR('Subtotal',f(b.sub));if(b.disc)LR('Discount','-'+f(b.disc));if(s.gst&&b.tax)LR('GST',f(b.tax));LR('TOTAL',sym+b.total,1,1);T('Paid by: '+b.pay);
   if(s.pay){H();T(s.pay,1)}if(s.terms){H();T(s.terms)}H();T(s.foot,1)}
  return m},
 /* TEXT mode: fastest, ASCII only */
 txt(b,kot,n){const w=Paper.chars(),m=this.model(b,kot,'Rs '),a=t=>t.replace(/[^\x20-\x7E]/g,'?'),o=[27,64];
  const ln=(al,bd,sz,t)=>{o.push(27,97,al,27,69,bd,29,33,sz?0x11:0);for(const ch of a(t))o.push(ch.charCodeAt(0));o.push(10)};
  for(let k=0;k<n;k++){m.forEach(x=>{if(x.hr)ln(0,0,0,'-'.repeat(w));else if(x.l!==undefined){const ww=x.sz?Math.floor(w/2):w,l=a(x.l),r=a(x.r),g=ww-l.length-r.length;ln(0,x.bd,x.sz,g>0?l+' '.repeat(g)+r:l.slice(0,Math.max(1,ww-r.length-1))+' '+r)}else ln(x.al,x.bd,x.sz,a(x.t))});
   o.push(27,97,0,27,69,0,29,33,0,27,100,4,29,86,66,0)}
  return new Uint8Array(o)},
 /* GRAPHIC mode: bill drawn as an image, works with every language & printer that supports ESC/POS raster */
 gfx(b,kot,n){const W=Paper.dots(),m=this.model(b,kot,'₹'),F='system-ui,"Noto Sans","Noto Sans Devanagari","Noto Sans Kannada",sans-serif';
  const wrap=(c,t,w)=>{const out=[];let cur='';for(const word of t.split(/\s+/)){const x=cur?cur+' '+word:word;if(c.measureText(x).width<=w)cur=x;else{if(cur)out.push(cur);cur=word;while(c.measureText(cur).width>w&&cur.length>1){let i=cur.length-1;while(i>1&&c.measureText(cur.slice(0,i)).width>w)i--;out.push(cur.slice(0,i));cur=cur.slice(i)}}}out.push(cur);return out};
  const paint=(c,draw)=>{let y=8;c.textBaseline='top';c.fillStyle='#000';
   for(const x of m){const sz=x.sz?34:24,lh=Math.round(sz*1.4);c.font=`${x.bd?'700':'500'} ${sz}px ${F}`;
    if(x.hr){if(draw)for(let i=0;i<W;i+=14)c.fillRect(i,y+6,8,2);y+=18;continue}
    if(x.l!==undefined){const rw=c.measureText(x.r).width;let l=x.l;while(l.length>1&&c.measureText(l).width>W-rw-14)l=l.slice(0,-1);if(draw){c.textAlign='left';c.fillText(l,0,y);c.textAlign='right';c.fillText(x.r,W,y)}y+=lh;continue}
    for(const t of wrap(c,x.t,W)){if(draw){c.textAlign=x.al===1?'center':'left';c.fillText(t,x.al===1?W/2:0,y)}y+=lh}}
   return y+36};
  const tc=document.createElement('canvas');tc.width=W;const H=paint(tc.getContext('2d'),false),cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);paint(c,true);
  const px=c.getImageData(0,0,W,H).data,bw=Math.ceil(W/8),o=[];
  for(let k=0;k<n;k++){o.push(27,64);for(let y0=0;y0<H;y0+=128){const h=Math.min(128,H-y0);o.push(29,118,48,0,bw&255,bw>>8,h&255,h>>8);
    for(let y=y0;y<y0+h;y++)for(let bx=0;bx<bw;bx++){let v=0;for(let bit=0;bit<8;bit++){const x=bx*8+bit;if(x<W){const i=(y*W+x)*4;if(px[i]*.299+px[i+1]*.587+px[i+2]*.114<150)v|=128>>bit}}o.push(v)}}
   o.push(27,100,4,29,86,66,0)}
  return new Uint8Array(o)},
 raw(h,size,margin){let st=$('#pgstyle');if(!st){st=document.createElement('style');st.id='pgstyle';document.head.appendChild(st)}
  st.textContent=`@page{size:${size};margin:${margin}mm}`;$('#printarea').innerHTML=h;setTimeout(()=>window.print(),150)},
 sys(b,kot){const s=DB.d.set,n=kot?1:Math.max(1,+s.copies||1),h=this.html(b,kot);
  this.raw(Array(n).fill(`<div class="pg">${h}</div>`).join(''),Paper.sheet()?s.paper.toUpperCase():Paper.mm()+'mm auto',s.margin)},
 run(b,kot){const s=DB.d.set;if(Paper.sheet()||s.conn==='browser')return this.sys(b,kot);
  const n=kot?1:Math.max(1,+s.copies||1);let bytes;try{bytes=s.style==='gfx'?this.gfx(b,kot,n):this.txt(b,kot,n)}catch(e){return this.sys(b,kot)}
  return Thermal.send(bytes).then(()=>toast(s.conn==='rawbt'?'Sent to RawBT':'Printing…')).catch(e=>{toast('Printer: '+(e.message||e));this.sys(b,kot)})},
 as(paper,id){DB.d.set.paper=paper;DB.save();this.run(DB.d.bills.find(x=>x.id===id))},
 page(){this.raw(`<div class="pg">${$('#app').innerHTML}</div>`,'A4',10)}
};
const FMTD={58:'58mm roll',80:'80mm roll',104:'104mm roll',a5:'148 × 210 mm',a4:'210 × 297 mm',custom:'Your own width'};
function fmtSheet(){const s=DB.d.set;openSheet(`<h3>Print format</h3><p class="mut">The bill is generated automatically in the size you pick</p>
 <div class="fmts">${Object.keys(FMT).map(f=>`<button class="${s.paper===f?'on':''}" onclick="setFmt('${f}')">${I('printer',22)}<b>${FMT[f]}</b><small>${f==='custom'?(s.cw||80)+'mm roll':FMTD[f]}</small></button>`).join('')}</div>
 <label class="lb">Custom roll width (mm)</label><input type="number" inputmode="numeric" value="${s.cw||''}" placeholder="e.g. 76" onchange="DB.d.set.cw=+this.value;setFmt('custom')">`)}
function setFmt(f){DB.d.set.paper=f;DB.save();closeAll();if($('#cbar'))cartBar();if(location.hash==='#settings')render()}
