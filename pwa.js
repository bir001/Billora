/* PWA: sticky install banner + service worker */
let DP=null;const noI=()=>sessionStorage.getItem('bl_noinst')||matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function showInstall(msg,btn){if(noI())return;const b=$('#inst');b.innerHTML=`<span class="logo-mark">B</span><div><b>Install Billora App</b>${msg}</div>${btn?'<button class="go" onclick="doInstall()">Install</button>':''}<button class="no" onclick="hideInstall(1)" aria-label="Close">${I('x',18)}</button>`;setTimeout(()=>b.classList.add('on'),1500)}
async function doInstall(){if(!DP)return;DP.prompt();await DP.userChoice;DP=null;hideInstall()}
function hideInstall(p){$('#inst').classList.remove('on');if(p)sessionStorage.setItem('bl_noinst','1')}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();DP=e;showInstall('Fast, full-screen, works offline',true)});
window.addEventListener('appinstalled',()=>hideInstall());
if(/iphone|ipad|ipod/i.test(navigator.userAgent))showInstall('Tap Share, then "Add to Home Screen"',false);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
