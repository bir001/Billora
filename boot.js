DB.load();$('#hmenu').innerHTML=I('menu',22);$('#hset').innerHTML=I('sliders',21);
/* keyboard-safe layout: panels open from the top and fit the visible area */
const vv=window.visualViewport,setVh=()=>document.documentElement.style.setProperty('--vh',(vv?vv.height:innerHeight)+'px');
setVh();vv&&vv.addEventListener('resize',setVh);addEventListener('resize',setVh);
const isF=t=>t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName);
document.addEventListener('focusin',e=>{if(isF(e.target)){document.body.classList.add('kb');const t=e.target;setTimeout(()=>t.scrollIntoView({block:'center',behavior:'smooth'}),320)}});
document.addEventListener('focusout',()=>setTimeout(()=>{if(!isF(document.activeElement))document.body.classList.remove('kb')},150));
window.addEventListener('hashchange',render);render();
const t0=performance.now();let done=0;
function hideSplash(){if(done)return;done=1;const s=$('#splash');if(!s)return;setTimeout(()=>{s.classList.add('hide');setTimeout(()=>s.remove(),600)},Math.max(0,1100-(performance.now()-t0)))}
window.addEventListener('load',hideSplash);setTimeout(hideSplash,5000);
