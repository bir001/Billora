/* CLOUD: Firebase login, subscription state, branches, offline-first sync (per-record + stock/due movements) */
const COLS=['prods','custs','sups','bills','buys','rets','prets','kots'];
const Sub={
 cache(){try{return JSON.parse(localStorage.getItem('bl_sub'))}catch(e){return null}},
 plans(){try{const p=JSON.parse(localStorage.getItem('bl_plans'));if(p&&p.length)return p}catch(e){}return DEFAULT_PLANS},
 plan(){const s=this.cache();return s&&this.plans().find(p=>p.id===s.plan)},
 state(){const s=this.cache();if(!s)return{k:'none'};if(s.status==='suspended')return{k:'suspended'};const now=Date.now();
  if(now<=s.accessUntil){const left=Math.max(0,Math.ceil(((s.plan==='trial'?s.trialEnds:s.planEnds)-now)/864e5));return{k:s.plan==='trial'?'trial':'active',left,plan:s.plan,grace:left===0&&(s.plan==='trial'?s.trialEnds:s.planEnds)<now}}
  return{k:'expired'}},
 limit(){const s=this.state();if(s.k==='trial')return{branches:3,cloud:true};const p=this.plan();return{branches:p?p.limits.branches:1,cloud:p?p.cloud!==false:false}},
 label(){const s=this.state(),p=this.plan();return s.k==='trial'?'Free trial':s.k==='active'?(p?p.name:'Active'):s.k==='expired'?'Expired':s.k==='suspended'?'Suspended':'—'}
};
const Branch={cur:localStorage.getItem('bl_branch')||'main',
 list(){const p=Cloud.prof;return(p&&p.branches&&p.branches.length)?p.branches:[{id:'main',name:'Main branch'}]},
 name(){const b=this.list().find(x=>x.id===this.cur);return b?b.name:'Main branch'},
 go(id){localStorage.setItem('bl_branch',id);localStorage.removeItem('billora_tabs');location.reload()},
 async add(){const n=(prompt('Branch name?')||'').trim();if(!n)return;if(this.list().length>=Sub.limit().branches)return toast('Branch limit reached — upgrade your plan');
  try{await Cloud.db.doc('users/'+Cloud.user.uid).update({branches:[...this.list(),{id:'b'+uid(),name:n}]});toast('Branch added');}catch(e){toast('Could not add branch')}}
};
const Cloud={enabled:false,on:false,sync:false,gate:false,user:null,prof:null,db:null,auth:null,isAdmin:false,warn:'',msg:'',_t:null,_busy:false,_again:false,_chg:false,_un:null,
 ui(t){const e=$('#cs');if(e)e.textContent=t},
 tm(p,ms=12000){return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))])},
 blocked(){if(!this.enabled)return false;const k=Sub.state().k;return k==='expired'||k==='suspended'},
 form(k,o){const x={...o};if(k==='prods')delete x.stock;if(k==='custs')delete x.due;return x},
 async init(){if(!FIREBASE_CONFIG.apiKey)return;this.enabled=true;
  if(!window.firebase){const c=localStorage.getItem('bl_prof');if(c){this.prof=JSON.parse(c);this.warn='Offline mode';ME.name=this.prof.name||'Owner';return}this.gate='login';this.msg='Internet is needed for the first login.';return}
  firebase.initializeApp(FIREBASE_CONFIG);this.auth=firebase.auth();this.db=firebase.firestore();try{this.db.settings({experimentalAutoDetectLongPolling:true})}catch(e){}
  try{await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)}catch(e){}
  const u=await new Promise(res=>{const un=this.auth.onAuthStateChanged(x=>{un();res(x)})});
  if(!u){this.gate='login';return}
  this.user=u;await this.profile();
  this.on=true;this.listenProfile();this.isAdmin=await this.tm(this.db.doc('admins/'+u.uid).get(),5000).then(s=>s.exists).catch(()=>false);
  if(this.warn)setTimeout(()=>toast('Cloud not connected: '+this.warn),1500);this.loadPlans();setInterval(()=>this.beat(),600000);this.beat();
  if(Sub.limit().cloud&&!this.blocked())await this.startSync().catch(e=>console.warn(e))},
 errText(e){const c=(e&&e.code||'').replace('firestore/','');
  if(c==='permission-denied')return 'Database says permission denied — publish firestore.rules in Firebase (Firestore > Rules).';
  if(c==='not-found')return 'Firestore database is not created yet (Firebase > Firestore Database > Create).';
  if(c==='unavailable'||(e&&e.message==='timeout'))return 'Cannot reach the database. Check internet, and that Firestore is created.';
  return (c||'error')+': '+((e&&e.message)||'').slice(0,90)},
 fallback(){const m=JSON.parse(localStorage.getItem('bl_pending')||'{}'),t0=+(this.user.metadata&&this.user.metadata.createdAt)||Date.now(),ends=t0+TRIAL_DAYS*864e5;
  return{email:this.user.email,name:m.name||(this.user.email||'').split('@')[0],phone:m.phone||'',shop:m.shop||'',createdAt:t0,plan:'trial',status:'trial',trialEnds:ends,planEnds:0,accessUntil:ends,branches:[{id:'main',name:'Main branch'}],lead:{status:'new',note:''},lastActive:Date.now(),stats:{bills:0},local:true}},
 async profile(){const ref=this.db.doc('users/'+this.user.uid);let d=null,err=null;
  for(let k=0;k<2&&!d;k++){try{const s=await this.tm(ref.get(),15000);d=s.exists?s.data():null;err=null;
   if(!s.exists){const x=this.fallback();delete x.local;await this.tm(ref.set(x),15000);d=x;localStorage.removeItem('bl_pending')}}catch(e){err=e;d=null;await new Promise(r=>setTimeout(r,800))}}
  if(!d){const c=localStorage.getItem('bl_prof');d=c?JSON.parse(c):this.fallback();this.warn=this.errText(err);console.warn('profile',err)}else this.warn='';
  this.setProf(d)},
 setProf(d){this.prof=d;ME.name=d.name||'Owner';localStorage.setItem('bl_prof',JSON.stringify(d));
  localStorage.setItem('bl_sub',JSON.stringify({plan:d.plan,status:d.status,accessUntil:d.accessUntil,planEnds:d.planEnds,trialEnds:d.trialEnds,v:Date.now()}));
  if(!d.branches.some(b=>b.id===Branch.cur)){Branch.cur='main';localStorage.setItem('bl_branch','main')}},
 listenProfile(){let first=true;this.db.doc('users/'+this.user.uid).onSnapshot(s=>{if(!s.exists)return;const was=JSON.stringify(Sub.state());this.setProf(s.data());
  if(first){first=false;return}if(was!==JSON.stringify(Sub.state()))location.reload();else if(!/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName||''))render()},()=>{})},
 async loadPlans(){try{const q=await this.tm(this.db.collection('plans').get(),6000);const l=q.docs.map(d=>({id:d.id,...d.data()}));if(l.length)localStorage.setItem('bl_plans',JSON.stringify(l.sort((a,b)=>(a.m||0)-(b.m||0))))}catch(e){}},
 beat(){if(!navigator.onLine||!this.on)return;this.db.doc('users/'+this.user.uid).update({lastActive:Date.now(),stats:{bills:DB.d.bills.length,items:DB.d.prods.length},ua:(navigator.userAgent||'').slice(0,90)}).catch(()=>{})},
 /* ---------- auth ---------- */
 err(e){const m={'auth/invalid-credential':'Wrong email or password','auth/wrong-password':'Wrong email or password','auth/user-not-found':'No account with this email','auth/email-already-in-use':'This email already has an account — log in','auth/weak-password':'Password must be at least 6 characters','auth/invalid-email':'Enter a valid email','auth/network-request-failed':'No internet connection','auth/too-many-requests':'Too many tries, wait a few minutes'};return m[e.code]||e.message||'Something went wrong'},
 async login(){try{await this.auth.signInWithEmailAndPassword($('#ae').value.trim(),$('#ap').value);location.hash='#home';location.reload()}catch(e){toast(this.err(e))}},
 async signup(){const n=$('#an').value.trim(),sh=$('#as').value.trim(),ph=$('#aph').value.trim();if(!n||!sh)return toast('Enter your name and shop name');
  localStorage.setItem('bl_pending',JSON.stringify({name:n,shop:sh,phone:ph}));try{await this.auth.createUserWithEmailAndPassword($('#ae').value.trim(),$('#ap').value);location.hash='#home';location.reload()}catch(e){toast(this.err(e))}},
 async reset(){const e=$('#ae').value.trim();if(!e)return toast('Type your email first');try{await this.auth.sendPasswordResetEmail(e);toast('Password reset email sent')}catch(x){toast(this.err(x))}},
 async logout(){if(!confirm('Log out of Billora?'))return;try{await this.auth.signOut()}catch(e){}['bl_prof','bl_sub','bl_branch'].forEach(k=>localStorage.removeItem(k));location.reload()},
 mode:'login',
 screen(){$('#nav').innerHTML='';const m=this.mode,su=m==='signup';
  $('#app').innerHTML=`<div class="card auth2"><div style="text-align:center"><img src="logo.png" alt="Billora" style="width:110px;margin:0 auto 6px"><h2>${su?'Start your free trial':'Welcome back'}</h2><p class="mut">${su?TRIAL_DAYS+' days free • no card needed':'Log in to your Billora account'}</p></div>${this.msg?`<p class="danger" style="font-size:13px">${esc(this.msg)}</p>`:''}
  ${su?`<input id="an" placeholder="Your name" autocomplete="name"><input id="as" placeholder="Shop / business name"><input id="aph" type="tel" inputmode="numeric" placeholder="Mobile number (optional)">`:''}
  <input id="ae" type="email" placeholder="Email" autocomplete="email"><input id="ap" type="password" placeholder="Password" autocomplete="${su?'new-password':'current-password'}">
  <button class="btn b w" onclick="Cloud.${su?'signup':'login'}()">${su?'Create account':'Log in'}</button>
  ${su?'':'<button class="btn o w" onclick="Cloud.reset()">Forgot password?</button>'}
  <p style="text-align:center;margin-top:14px;font-size:14px">${su?'Already have an account?':'New to Billora?'} <b style="color:var(--b);cursor:pointer" onclick="Cloud.mode='${su?'login':'signup'}';Cloud.screen()">${su?'Log in':'Start free trial'}</b></p></div>`},
 /* ---------- sync ---------- */
 base(){return this.db.collection('users').doc(this.user.uid).collection('br').doc(Branch.cur).collection('rec')},
 async startSync(){const D=DB.d,key=this.user.uid+'/'+Branch.cur;
  if(D.sy.bid!==key){const q=await this.tm(this.base().limit(1).get(),10000);if(q.size>0)DB.d=Object.assign(structuredClone(DEF),{did:D.did});DB.d.sy=structuredClone(DEF.sy);DB.d.sy.bid=key;DB.raw()}
  this.sync=true;this.listen();window.addEventListener('online',()=>this.touch(300));this.touch(500)},
 apply(r){const D=DB.d,sy=D.sy,k=r.k+':'+r.i;this._chg=true;
  if(r.k==='mv'){if(sy.seen[r.i]||r.i.startsWith(D.did))return;sy.seen[r.i]=1;const x=r.d,stk=x.t==='stk',o=(stk?D.prods:D.custs).find(z=>z.id===x.ref),f=stk?'stock':'due';if(o){o[f]=(o[f]||0)+x.d;sy[x.t][o.id]=(sy[x.t][o.id]||0)+x.d}return}
  if(r.k==='cfg'){const cur=JSON.stringify(r.i==='set'?D.set:D.cats);if(sy.h[k]!==undefined&&sy.h[k]!==cur)return;if(r.i==='set'){D.set=Object.assign({},DEF.set,r.d);sy.h[k]=JSON.stringify(D.set)}else{D.cats=r.d||[];sy.h[k]=JSON.stringify(D.cats)}return}
  const l=D[r.k];if(!l)return;const i=l.findIndex(z=>z.id===r.i),old=i>=0?l[i]:null;
  if(old&&sy.h[k]!==undefined&&sy.h[k]!==JSON.stringify(this.form(r.k,old)))return;
  if(r.x){if(i>=0)l.splice(i,1);sy.h[k]='x';return}
  const o={...r.d};if(r.k==='prods'){o.stock=old?old.stock:0;if(!old)sy.stk[o.id]=0}if(r.k==='custs'){o.due=old?old.due:0;if(!old)sy.due[o.id]=0}
  i>=0?l[i]=o:l.push(o);sy.h[k]=JSON.stringify(this.form(r.k,o))},
 listen(){if(this._un)this._un();const sy=DB.d.sy,from=firebase.firestore.Timestamp.fromMillis(Math.max(0,(sy.since||0)-5000));
  this._un=this.base().where('u','>=',from).orderBy('u').onSnapshot(snap=>{const rows=[];snap.docChanges().forEach(c=>{if(c.type!=='removed'&&!c.doc.metadata.hasPendingWrites)rows.push(c.doc.data())});
   if(!rows.length)return;this._chg=false;rows.sort((a,b)=>(a.k==='mv')-(b.k==='mv')).forEach(r=>this.apply(r));
   rows.forEach(r=>{const t=r.u&&r.u.toMillis?r.u.toMillis():0;if(t>sy.since)sy.since=t});['bills','buys','rets','prets','kots'].forEach(c=>DB.d[c].sort((a,b)=>b.t-a.t));DB.raw();
   if(this._chg&&!$('#sheet.open')&&!/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName||''))render()},e=>console.warn(e))},
 async push(){const D=DB.d,sy=D.sy,out=[],commit=[],T=firebase.firestore.FieldValue.serverTimestamp;
  const put=(k,i,d,x)=>{const h=x?'x':JSON.stringify(d),key=k+':'+i;if(sy.h[key]===h)return;out.push({k,i,d:x?null:JSON.parse(h),x:!!x});commit.push(()=>{sy.h[key]=h})};
  COLS.forEach(c=>{const live={};D[c].forEach(o=>{live[o.id]=1;put(c,o.id,this.form(c,o))});Object.keys(sy.h).forEach(k=>{if(k.startsWith(c+':')){const id=k.slice(c.length+1);if(!live[id]&&sy.h[k]!=='x')put(c,id,null,true)}})});
  put('cfg','set',D.set);put('cfg','cats',D.cats);
  [['prods','stk','stock'],['custs','due','due']].forEach(([c,f,fld])=>D[c].forEach(o=>{const cur=o[fld]||0,base=sy[f][o.id]||0,d=cur-base;if(d){const id=D.did+'_'+o.id+'_'+base+'_'+cur;out.push({k:'mv',i:id,d:{t:f,ref:o.id,d}});commit.push(()=>{sy.seen[id]=1;sy[f][o.id]=base+d})}}));
  if(!out.length)return;for(let n=0;n<out.length;n+=400){const b=this.db.batch();out.slice(n,n+400).forEach(o=>b.set(this.base().doc(o.k+'__'+o.i),{k:o.k,i:o.i,d:o.d,x:o.x,u:T()}));await this.tm(b.commit(),25000)}
  commit.forEach(f=>f())},
 touch(ms=1500){if(!this.sync)return;clearTimeout(this._t);this._t=setTimeout(()=>this.run(),ms)},
 async run(){if(this._busy){this._again=true;return}if(!navigator.onLine){this.ui('Offline');return}this._busy=true;this.ui('Syncing…');
  try{await this.push();DB.raw();this.ui('Synced ✓')}catch(e){console.warn(e);this.ui('Sync paused')}this._busy=false;if(this._again){this._again=false;this.touch(500)}}
};
window.addEventListener('offline',()=>Cloud.ui&&Cloud.ui('Offline'));
