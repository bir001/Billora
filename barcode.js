/* BARCODE: Code 39 generator (SVG) + label printing + camera scan */
const C39={0:'nnnwwnwnn',1:'wnnwnnnnw',2:'nnwwnnnnw',3:'wnwwnnnnn',4:'nnnwwnnnw',5:'wnnwwnnnn',6:'nnwwwnnnn',7:'nnnwnnwnw',8:'wnnwnnwnn',9:'nnwwnnwnn',A:'wnnnnwnnw',B:'nnwnnwnnw',C:'wnwnnwnnn',D:'nnnnwwnnw',E:'wnnnwwnnn',F:'nnwnwwnnn',G:'nnnnnwwnw',H:'wnnnnwwnn',I:'nnwnnwwnn',J:'nnnnwwwnn',K:'wnnnnnnww',L:'nnwnnnnww',M:'wnwnnnnwn',N:'nnnnwnnww',O:'wnnnwnnwn',P:'nnwnwnnwn',Q:'nnnnnnwww',R:'wnnnnnwwn',S:'nnwnnnwwn',T:'nnnnwnwwn',U:'wwnnnnnnw',V:'nwwnnnnnw',W:'wwwnnnnnn',X:'nwnnwnnnw',Y:'wwnnwnnnn',Z:'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','*':'nwnnwnwnn'};
const Barcode={
 svg(txt,h=40){const t='*'+String(txt).toUpperCase().replace(/[^0-9A-Z.\- ]/g,'')+'*';let x=0,r='';
  for(const ch of t){const p=C39[ch];for(let i=0;i<9;i++){const w=p[i]==='w'?3:1;if(i%2===0)r+=`<rect x="${x}" y="0" width="${w}" height="${h}"/>`;x+=w}x+=1}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${h}" preserveAspectRatio="none" fill="#000">${r}</svg>`},
 gen(){return 'BL'+String(Math.floor(Math.random()*1e8)).padStart(8,'0')},
 labels(p,n){if(!p.bc)return toast('Generate a barcode first');const s=DB.d.set,one=`<div class="pg lbl"><b>${esc(p.name.slice(0,22))}</b><br>${Barcode.svg(p.bc,30)}<br>${esc(p.bc)} • ${inr(p.price)}</div>`;
  Print.raw(Array(Math.max(1,n)).fill(one).join(''),'50mm 25mm',0)}
};
function find(code){const c=String(code).trim().toUpperCase();return DB.d.set.bcOn?DB.d.prods.find(p=>p.bc&&p.bc.toUpperCase()===c):null}
async function camScan(){if(!('BarcodeDetector' in window))return toast('Camera scan is not supported here. Use a scanner or type the code');
 try{openSheet('<h3>Barcode Scan</h3><video id="cv" playsinline muted style="width:100%;border-radius:16px"></video><p class="mut">Hold the barcode in front of the camera</p>');
 const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}),v=$('#cv');v.srcObject=st;await v.play();
 const det=new BarcodeDetector({formats:['code_39','code_128','ean_13','ean_8','upc_a']});
 const loop=async()=>{if(!$('#cv'))return st.getTracks().forEach(t=>t.stop());try{const r=await det.detect(v);const p=r[0]&&find(r[0].rawValue);if(p){addItem(p.id);toast('Added: '+p.name);await new Promise(s=>setTimeout(s,1300))}}catch(e){}requestAnimationFrame(loop)};loop()}catch(e){toast('Please allow camera access')}}
