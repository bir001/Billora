/* CORE: storage, helpers, router, drawer, themes, sheet */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+(Math.round((+n||0)*100)/100).toLocaleString('en-IN');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtD=t=>new Date(t).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const V={},AFTER={};
const DEF={set:{name:'My Shop',addr:'',phone:'',gstin:'',head:'TAX INVOICE',hdr:'',foot:'Thank you! Visit again.',terms:'',pay:'',paper:'80',font:12,margin:2,copies:1,tpl:'classic',gst:true,logo:'',bcOn:true,kotOn:false,conn:'browser',pname:'',style:'txt',cw:0},
 cats:[],prods:[],custs:[],sups:[],bills:[],buys:[],rets:[],prets:[],kots:[],seq:1,kseq:1,rseq:1,did:'',sy:{h:{},stk:{},due:{},seen:{},since:0,bid:''}};
const DB={get k(){const b=(typeof Branch!=='undefined'&&Branch.cur)||'main';return b==='main'?'billora_pos_v2':'billora_pos_v2_'+b},d:null,
 load(){let x=null;try{x=JSON.parse(localStorage.getItem(this.k))}catch(e){}
  const d=this.d=Object.assign(structuredClone(DEF),x||{});d.set=Object.assign({},DEF.set,d.set);d.sy=Object.assign({},DEF.sy,d.sy);if(!d.did)d.did=uid();
  if(!x){d.cats=['Grocery','Snacks','Drinks'];d.prods=[['Rice 1kg','Grocery',60,48,5,50],['Sugar 1kg','Grocery',45,38,5,40],['Biscuit Pack','Snacks',10,8,12,100],['Chips','Snacks',20,16,12,60],['Cold Drink','Drinks',40,32,18,30],['Water Bottle','Drinks',20,12,0,80]].map(p=>({id:uid(),name:p[0],cat:p[1],price:p[2],cost:p[3],gst:p[4],stock:p[5],min:10,bc:'',img:''}));this.save()}},
 raw(){localStorage.setItem(this.k,JSON.stringify(this.d))},
 save(){this.raw();if(typeof Cloud!=='undefined')Cloud.touch()}};
const ME={name:'Owner',role:'owner'},can=()=>true;
const THEMES=[['royal','Royal Blue','#1F5BFF','#0B3BD6'],['midnight','Midnight','#4C8DFF','#050C20'],['ocean','Ocean','#0A93C9','#066E9C'],['indigo','Indigo','#3D4EF2','#2A33C9'],['emerald','Emerald','#12A150','#0A6B36'],['rose','Rose','#E11D69','#A3124B']];
const MENU=[['home','home','Dashboard'],['billing','receipt','Fast Billing'],['bills','file','All Bills'],['kot','kot','KOT Management'],['products','box','Products & Categories'],['stock','store','Inventory & Purchase'],['returns','undo','Returns'],['customers','users','Customers'],['suppliers','truck','Suppliers'],['reports','chart','Reports'],['plans','crown','Plans & Pricing'],['account','user','Account'],['settings','sliders','Billing Details & Printer']];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2300)}
function openSheet(h){$('#sheet-body').innerHTML=`<button class="sx" onclick="closeAll()" aria-label="Close">${I('x',18)}</button>`+h;$('#sheet').scrollTop=0;$('#sheet').classList.add('open');$('#ov').classList.add('on')}
function closeAll(){$$('video').forEach(v=>{v.srcObject&&v.srcObject.getTracks().forEach(t=>t.stop());v.remove()});$('#sheet').classList.remove('open');$('#drawer').classList.remove('open');$('#ov').classList.remove('on')}
const curTheme=()=>document.documentElement.dataset.theme||'royal';
function openDrawer(){const c=curTheme();
 $('#drawer').innerHTML=`<div class="dh"><div class="logo"><img class="lg-img" src="logo-sm.png" alt="Billora"><i class="wm">bill<span>ora</span></i></div><button class="ib" onclick="closeAll()">${I('x',20)}</button></div>
 <a class="dme" onclick="newBillGo()">${I('plus',22)}<div>New Bill<small>Start touch billing</small></div></a>
 <h5>Theme • ${THEMES.length} available</h5><div class="dth">${THEMES.map(t=>`<button class="${t[0]===c?'on':''}" onclick="setTheme('${t[0]}')"><i style="--c:${t[2]};--bgc:${t[3]}">${t[0]===c?I('check',16):''}</i><span>${t[1]}</span></button>`).join('')}</div>
 <h5>Menu</h5>${MENU.map(m=>`<a onclick="go('${m[0]}')">${I(m[1],21)} ${m[2]}</a>`).join('')}`;
 $('#drawer').classList.add('open');$('#ov').classList.add('on')}
function setTheme(n){document.documentElement.dataset.theme=n;localStorage.setItem('billora_theme',n);openDrawer()}
function go(n){closeAll();if(location.hash==='#'+n)render();else location.hash=n}
function newBillGo(){closeAll();if(typeof Cart!=='undefined'&&Cart.items.length)tabNew();else go('billing')}
function hdr(){const p=typeof Cloud!=='undefined'&&Cloud.prof,e=$('#hset');if(e)e.innerHTML=p?`<span class="avt">${esc((p.name||p.email||'U')[0].toUpperCase())}</span>`:I('user',22)}
function render(){if(typeof Cloud!=='undefined'&&Cloud.gate)return Cloud.screen();hdr();let n=location.hash.slice(1)||'home';if(!V[n])n='home';if(typeof Cloud!=='undefined'&&Cloud.blocked()&&!['plans','account','settings'].includes(n))n='paywall';document.body.classList.toggle('posmode',n==='billing');
 document.body.classList.toggle('posmode',n==='billing');$('#app').innerHTML=V[n]();(AFTER[n]||(()=>{}))();window.scrollTo(0,0);
 const L=[['home','home','Home'],['products','box','Items'],['billing','plus','New Bill'],['bills','file','Bills'],['reports','chart','Reports']];
 $('#nav').innerHTML=n==='billing'?'':L.map(m=>m[0]==='billing'?`<a class="fab" onclick="newBillGo()" aria-label="New Bill">${I('plus',30)}<span class="lab">New Bill</span></a>`:`<a class="${m[0]===n?'on':''}" onclick="go('${m[0]}')">${I(m[1],22)}<span>${m[2]}</span></a>`).join('')}
