/* CLOUD: Supabase login, roles, record-level sync (stock/due as movements) */
const COLS=['prods','custs','sups','bills','buys','rets','prets','kots'];
const Cloud={sb:null,on:false,gate:false,bid:'',user:null,prof:null,_t:null,_busy:false,_again:false,_chg:false,_ch:null,
 cfg(){return{url:localStorage.getItem('bl_url')||'',key:localStorage.getItem('bl_key')||''}},
 save(){localStorage.setItem('bl_url',$('#cu').value.trim());localStorage.setItem('bl_key',$('#ck').value.trim());location.reload()},
 ui(t){const e=$('#cs');if(e)e.textContent=t},
 form(k,o){const x={...o};if(k==='prods')delete x.stock;if(k==='custs')delete x.due;return x},
 async init(){const c=this.cfg();if(!c.url||!c.key||!window.supabase)return;this.sb=supabase.createClient(c.url,c.key);
  const {data}=await this.sb.auth.getSession();if(data.session)await this.attach(data.session.user);else this.gate='login'},
 async attach(u){let {data:p}=await this.sb.from('profiles').select('*').eq('id',u.id).maybeSingle();
  if(!p){const m=u.user_metadata||{},code=(m.code||'').trim(),nm=m.name||u.email,row=code?{id:u.id,business_id:code,name:nm,role:'pending'}:{id:u.id,business_id:u.id,name:nm,role:'owner'};
   const r=await this.sb.from('profiles').insert(row).select().single();if(r.error){toast(r.error.message);this.gate='login';return}p=r.data}
  this.user=u;this.prof=p;if(p.role==='pending'){this.gate='wait';return}
  ME={name:p.name,role:p.role};this.bid=p.business_id;this.on=true;this.gate=false;await this.link();this.listen();setInterval(()=>this.touch(0),30000);this.touch(100)},
 async link(){const D=DB.d;if(D.sy.bid===this.bid)return;
  const r=await this.sb.from('records').select('id',{count:'exact',head:true}).eq('business_id',this.bid);
  if(r.count>0)DB.d=Object.assign(structuredClone(DEF),{dev:D.dev,did:D.did,set:D.set});
  DB.d.sy=structuredClone(DEF.sy);DB.d.sy.bid=this.bid;localStorage.setItem(DB.k,JSON.stringify(DB.d))},
 apply(r){const D=DB.d,sy=D.sy,k=r.kind+':'+r.id;this._chg=true;
  if(r.kind==='mv'){if(sy.seen[r.id]||r.id.startsWith(D.did))return;sy.seen[r.id]=1;const x=r.data,stk=x.t==='stk',o=(stk?D.prods:D.custs).find(z=>z.id===x.ref),fld=stk?'stock':'due';
   if(o){o[fld]=(o[fld]||0)+x.d;sy[x.t][o.id]=(sy[x.t][o.id]||0)+x.d}return}
  if(r.kind==='cfg'){if(r.id==='set'){D.set=Object.assign({},DEF.set,r.data);sy.h[k]=JSON.stringify(D.set)}else{D.cats=r.data||[];sy.h[k]=JSON.stringify(D.cats)}return}
  const l=D[r.kind];if(!l)return;const i=l.findIndex(z=>z.id===r.id);
  if(r.deleted){if(i>=0)l.splice(i,1);sy.h[k]='x';return}
  const old=i>=0?l[i]:null,o={...r.data};if(r.kind==='prods'){o.stock=old?old.stock:0;if(!old)sy.stk[o.id]=0}if(r.kind==='custs'){o.due=old?old.due:0;if(!old)sy.due[o.id]=0}
  i>=0?l[i]=o:l.push(o);sy.h[k]=JSON.stringify(this.form(r.kind,o))},
 async pull(){const sy=DB.d.sy;for(let g=0;g<20;g++){const from=sy.since?new Date(Date.parse(sy.since)-5000).toISOString():'1970-01-01T00:00:00Z';
  const {data,error}=await this.sb.from('records').select('*').eq('business_id',this.bid).gte('updated_at',from).order('updated_at').limit(1000);if(error)throw error;
  data.sort((a,b)=>(a.kind==='mv')-(b.kind==='mv')).forEach(r=>this.apply(r));if(data.length)sy.since=data.reduce((m,r)=>r.updated_at>m?r.updated_at:m,sy.since||'');if(data.length<1000)break}
  ['bills','buys','rets','prets','kots'].forEach(c=>DB.d[c].sort((a,b)=>b.t-a.t))},
 async push(){const D=DB.d,sy=D.sy,out=[],commit=[];
  const put=(kind,id,data,del)=>{const k=kind+':'+id,h=del?'x':JSON.stringify(data);if(sy.h[k]===h)return;out.push({business_id:this.bid,kind,id,data:del?null:data,deleted:!!del});commit.push(()=>{sy.h[k]=h})};
  COLS.forEach(c=>{const live={};D[c].forEach(o=>{live[o.id]=1;put(c,o.id,this.form(c,o))});Object.keys(sy.h).forEach(k=>{if(k.startsWith(c+':')){const id=k.slice(c.length+1);if(!live[id]&&sy.h[k]!=='x')put(c,id,null,true)}})});
  put('cfg','set',D.set);put('cfg','cats',D.cats);
  [['prods','stk','stock'],['custs','due','due']].forEach(([c,f,fld])=>D[c].forEach(o=>{const cur=o[fld]||0,base=sy[f][o.id]||0,d=cur-base;if(d){const id=D.did+'_'+o.id+'_'+base+'_'+cur;out.push({business_id:this.bid,kind:'mv',id,data:{t:f,ref:o.id,d}});commit.push(()=>{sy.seen[id]=1;sy[f][o.id]=base+d})}}));
  if(!out.length)return;for(let i=0;i<out.length;i+=200){const r=await this.sb.from('records').upsert(out.slice(i,i+200),{onConflict:'business_id,kind,id'});if(r.error)throw r.error}
  commit.forEach(f=>f())},
 touch(ms=1500){if(!this.on)return;clearTimeout(this._t);this._t=setTimeout(()=>this.sync(),ms)},
 async sync(){if(this._busy){this._again=true;return}this._busy=true;this._chg=false;this.ui('⟳ sync');
  try{await this.pull();await this.push();localStorage.setItem(DB.k,JSON.stringify(DB.d));this.ui('☁ ✓');
   if(this._chg&&!$('#sheet.open')&&!/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName||''))render()}catch(e){console.warn(e);this.ui('☁ ✗')}
  this._busy=false;if(this._again){this._again=false;this.touch(500)}},
 listen(){if(this._ch)return;this._ch=this.sb.channel('rec').on('postgres_changes',{event:'*',schema:'public',table:'records',filter:'business_id=eq.'+this.bid},()=>this.touch(400)).subscribe()},
 screen(){const a=$('#app');if(this.gate==='wait')return a.innerHTML=`<div class="card auth2"><h2>Approval pending</h2><p class="mut">Owner aapko Staff & Users se role dega, uske baad login chalega.</p><button class="btn b w" onclick="location.reload()">Check again</button><button class="btn o w" onclick="Cloud.logout()">Logout</button></div>`;
  a.innerHTML=`<div class="card auth2"><h2>Billora Login</h2><p class="mut">Apna account use karo</p><input id="ae" type="email" placeholder="Email"><input id="ap" type="password" placeholder="Password"><button class="btn b w" onclick="Cloud.login()">Login</button>
  <p class="mut" style="margin-top:18px"><b>Naya account</b></p><input id="an" placeholder="Aapka naam"><input id="ac" placeholder="Business code (sirf staff ke liye)"><button class="btn o w" onclick="Cloud.signup()">Sign up</button><button class="btn o w" onclick="Cloud.local()">Cloud ke bina chalao</button></div>`},
 local(){localStorage.removeItem('bl_url');localStorage.removeItem('bl_key');location.reload()},
 async login(){const r=await this.sb.auth.signInWithPassword({email:$('#ae').value.trim(),password:$('#ap').value});if(r.error)return toast(r.error.message);await this.attach(r.data.user);location.hash='home';render()},
 async signup(){const r=await this.sb.auth.signUp({email:$('#ae').value.trim(),password:$('#ap').value,options:{data:{name:$('#an').value.trim(),code:$('#ac').value.trim()}}});
  if(r.error)return toast(r.error.message);if(r.data.session){await this.attach(r.data.user);render()}else toast('Email confirm karo, phir login')},
 async logout(){await this.sb.auth.signOut();location.reload()},
 async role(id,role){const r=await this.sb.from('profiles').update({role}).eq('id',id);toast(r.error?r.error.message:'Role updated')}
};
V.staff=()=>`<div class="pagehead"><div><h1>Staff & Users</h1><p>${Cloud.on?'Business code: <b>'+Cloud.bid+'</b>':'Cloud login ke baad users dikhenge'}</p></div></div><div id="stl" class="list"></div><p class="muted" style="font-size:12px;margin-top:12px">Staff signup ke time ye Business code daale, phir yaha se role (manager / cashier / staff) do.</p>`;
AFTER.staff=async()=>{if(!Cloud.on)return;const {data}=await Cloud.sb.from('profiles').select('*').eq('business_id',Cloud.bid);
 $('#stl').innerHTML=(data||[]).map(p=>`<div class="card li"><div class="fl"><h4>${esc(p.name)}</h4></div>${p.id===Cloud.user.id?'<span class="pill ok">owner (you)</span>':`<select style="width:auto;margin:0" onchange="Cloud.role('${p.id}',this.value)">${['pending','manager','cashier','staff'].map(r=>`<option ${r===p.role?'selected':''}>${r}</option>`).join('')}</select>`}</div>`).join('')};
