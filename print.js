/* PRINT: 58mm / 80mm / A4 receipts, KOT, copies, labels, PDF via print dialog */
const Print={
 html(b,kot){const s=DB.d.set,a4=s.paper==='a4',cp=s.tpl==='compact';
  const rows=b.items.map(i=>kot?`<tr><td>${esc(i.name)}</td><td class="r">x${i.qty}</td></tr>`:
   `<tr><td>${esc(i.name)}${a4||cp?'':`<br><small>${i.qty} x ${i.price}${s.gst&&i.gst?' +'+i.gst+'%':''}</small>`}</td>${a4||cp?`<td class="r">${i.qty}</td><td class="r">${i.price}</td>`:''}<td class="r">${(i.qty*i.price).toFixed(2)}</td></tr>`).join('');
  const head=kot?'':(a4||cp?'<tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr>':'');
  const line=(l,v)=>`<tr><td>${l}</td><td class="r">${v}</td></tr>`;
  return `<div class="rc ${a4?'a4':''}" style="${a4?'':`width:${s.paper}mm;`}font-size:${s.font}px">
  ${s.logo&&!kot?`<div class="c"><img src="${esc(s.logo)}" style="max-height:60px"></div>`:''}<h2>${esc(kot?'KOT':s.name)}</h2>
  ${kot?'':`<div class="c">${esc(s.addr)}${s.phone?'<br>Ph: '+esc(s.phone):''}${s.gst&&s.gstin?'<br>GSTIN: '+esc(s.gstin):''}${s.hdr?'<br>'+esc(s.hdr):''}</div><div class="c"><b>${esc(b.head||s.head)}</b></div>`}
  <hr><div>${kot?'KOT':'Bill'} #${b.no} ${b.cancelled?'(CANCELLED)':''}<br>${fmtD(b.t)}${b.cust?'<br>Customer: '+esc(b.cust):''}${b.note?'<br>'+esc(b.note):''}</div><hr>
  <table>${head}${rows}</table><hr>
  ${kot?'':`<table>${line('Subtotal',b.sub.toFixed(2))}${b.disc?line('Discount','-'+b.disc.toFixed(2)):''}${s.gst&&b.tax?line('GST',b.tax.toFixed(2)):''}<tr class="t"><td>TOTAL</td><td class="r">${inr(b.total)}</td></tr>${line('Paid by',b.pay)}</table>
  ${s.pay?`<hr><div class="c">${esc(s.pay)}</div>`:''}${s.terms?`<hr><small>${esc(s.terms)}</small>`:''}<hr><div class="c">${esc(s.foot)}</div>`}</div>`},
 raw(h,size,margin){let st=$('#pgstyle');if(!st){st=document.createElement('style');st.id='pgstyle';document.head.appendChild(st)}
  st.textContent=`@page{size:${size};margin:${margin}mm}`;$('#printarea').innerHTML=h;setTimeout(()=>window.print(),150)},
 run(b,kot){const s=DB.d.set,n=kot?1:Math.max(1,+s.copies||1),h=this.html(b,kot);
  this.raw(Array(n).fill(`<div class="pg">${h}</div>`).join(''),s.paper==='a4'?'A4':s.paper+'mm auto',s.margin)},
 page(){this.raw(`<div class="pg">${$('#app').innerHTML}</div>`,'A4',10)}
};
