/* LABEL DESIGNER: draw your own label (text, barcode, QR, shape, line, icon, picture, time, border) and print it
   through ESC/POS, TSC (TSPL), ZPL or the system print dialog. Saved designs live in DB.d.labels. */
const FONTS={sans:'system-ui,"Noto Sans","Noto Sans Devanagari",sans-serif',serif:'Georgia,"Noto Serif",serif',mono:'"Courier New",monospace'};
const QSIZES=[[100,15],[92,15],[50,25],[63,11],[92,12],[100,65],[50,50],[38,25]];
const GLYPHS=['★','♥','✔','✘','☎','✉','⚠','♻','☺','✿','❄','☀','✂','⚡','☂','♪'];
const TFMT=['DD-MM-YYYY','DD/MM/YY','DD MMM YYYY','HH:mm','DD-MM-YYYY HH:mm','MMM YYYY'];
const SCH={
 text:[['text','Text','area'],['fs','Font size (mm)','num'],['font','Font','sel',{sans:'Sans',serif:'Serif',mono:'Mono'}],['b','Bold','tog'],['i','Italic','tog'],['u','Underline','tog'],['al','Align','sel',{l:'Left',c:'Center',r:'Right'}],['inv','White on black','tog']],
 barcode:[['text','Value','txt'],['show','Show text under bars','tog']],qr:[['text','Value','txt']],
 shape:[['kind','Shape','sel',{rect:'Rectangle',round:'Rounded',ellipse:'Ellipse'}],['sw','Line width (mm)','num'],['fill','Filled','tog']],
 line:[['sw','Thickness (mm)','num'],['dash','Dashed','tog']],icon:[['g','Icon','icons']],image:[['src','Picture','img']],
 time:[['fmt','Format','sel',Object.fromEntries(TFMT.map(f=>[f,f]))],['fs','Font size (mm)','num'],['b','Bold','tog'],['al','Align','sel',{l:'Left',c:'Center',r:'Right'}]],
 border:[['sw','Line width (mm)','num'],['r','Corner radius (mm)','num']]};
