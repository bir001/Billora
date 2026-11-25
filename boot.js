DB.load();$('#hset').innerHTML=I('user',22);$('#hmenu').innerHTML=I('dots',22);$('#hbt').innerHTML=I('bt',20)+'<i class="dot none"></i>';
const opens=+(localStorage.getItem('bl_open')||0);localStorage.setItem('bl_open',opens+1);if(opens<6)$('#hmenu').classList.add('pulse');
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
const vv=window.visualViewport,setVh=()=>document.documentElement.style.setProperty('--vh',(vv?vv.height:innerHeight)+'px');
setVh();vv&&vv.addEventListener('resize',setVh);addEventListener('resize',setVh);
const isF=t=>t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName);
document.addEventListener('focusin',e=>{if(isF(e.target)){document.body.classList.add('kb');const t=e.target;setTimeout(()=>t.scrollIntoView({block:'center',behavior:'smooth'}),320)}});
document.addEventListener('focusout',()=>setTimeout(()=>{if(!isF(document.activeElement))document.body.classList.remove('kb')},150));
window.addEventListener('hashchange',render);
const t0=performance.now();let done=0;
function hideSplash(){if(done)return;done=1;const s=$('#splash');if(!s)return;setTimeout(()=>{s.classList.add('hide');setTimeout(()=>s.remove(),600)},Math.max(0,1100-(performance.now()-t0)))}
setTimeout(()=>{if(!done){render();hideSplash()}},8000);
Cloud.init().catch(e=>console.warn(e)).finally(()=>{render();hideSplash();if(Native.on&&Native.has()){Native.raw('reconnect');setInterval(()=>Native.raw('status'),25000)}});
setTimeout(()=>{if(typeof Backup!=='undefined')Backup.auto()},9000);addEventListener('online',()=>{if(typeof Backup!=='undefined')Backup.auto()});
addEventListener('offline',()=>toast('You are offline — everything is saved on this device'));addEventListener('online',()=>toast('Back online — syncing your data'));
