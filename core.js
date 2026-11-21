/* CORE: storage, helpers, roles, router, drawer, sheet */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+(Math.round((+n||0)*100)/100).toLocaleString('en-IN');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtD=t=>new Date(t).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const V={},AFTER={};
const DEF={set:{name:'My Shop',addr:'',phone:'',gstin:'',head:'TAX INVOICE',hdr:'',foot:'Thank you! Visit again.',terms:'',pay:'',paper:'80',font:12,margin:2,copies:1,tpl:'classic',gst:true,logo:'',bcOn:true},
 cats:[],prods:[],custs:[],sups:[],bills:[],buys:[],rets:[],prets:[],kots:[],seq:1,kseq:1,rseq:1,dev:'',did:'',sy:{h:{},stk:{},due:{},seen:{},since:'',bid:''}};
const DB={k:'billora_pos_v2',d:null,
 load(){let x=null;try{x=JSON.parse(localStorage.getItem(this.k))}catch(e){}
  const d=this.d=Object.assign(structuredClone(DEF),x||{});d.set=Object.assign({},DEF.set,d.set);d.sy=Object.assign({},DEF.sy,d.sy);
  if(!d.did)d.did=uid();if(!d.dev)d.dev=String.fromCharCode(65+Math.floor(Math.random()*26));
  if(!x){d.cats=['Grocery','Snacks','Drinks'];d.prods=[['Rice 1kg','Grocery',60,48,5,50],['Sugar 1kg','Grocery',45,38,5,40],['Biscuit Pack','Snacks',10,8,12,100],['Chips','Snacks',20,16,12,60],['Cold Drink','Drinks',40,32,18,30],['Water Bottle','Drinks',20,12,0,80]].map(p=>({id:uid(),name:p[0],cat:p[1],price:p[2],cost:p[3],gst:p[4],stock:p[5],min:10,bc:'',img:''}));this.save()}},
 save(){localStorage.setItem(this.k,JSON.stringify(this.d));if(window.Cloud)Cloud.touch()}};
/* roles: owner=all, manager, cashier, staff */
let ME={name:'Owner',role:'owner'};
const PAGES={manager:['home','billing','bills','kot','products','stock','returns','customers','suppliers','reports'],cashier:['home','billing','bills','kot','customers'],staff:['home','billing','bills','products']};
const can=p=>ME.role==='owner'||(PAGES[ME.role]||[]).includes(p);
const MENU=[['home','🏠','Dashboard'],['billing','🧾','Fast Billing'],['bills','📄','All Bills'],['kot','🍽️','KOT Management'],['products','📦','Products & Categories'],['stock','🏬','Inventory & Purchase'],['returns','↩️','Returns'],['customers','👥','Customers'],['suppliers','🚚','Suppliers'],['reports','📊','Reports'],['staff','🛡️','Staff & Users'],['settings','⚙️','Settings & Printing']];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)}
function openSheet(h){$('#sheet-body').innerHTML=h;$('#sheet').classList.add('open');$('#ov').classList.add('on')}
function closeAll(){$$('video').forEach(v=>{v.srcObject&&v.srcObject.getTracks().forEach(t=>t.stop());v.remove()});$('#sheet').classList.remove('open');$('#drawer').classList.remove('open');$('#ov').classList.remove('on')}
function openDrawer(){$('#drawer').innerHTML=`<div class="dh"><b>Billora</b><button class="ib" onclick="closeAll()">✕</button></div><a class="dme"><div class="av sm">${esc(ME.name[0]||'U')}</div><div>${esc(ME.name)}<small>${ME.role}</small></div></a>`+MENU.filter(m=>can(m[0])).map(m=>`<a onclick="go('${m[0]}')">${m[1]} ${m[2]}</a>`).join('')+(window.Cloud&&Cloud.on?`<a onclick="Cloud.logout()">🚪 Logout</a>`:'');$('#drawer').classList.add('open');$('#ov').classList.add('on')}
function toggleTheme(){const o=['royal','midnight','ocean','indigo'],c=document.documentElement.dataset.theme||'royal',n=o[(o.indexOf(c)+1)%4];document.documentElement.dataset.theme=n;localStorage.setItem('billora_theme',n)}
function go(n){closeAll();if(location.hash==='#'+n)render();else location.hash=n}
function render(){if(window.Cloud&&Cloud.gate){$('#nav').innerHTML='';return Cloud.screen()}
 let n=location.hash.slice(1)||'home';if(!V[n]||!can(n))n='home';$('#app').innerHTML=V[n]();(AFTER[n]||(()=>{}))();window.scrollTo(0,0);
 $('#nav').innerHTML=[['home','🏠','Home'],['products','📦','Items'],['billing','🧾','Bill'],['bills','📄','Bills'],['reports','📊','Reports']].filter(m=>can(m[0])).map(m=>`<a class="${m[0]==='billing'?'fab':''} ${m[0]===n?'on':''}" onclick="go('${m[0]}')"><span style="font-size:20px">${m[1]}</span><span>${m[2]}</span></a>`).join('')}