const COMMON=[['x','X (mm)','num'],['y','Y (mm)','num'],['w','Width (mm)','num'],['h','Height (mm)','num'],['rot','Rotate','sel',{0:'0°',90:'90°',180:'180°',270:'270°'}]];
const TNAME={text:'Text',barcode:'Barcode',qr:'QR code',shape:'Shape',line:'Line',icon:'Icon',image:'Picture',time:'Time',border:'Border'};
const newT=(o={})=>({id:uid(),name:'My label',w:50,h:25,paper:'gap',gap:2,mode:'auto',dir:0,tear:'off',shape:'rect',mirror:false,flip:false,dpi:203,els:[],...o});
const LD={T:null,sel:[],hist:[],redo:[],multi:false,show:true,zm:1,k:1,drag:null,QRC:{},IMG:{},vars:{name:'Item name',price:'₹99',code:'BL12345678',cat:'General'},
 sub(t,v){return String(t||'').replace(/\{(\w+)\}/g,(m,k)=>v&&v[k]!==undefined?v[k]:m)},
 fmtTime(f){const d=new Date(),p=n=>String(n).padStart(2,'0'),M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return f.replace('YYYY',d.getFullYear()).replace('YY',String(d.getFullYear()).slice(2)).replace('DD',p(d.getDate())).replace('MMM',M[d.getMonth()]).replace('MM',p(d.getMonth()+1)).replace('HH',p(d.getHours())).replace('mm',p(d.getMinutes()))},
 el(id){return this.T.els.find(e=>e.id===id)},
 bbox(e){const r=(e.rot||0)%180!==0,cx=e.x+e.w/2,cy=e.y+e.h/2,w=r?e.h:e.w,h=r?e.w:e.h;return{x:cx-w/2,y:cy-h/2,w,h}},
 async prep(T,v){for(const e of T.els){if(e.type==='qr'){const s=this.sub(e.text,v)||' ';if(!this.QRC[s]){try{const m=await Barcode.qr(s),d=new Uint8Array(m.n*m.n);for(let r=0;r<m.n;r++)for(let c=0;c<m.n;c++)d[r*m.n+c]=m.dark(r,c)?1:0;this.QRC[s]={n:m.n,d}}catch(x){}}}
  if(e.type==='image'&&e.src&&!this.IMG[e.src]){const im=new Image();im.onload=()=>{if($('#ldcv'))this.draw()};im.src=e.src;this.IMG[e.src]=im}}},
 rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()},
 wrap(c,t,w){const out=[];String(t).split('\n').forEach(par=>{let cur='';par.split(' ').forEach(wd=>{const x=cur?cur+' '+wd:wd;if(c.measureText(x).width<=w||!cur)cur=x;else{out.push(cur);cur=wd}});out.push(cur)});return out},
 paintEl(c,e,s,v){c.save();const w=e.w*s,h=e.h*s;c.translate((e.x+e.w/2)*s,(e.y+e.h/2)*s);c.rotate((e.rot||0)*Math.PI/180);c.translate(-w/2,-h/2);c.fillStyle='#000';c.strokeStyle='#000';const t=e.type;
  if(t==='text'||t==='time'){const str=t==='time'?this.fmtTime(e.fmt||TFMT[0]):this.sub(e.text,v),fs=(e.fs||3)*s;c.beginPath();c.rect(0,0,w,h);c.clip();if(e.inv){c.fillRect(0,0,w,h);c.fillStyle='#fff'}
   c.font=`${e.i?'italic ':''}${e.b?700:500} ${fs}px ${FONTS[e.font||'sans']}`;c.textBaseline='top';c.textAlign=e.al==='c'?'center':e.al==='r'?'right':'left';const x=e.al==='c'?w/2:e.al==='r'?w:0,lh=fs*1.2;
   this.wrap(c,str,w).forEach((ln,i)=>{c.fillText(ln,x,i*lh);if(e.u){const tw=c.measureText(ln).width,x0=e.al==='c'?x-tw/2:e.al==='r'?x-tw:x;c.fillRect(x0,i*lh+fs*1.05,tw,Math.max(1,fs*.07))}})}
  else if(t==='barcode'){const val=this.sub(e.text,v)||'0',m=Barcode.mods(val),tot=m.reduce((a,b)=>a+b[1],0)+20,th=e.show?Math.min(h*.3,3.4*s):0,bh=h-(th?th+.4*s:0),u=w/tot;let x=10*u;m.forEach(([b,wd])=>{if(b)c.fillRect(x,0,wd*u,bh);x+=wd*u});if(th){c.font=`500 ${th}px ${FONTS.sans}`;c.textAlign='center';c.textBaseline='top';c.fillText(val,w/2,bh+.4*s)}}
  else if(t==='qr'){const m=this.QRC[this.sub(e.text,v)||' '],z=Math.min(w,h);if(m){const u=z/(m.n+2);for(let r=0;r<m.n;r++)for(let k=0;k<m.n;k++)if(m.d[r*m.n+k])c.fillRect((k+1)*u,(r+1)*u,u+.3,u+.3)}else c.strokeRect(0,0,z,z)}
  else if(t==='shape'){const lw=Math.max(1,e.sw*s);c.lineWidth=lw;c.beginPath();if(e.kind==='ellipse')c.ellipse(w/2,h/2,Math.max(1,w/2-lw/2),Math.max(1,h/2-lw/2),0,0,7);else if(e.kind==='round')this.rr(c,lw/2,lw/2,w-lw,h-lw,Math.min(w,h)*.22);else c.rect(lw/2,lw/2,w-lw,h-lw);e.fill?c.fill():c.stroke()}
  else if(t==='line'){c.lineWidth=Math.max(1,e.sw*s);if(e.dash)c.setLineDash([3*s,2*s]);c.beginPath();c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke()}
  else if(t==='icon'){c.font=`${Math.min(w,h)*.92}px ${FONTS.sans}`;c.textAlign='center';c.textBaseline='middle';c.fillText(e.g||'★',w/2,h/2)}
  else if(t==='image'){const im=this.IMG[e.src];if(im&&im.complete&&im.naturalWidth)c.drawImage(im,0,0,w,h);else{c.strokeRect(0,0,w,h);c.beginPath();c.moveTo(0,0);c.lineTo(w,h);c.moveTo(w,0);c.lineTo(0,h);c.stroke()}}
  else if(t==='border'){const lw=Math.max(1,e.sw*s);c.lineWidth=lw;c.beginPath();this.rr(c,lw/2,lw/2,w-lw,h-lw,(e.r||0)*s);c.stroke()}
  c.restore()},
 paint(c,T,s,v,edit){c.fillStyle='#fff';c.fillRect(0,0,T.w*s,T.h*s);T.els.forEach(e=>this.paintEl(c,e,s,v));
  if(edit){c.save();c.strokeStyle='#0ea5a4';c.fillStyle='#0ea5a4';c.lineWidth=1.5;c.setLineDash([5,3]);this.sel.forEach(id=>{const e=this.el(id);if(!e)return;const b=this.bbox(e);c.strokeRect(b.x*s,b.y*s,b.w*s,b.h*s)});
   if(this.sel.length===1){const e=this.el(this.sel[0]);if(e){const b=this.bbox(e);c.setLineDash([]);c.fillRect((b.x+b.w)*s-6,(b.y+b.h)*s-6,12,12)}}c.restore()}},
 draw(){const cv=$('#ldcv');if(!cv)return;const T=this.T,d=window.devicePixelRatio||1;cv.width=Math.round(T.w*this.k*d);cv.height=Math.round(T.h*this.k*d);cv.style.width=T.w*this.k+'px';cv.style.height=T.h*this.k+'px';
  const c=cv.getContext('2d');c.save();if(T.shape!=='rect'){c.beginPath();if(T.shape==='ellipse')c.ellipse(cv.width/2,cv.height/2,cv.width/2,cv.height/2,0,0,7);else this.rr(c,0,0,cv.width,cv.height,Math.min(cv.width,cv.height)*.18);c.clip()}this.paint(c,T,this.k*d,this.vars,true);c.restore()},
 fit(){const a=$('#ldc');if(!a)return;const T=this.T,aw=a.clientWidth-32,ah=a.clientHeight-32;this.k=Math.max(1.5,Math.min(aw/T.w,ah/T.h)*this.zm)},
 /* ---------- screens ---------- */
 push(){this.hist.push(JSON.stringify(this.T.els));if(this.hist.length>60)this.hist.shift();this.redo=[]},
 undo(){if(this.hist.length<2)return;this.redo.push(this.hist.pop());this.T.els=JSON.parse(this.hist[this.hist.length-1]);this.sel=[];this.tools();this.draw()},
 redoo(){if(!this.redo.length)return;const s=this.redo.pop();this.hist.push(s);this.T.els=JSON.parse(s);this.sel=[];this.tools();this.draw()},
 async open(id){const t=DB.d.labels.find(x=>x.id===id);this.T=t?JSON.parse(JSON.stringify(t)):this.T;if(!this.T)return;this.sel=[];this.zm=1;this.hist=[JSON.stringify(this.T.els)];this.redo=[];this.multi=false;this.show=true;
  const o=$('#ld')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'ld'}));
  const tb=[['layout','Layout','LD.layouts()'],['trash','Delete','LD.del()'],['undo','Undo','LD.undo()'],['redo','Redo','LD.redoo()'],['copy','Copy','LD.copy()'],['rotate','Rotate','LD.rot()'],['check',this.multi?'Multi':'Single','LD.mm()'],['select','Selection','LD.selSheet()']];
  o.innerHTML=`<div class="ldt"><button onclick="LD.close()">${I('back',24)}</button><b id="ldti"></b><div style="display:flex"><button onclick="LD.zoom()" id="ldz">1.0x</button><button onclick="LD.setSheet()">${I('sliders',22)}</button></div></div><div class="ldc" id="ldc"><canvas id="ldcv"></canvas></div>
  <div class="ldtb">${tb.map(b=>`<button id="tb_${b[1]}" onclick="${b[2]}">${I(b[0],22)}<span>${b[1]}</span></button>`).join('')}</div><div class="ldtools" id="ldtools"></div>
  <div class="ldb"><button class="sq" onclick="LD.toggle()">${I('chev',22)}</button><button class="btn o" onclick="LD.save()">Save</button><button class="btn b" onclick="LD.printSheet()">${I('printer',18)} Print</button></div>`;
  $('#ldti').textContent=`${this.T.name} • ${this.T.w}×${this.T.h}mm`;this.fit();this.draw();this.tools();this.bind();await this.prep(this.T,this.vars);this.draw()},
 close(){const o=$('#ld');if(o)o.remove();if(location.hash==='#labels')render()},
 toggle(){this.show=!this.show;$('#ldtools').style.display=this.show?'grid':'none';this.fit();this.draw()},
 zoom(){this.zm=this.zm>=2?1:this.zm+.5;$('#ldz').textContent=this.zm.toFixed(1)+'x';this.fit();this.draw()},
 mm(){this.multi=!this.multi;const b=$('#tb_Single')||$('#tb_Multi');if(b){b.id=this.multi?'tb_Multi':'tb_Single';b.querySelector('span').textContent=this.multi?'Multi':'Single';b.classList.toggle('on',this.multi)}if(!this.multi&&this.sel.length>1)this.sel=this.sel.slice(0,1);this.tools();this.draw()},
 tools(){const t=$('#ldtools');if(!t)return;const e=this.sel.length===1?this.el(this.sel[0]):null;
  if(e){t.innerHTML=`<div class="ldpb"><button onclick="LD.sel=[];LD.tools();LD.draw()">${I('plus',18)} Add</button><button onclick="LD.edit()">Edit</button><button onclick="LD.fs(-.4)">A−</button><button onclick="LD.fs(.4)">A+</button><button onclick="LD.nudge(-.5,0)">←</button><button onclick="LD.nudge(.5,0)">→</button><button onclick="LD.nudge(0,-.5)">↑</button><button onclick="LD.nudge(0,.5)">↓</button><button onclick="LD.del()">${I('trash',18)}</button></div>`;return}
  const L=[['text','Text'],['barcode','Barcode'],['qr','QR Code'],['shape','Shape'],['line','Line'],['icon','Icon'],['image','Picture'],['time','Time'],['scan','Scan Code'],['border','Border']];
  t.innerHTML=L.map(x=>`<button onclick="LD.add('${x[0]}')">${I(({icon:'smile',scan:'scan',time:'clock'})[x[0]]||x[0],26)}<span>${x[1]}</span></button>`).join('')},
 async add(t){const T=this.T,D={text:{w:Math.min(T.w-2,30),h:5,text:'{name}',fs:3.4,b:0,i:0,u:0,al:'l',font:'sans',inv:0},barcode:{w:Math.min(T.w-2,36),h:Math.max(8,T.h*.4),text:'{code}',show:1},qr:{w:Math.min(T.h-2,T.w-2,16),h:Math.min(T.h-2,T.w-2,16),text:'{code}'},
  shape:{kind:'rect',w:Math.min(T.w-2,16),h:Math.min(T.h-2,8),sw:.3,fill:0},line:{w:Math.min(T.w-2,24),h:1,sw:.3,dash:0},icon:{w:6,h:6,g:'★'},image:{w:12,h:12,src:''},time:{w:25,h:4,fmt:'DD-MM-YYYY',fs:3,b:0,al:'l'},border:{x:.5,y:.5,w:T.w-1,h:T.h-1,sw:.3,r:0}}[t];
  if(t==='scan')return openScanner(code=>{closeAll();LD.addEl({type:'barcode',w:Math.min(T.w-2,36),h:Math.max(8,T.h*.4),text:code,show:1})});
  if(t==='image')return $('#imgpick')?$('#imgpick').click():this.pick();
  this.addEl({type:t,...D})},
 pick(){const i=document.createElement('input');i.type='file';i.accept='image/*';i.id='imgpick';i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>this.addEl({type:'image',w:14,h:14,src:r.result});r.readAsDataURL(f)};i.click()},
 async addEl(o){const T=this.T;if(o.x===undefined){o.x=Math.max(0,(T.w-o.w)/2);o.y=Math.max(0,(T.h-o.h)/2)}o.id=uid();T.els.push(o);this.sel=[o.id];await this.prep(T,this.vars);this.push();this.tools();this.draw()},
 del(){if(!this.sel.length)return toast('Select an item first');this.T.els=this.T.els.filter(e=>!this.sel.includes(e.id));this.sel=[];this.push();this.tools();this.draw()},
 copy(){if(!this.sel.length)return toast('Select an item first');const n=[];this.sel.forEach(id=>{const e=JSON.parse(JSON.stringify(this.el(id)));e.id=uid();e.x+=2;e.y+=2;this.T.els.push(e);n.push(e.id)});this.sel=n;this.push();this.draw()},
 rot(){if(!this.sel.length)return toast('Select an item first');this.sel.forEach(id=>{const e=this.el(id);e.rot=((e.rot||0)+90)%360});this.push();this.draw()},
 fs(d){const e=this.el(this.sel[0]);if(!e)return;if(e.fs)e.fs=Math.max(1,+(e.fs+d).toFixed(1));else{const k=d>0?1.1:.9;e.w*=k;e.h*=k}this.push();this.draw()},
 nudge(dx,dy){this.sel.forEach(id=>{const e=this.el(id);e.x+=dx;e.y+=dy});this.push();this.draw()},
 selSheet(){openSheet(`<h3>Items on this label</h3>${this.T.els.length?this.T.els.map(e=>`<div class="ar" onclick="LD.sel=['${e.id}'];closeAll();LD.tools();LD.draw()"><span class="ai">${I(({icon:'smile',time:'clock'})[e.type]||e.type,20)}</span><span class="at"><b>${TNAME[e.type]}</b><small>${esc((e.text||e.g||e.fmt||e.kind||'').toString().slice(0,40))}</small></span>${I('right',18)}</div>`).join(''):'<p class="mut">Nothing yet — add items from the tools below.</p>'}<button class="btn o w" style="margin-top:12px" onclick="LD.sel=LD.T.els.map(e=>e.id);closeAll();LD.tools();LD.draw()">Select all</button>`)},
 /* ---------- touch ---------- */
 bind(){const cv=$('#ldcv');cv.onpointerdown=e=>this.down(e);cv.onpointermove=e=>this.move(e);cv.onpointerup=cv.onpointercancel=()=>this.up()},
 pt(e){const r=$('#ldcv').getBoundingClientRect();return{x:(e.clientX-r.left)/this.k,y:(e.clientY-r.top)/this.k}},
 down(ev){const p=this.pt(ev),T=this.T,hs=4;ev.target.setPointerCapture&&ev.target.setPointerCapture(ev.pointerId);const s1=this.sel.length===1?this.el(this.sel[0]):null;
  if(s1){const b=this.bbox(s1);if(Math.abs(p.x-(b.x+b.w))<hs&&Math.abs(p.y-(b.y+b.h))<hs){this.drag={m:'rs',id:s1.id,sx:p.x,sy:p.y,w:s1.w,h:s1.h};return}}
  let hit=null;for(let i=T.els.length-1;i>=0;i--){const e=T.els[i];if(e.type==='border')continue;const b=this.bbox(e);if(p.x>=b.x-1&&p.x<=b.x+b.w+1&&p.y>=b.y-1&&p.y<=b.y+b.h+1){hit=e;break}}
  if(!hit){this.sel=[];this.tools();this.draw();return}
  if(this.multi){const i=this.sel.indexOf(hit.id);i>=0?this.sel.splice(i,1):this.sel.push(hit.id)}else if(!this.sel.includes(hit.id))this.sel=[hit.id];
  this.drag={m:'mv',sx:p.x,sy:p.y,o:this.sel.map(id=>{const e=this.el(id);return{id,x:e.x,y:e.y}}),moved:false};this.tools();this.draw()},
 move(ev){const d=this.drag;if(!d)return;const p=this.pt(ev),dx=p.x-d.sx,dy=p.y-d.sy,sn=v=>Math.round(v*2)/2;
  if(d.m==='mv'){if(Math.abs(dx)+Math.abs(dy)>.6)d.moved=true;d.o.forEach(o=>{const e=this.el(o.id);e.x=sn(o.x+dx);e.y=sn(o.y+dy)})}
  else{const e=this.el(d.id);e.w=Math.max(2,sn(d.w+dx));e.h=Math.max(1,sn(d.h+dy));if(e.type==='qr'||e.type==='icon')e.h=e.w;d.moved=true}this.draw()},
 async up(){const d=this.drag;this.drag=null;if(d&&d.moved){await this.prep(this.T,this.vars);this.push();this.draw()}},
 /* ---------- property sheet ---------- */
 edit(){const e=this.el(this.sel[0]);if(!e)return;const sc=[...(SCH[e.type]||[]),...COMMON],chips=(e.type==='text'||e.type==='barcode'||e.type==='qr')?`<div class="ldchips">${['{name}','{price}','{code}','{cat}','{date}'].map(v=>`<button onclick="LD.ins('${v}')">${v}</button>`).join('')}</div>`:'';
  openSheet(`<h3>${TNAME[e.type]}</h3>${chips}${sc.map(([k,l,kind,o])=>{const v=e[k]===undefined?'':e[k],id='f_'+k;
   if(kind==='area')return `<label class="lb">${l}</label><textarea id="${id}" rows="3">${esc(v)}</textarea>`;if(kind==='txt')return `<label class="lb">${l}</label><input id="${id}" value="${esc(v)}">`;if(kind==='num')return `<div style="display:inline-block;width:48%;vertical-align:top;margin-right:2%"><label class="lb">${l}</label><input id="${id}" type="number" step="0.1" value="${v}"></div>`;
   if(kind==='tog')return `<label class="lb">${l}</label><select id="${id}"><option value="1" ${v?'selected':''}>Yes</option><option value="0" ${!v?'selected':''}>No</option></select>`;
   if(kind==='sel')return `<label class="lb">${l}</label><select id="${id}">${Object.entries(o).map(([a,b])=>`<option value="${a}" ${String(v)===a||(!v&&a==='0')?'selected':''}>${b}</option>`).join('')}</select>`;
   if(kind==='icons')return `<input type="hidden" id="${id}" value="${esc(v)}"><div class="icg">${GLYPHS.map(g=>`<button class="${g===v?'on':''}" onclick="$('#${id}').value='${g}';$$('.icg button').forEach(b=>b.classList.toggle('on',b.textContent==='${g}'))">${g}</button>`).join('')}</div>`;
   if(kind==='img')return `<label class="lb">${l}</label><input type="file" accept="image/*" id="${id}">`;return ''}).join('')}<div class="acts"><button class="btn b" onclick="LD.apply()">Apply</button></div>`)},
 ins(t){const f=$('#f_text');if(!f)return;const a=f.selectionStart??f.value.length;f.value=f.value.slice(0,a)+t+f.value.slice(f.selectionEnd??a);f.focus()},
 async apply(){const e=this.el(this.sel[0]);[...(SCH[e.type]||[]),...COMMON].forEach(([k,l,kind])=>{const f=$('#f_'+k);if(!f||kind==='img')return;let v=f.value;if(kind==='num')v=+v||0;else if(kind==='tog')v=+v;else if(k==='rot')v=+v;e[k]=v});
  const fi=$('#f_src');const done=async()=>{if(e.type==='qr'||e.type==='icon')e.h=e.w;closeAll();await this.prep(this.T,this.vars);this.push();this.tools();this.draw()};
  if(fi&&fi.files&&fi.files[0]){const r=new FileReader();r.onload=()=>{e.src=r.result;done()};r.readAsDataURL(fi.files[0])}else done()},
 /* ---------- settings / create ---------- */
 form(T){const O=(v,o)=>Object.entries(o).map(([a,b])=>`<option value="${a}" ${String(v)===a?'selected':''}>${b}</option>`).join('');
  return `<label class="lb">Label name</label><input id="s_name" value="${esc(T.name)}"><div class="fg"><div><label class="lb">Width (mm)</label><input id="s_w" type="number" value="${T.w}"></div><div><label class="lb">Height (mm)</label><input id="s_h" type="number" value="${T.h}"></div></div>
  <label class="lb">Quick selection</label><div class="ldchips">${QSIZES.map(q=>`<button onclick="$('#s_w').value=${q[0]};$('#s_h').value=${q[1]}">${q[0]}×${q[1]}mm</button>`).join('')}</div>
  <details class="ds"><summary>Advanced settings</summary><label class="lb">Paper type</label><select id="s_paper">${O(T.paper,{gap:'Gap labels',cont:'Continuous',black:'Black mark'})}</select><label class="lb">Label gap (mm)</label><input id="s_gap" type="number" step="0.5" value="${T.gap}">
  <label class="lb">Print mode</label><select id="s_mode">${O(T.mode,{auto:'Auto (ESC/POS image)',tsc:'TSC command (TSPL)',zpl:'ZPL command'})}</select><label class="lb">Print direction</label><select id="s_dir">${O(T.dir,{0:'0°',90:'90° (swaps width/height)',180:'180°',270:'270° (swaps width/height)'})}</select>
  <label class="lb">Paper tearing</label><select id="s_tear">${O(T.tear,{off:'Tear off',strip:'Stripping',cut:'Cutting'})}</select><label class="lb">Print resolution</label><select id="s_dpi">${O(T.dpi,{203:'203 dpi (8 dots/mm)',300:'300 dpi (12 dots/mm)'})}</select>
  <label class="lb">Flip black / white (if the print comes out negative)</label><select id="s_flip">${O(T.flip?1:0,{0:'No',1:'Yes'})}</select></details>
  <details class="ds"><summary>More settings</summary><label class="lb">Label shape</label><select id="s_shape">${O(T.shape,{rect:'Rectangle',round:'Rounded',ellipse:'Ellipse'})}</select><label class="lb">Mirror mode</label><select id="s_mir">${O(T.mirror?1:0,{0:'Off',1:'On'})}</select></details>`},
 read(T){const g=k=>$('#s_'+k).value;T.name=g('name').trim()||'My label';T.w=Math.max(10,+g('w')||50);T.h=Math.max(8,+g('h')||25);T.paper=g('paper');T.gap=+g('gap')||0;T.mode=g('mode');T.dir=+g('dir');T.tear=g('tear');T.dpi=+g('dpi');T.flip=g('flip')==='1';T.shape=g('shape');T.mirror=g('mir')==='1'},
 newSheet(){openSheet(`<h3>New label</h3>${this.form(newT())}<button class="btn b w" onclick="LD.create()">Create</button>`)},
 create(){const T=newT();this.read(T);this.T=T;closeAll();this.open()},
 setSheet(){openSheet(`<h3>Label settings</h3>${this.form(this.T)}<button class="btn b w" onclick="LD.setApply()">Apply</button>`)},
 setApply(){this.read(this.T);closeAll();$('#ldti').textContent=`${this.T.name} • ${this.T.w}×${this.T.h}mm`;this.fit();this.draw()},
 save(){const D=DB.d,i=D.labels.findIndex(x=>x.id===this.T.id),c=JSON.parse(JSON.stringify(this.T));i>=0?D.labels[i]=c:D.labels.push(c);DB.save();toast('Label saved')},
 /* ---------- layouts ---------- */
 layouts(){const L=[['pbp','Name + barcode + price'],['pqp','Name + QR + price'],['bar','Barcode only'],['qrt','QR + text'],['big','Big price tag']];openSheet(`<h3>Layouts</h3><p class="mut">Replaces the items on this label</p>${L.map(l=>`<div class="ar" onclick="LD.lay('${l[0]}')"><span class="ai">${I('layout',20)}</span><span class="at"><b>${l[1]}</b></span>${I('right',18)}</div>`).join('')}`)},
 async lay(k){const T=this.T,w=T.w,h=T.h,m=1.5,t=(x,y,ww,hh,tx,fs,o={})=>({type:'text',x,y,w:ww,h:hh,text:tx,fs,b:0,i:0,u:0,al:'l',font:'sans',inv:0,...o}),
  bc=(x,y,ww,hh)=>({type:'barcode',x,y,w:ww,h:hh,text:'{code}',show:1}),qr=(x,y,z)=>({type:'qr',x,y,w:z,h:z,text:'{code}'});let E=[];const fs=Math.max(2,Math.min(h/6,4)),wide=w>=h*1.6;
  if(k==='pbp')E=wide?[t(m,m,w*.6,fs*1.6,'{name}',fs,{b:1}),bc(m,m+fs*1.7,w*.6,h-fs*1.7-m*2),t(w*.62,h/2-fs,w*.36-m,fs*2.4,'{price}',fs*1.9,{b:1,al:'r'})]:[t(m,m,w-m*2,fs*1.8,'{name}',fs,{b:1,al:'c'}),bc(m,m+fs*1.9,w-m*2,(h-fs*3.8-m*2)*.7),t(m,h-fs*2-m,w-m*2,fs*1.8,'{price}',fs*1.5,{b:1,al:'c'})];
  if(k==='pqp'){const z=Math.min(h-m*2,w*.4);E=[qr(m,(h-z)/2,z),t(z+m*2,m,w-z-m*3,fs*2.4,'{name}',fs,{b:1}),t(z+m*2,h-fs*2.6-m,w-z-m*3,fs*2.2,'{price}',fs*1.7,{b:1})]}
  if(k==='bar')E=[bc(m,m,w-m*2,h-m*2)];if(k==='qrt'){const z=Math.min(h-m*2,w*.45);E=[qr(m,(h-z)/2,z),t(z+m*2,m,w-z-m*3,h-m*2,'{name}\n{price}\n{code}',fs,{b:1})]}
  if(k==='big')E=[t(m,m,w-m*2,fs*1.6,'{name}',fs,{al:'c'}),t(m,m+fs*1.7,w-m*2,h-fs*1.7-m*2,'{price}',Math.min(h*.45,w*.22),{b:1,al:'c'})];
  E.forEach(e=>e.id=uid());this.T.els=E;this.sel=[];closeAll();await this.prep(this.T,this.vars);this.push();this.tools();this.draw()},
 /* ---------- printing ---------- */
 srcVars(id){const p=DB.d.prods.find(x=>x.id===id);if(!p)return this.vars;const d=new Date();return{name:p.name,price:inr(p.price),code:p.bc||'',cat:p.cat,date:d.toLocaleDateString('en-IN'),time:d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}},
 printSheet(){const T=this.T,P=DB.d.prods;openSheet(`<h3>Print label</h3><label class="lb">Fill with item</label><select id="pr_item" onchange="LD.prev()"><option value="">Sample values</option>${P.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
  <label class="lb">Copies</label><div class="row"><input id="pr_n" type="number" min="1" value="1" style="margin:0"><button class="btn o sm" onclick="const p=DB.d.prods.find(x=>x.id===$('#pr_item').value);$('#pr_n').value=Math.max(1,p?p.stock:1)">= stock</button></div>
  <label class="lb" style="margin-top:12px">Preview</label><div class="lprev"><canvas id="prv" style="max-width:100%;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.25)"></canvas></div><p class="muted" style="font-size:12px">Mode: ${({auto:'ESC/POS image',tsc:'TSC (TSPL)',zpl:'ZPL'})[T.mode]} • ${T.w}×${T.h}mm • ${T.dpi} dpi</p>
  <div class="acts"><button class="btn b" onclick="LD.doPrint(0)">${I('printer',18)} Print to printer</button><button class="btn o" onclick="LD.doPrint(1)">System print</button></div>`);this.prev()},
 async prev(){const v=this.srcVars($('#pr_item').value),T=this.T;await this.prep(T,v);const cv=$('#prv');if(!cv)return;const s=Math.min(5,300/T.w);cv.width=T.w*s;cv.height=T.h*s;this.paint(cv.getContext('2d'),T,s,v,false)},
 async bitmap(T,v,dpi){await this.prep(T,v);const dm=(dpi||T.dpi||203)/25.4,W=Math.round(T.w*dm),H=Math.round(T.h*dm),b=document.createElement('canvas');b.width=W;b.height=H;const bc=b.getContext('2d');
  if(T.mirror){bc.translate(W,0);bc.scale(-1,1)}this.paint(bc,T,dm,v,false);const sw=T.dir===90||T.dir===270,f=document.createElement('canvas');f.width=sw?H:W;f.height=sw?W:H;const c=f.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,f.width,f.height);
  if(T.dir===90){c.translate(H,0);c.rotate(Math.PI/2)}else if(T.dir===180){c.translate(W,H);c.rotate(Math.PI)}else if(T.dir===270){c.translate(0,W);c.rotate(Math.PI*1.5)}c.drawImage(b,0,0);return f},
 bits(cv){const W=cv.width,H=cv.height,px=cv.getContext('2d').getImageData(0,0,W,H).data,rb=Math.ceil(W/8),d=new Uint8Array(rb*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(px[i]*.299+px[i+1]*.587+px[i+2]*.114<150)d[y*rb+(x>>3)]|=128>>(x&7)}return{W,H,rb,d}},
 bytes(T,b,n){const A=s=>Array.from(s,ch=>ch.charCodeAt(0)),mm=x=>(Math.round(x*10)/10),sw=T.dir===90||T.dir===270,w=sw?T.h:T.w,h=sw?T.w:T.h,fl=T.flip;
  if(T.mode==='tsc'){const inv=Uint8Array.from(b.d,x=>fl?x:(~x)&255),head=`SIZE ${mm(w)} mm,${mm(h)} mm\r\n`+(T.paper==='black'?`BLINE ${T.gap} mm,0 mm\r\n`:T.paper==='cont'?'GAP 0 mm,0 mm\r\n':`GAP ${T.gap} mm,0 mm\r\n`)+'DIRECTION 0\r\n'+(T.tear==='strip'?'SET PEEL ON\r\n':T.tear==='cut'?'SET CUTTER ON\r\n':'SET TEAR ON\r\n')+`CLS\r\nBITMAP 0,0,${b.rb},${b.H},0,`,tail=`\r\nPRINT ${n},1\r\n`;
   return Uint8Array.from([...A(head),...inv,...A(tail)])}
  if(T.mode==='zpl'){const hex=Array.from(b.d,x=>((fl?(~x)&255:x)).toString(16).padStart(2,'0')).join('').toUpperCase(),tot=b.d.length;return Uint8Array.from(A(`^XA^PW${b.W}^LL${b.H}^FO0,0^GFA,${tot},${tot},${b.rb},${hex}^FS^PQ${n}^XZ`))}
  const o=[];for(let k=0;k<n;k++){o.push(27,64);for(let y0=0;y0<b.H;y0+=128){const hh=Math.min(128,b.H-y0);o.push(29,118,48,0,b.rb&255,b.rb>>8,hh&255,hh>>8);for(let i=y0*b.rb;i<(y0+hh)*b.rb;i++)o.push(fl?(~b.d[i])&255:b.d[i])}o.push(27,100,2)}return Uint8Array.from(o)},
 async doPrint(sys){const T=this.T,v=this.srcVars($('#pr_item').value),n=Math.max(1,+$('#pr_n').value||1);
  try{if(sys||(Native.on?!Native.has():DB.d.set.conn==='browser')){const cv=await this.bitmap(T,v,300),url=cv.toDataURL('image/png');Print.raw(Array(n).fill(`<div class="pg"><img src="${url}" style="width:${T.w}mm;height:${T.h}mm;display:block"></div>`).join(''),`${T.w}mm ${T.h}mm`,0);return}
   const b=this.bits(await this.bitmap(T,v));await Thermal.send(this.bytes(T,b,n));closeAll();toast('Label sent to printer')}catch(e){toast('Printer: '+(e.message||e))}}
};
V.labels=()=>{const L=DB.d.labels;return `<div class="pagehead"><div><h1>Label Designer</h1><p>Design and print your own labels</p></div><button class="btn b sm" onclick="LD.newSheet()">+ New</button></div>
 <div class="panel card" style="margin-bottom:16px"><div class="row"><div><b>Item stock labels</b><div class="muted" style="font-size:13px;margin-top:2px">Quick barcode / QR labels for your items</div></div><button class="btn o sm" onclick="Label.open()">Open</button></div></div>
 ${L.map(t=>`<div class="card kc"><div class="lcard"><div class="th2"><img data-lid="${t.id}" alt=""></div><div style="flex:1;min-width:0"><b>${esc(t.name)}</b><div class="muted" style="font-size:12.5px">${t.w}×${t.h}mm • ${t.els.length} items</div></div></div>
 <div class="acts"><button class="btn b sm" onclick="LD.open('${t.id}')">Edit</button><button class="btn o sm" onclick="LD.dup('${t.id}')">Duplicate</button><button class="btn o sm danger" onclick="LD.rm('${t.id}')">Delete</button></div></div>`).join('')||'<div class="emptybox">No custom labels yet. Tap + New to design one.</div>'}`};
AFTER.labels=async()=>{for(const t of DB.d.labels){const im=document.querySelector(`[data-lid="${t.id}"]`);if(!im)continue;try{const cv=await LD.bitmap(t,LD.vars,100);im.src=cv.toDataURL('image/png')}catch(e){}}};
LD.dup=id=>{const t=JSON.parse(JSON.stringify(DB.d.labels.find(x=>x.id===id)));t.id=uid();t.name+=' copy';DB.d.labels.push(t);DB.save();render()};
LD.rm=id=>Dlg.confirm('Delete this label design?',()=>{DB.d.labels=DB.d.labels.filter(x=>x.id!==id);DB.save();closeAll();render()},{yes:'Delete',danger:1});
