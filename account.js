/* ACCOUNT: profile, plan status, branches, Plans & Pricing (with "why extra" + comparison), paywall */
let PERIOD='y';
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const dfmt=t=>new Date(t).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
const arow=(ic,t,sub,act,end)=>`<div class="ar" onclick="${act}"><span class="ai">${I(ic,20)}</span><span class="at"><b>${t}</b><small>${sub}</small></span>${end===undefined?I('right',18):end}</div>`;
const planPill=()=>{const s=Sub.state();return s.k==='trial'?`<span class="pill low">${s.left} day${s.left===1?'':'s'} left</span>`:s.k==='active'?`<span class="pill ok">${s.grace?'Grace period':s.left+' days left'}</span>`:'<span class="pill bad">'+(s.k==='suspended'?'Suspended':'Expired')+'</span>'};
V.account=()=>{const p=Cloud.prof||{};
 if(!Cloud.enabled)return `<div class="pagehead"><div><h1>Account</h1><p>Cloud login is not set up yet</p></div></div><div class="agrp">${arow('sliders','Shop & billing details','Business name, address, GST number, bill format',"go('settings')")}</div><p class="muted" style="font-size:13px;margin-top:12px">Add your Firebase keys in <b>firebase-config.js</b> to enable login, plans and sync.</p>`;
 const s=Sub.state(),br=Branch.list(),lim=Sub.limit(),endAt=(p.plan==='trial'||!p.planEnds)?p.trialEnds:p.planEnds,
 st=s.k==='trial'?`Free trial · ends on ${dfmt(endAt)}`:s.k==='active'?(s.grace?'Your plan ended — renew now to avoid interruption':'Active · valid till '+dfmt(endAt)):s.k==='suspended'?'Your account is suspended. Please contact support.':'Your plan has expired. Choose a plan to continue billing.';
 return `<div class="pagehead"><div><h1>Account</h1><p>${Cloud.sync?'Cloud sync on':'Data stored on this device'} • ${navigator.onLine?'Online':'Offline'}</p></div></div>
 <div class="prof"><div class="avt big">${esc((p.name||'U')[0].toUpperCase())}</div><div class="pi2"><b>${esc(p.name||'')}</b><span>${esc(p.shop||'No shop name yet')}</span><small>${esc(p.email||'')}</small></div><button class="ed" onclick="editProfile()">${I('sliders',15)} Edit</button></div>
 ${Cloud.warn?`<div class="panel card" style="border-color:var(--bad);margin:0 0 14px"><b class="danger">Cloud not connected</b><p class="muted" style="font-size:13px;margin:4px 0 10px">${esc(Cloud.warn)}</p><button class="btn o sm" onclick="location.reload()">Retry</button></div>`:''}
 <div class="plc"><div class="row"><div><small>Your plan</small><b class="plt">${esc(Sub.label())}</b></div>${planPill()}</div><p>${st}</p><button class="btn b w" onclick="go('plans')">${I('crown',18)} ${s.k==='active'?'Change or renew plan':'See plans & upgrade'}</button></div>
 <div class="agt">Business</div><div class="agrp">
 ${arow('sliders','Shop & billing details','Business name, address, GST number, logo',"go('settings')")}
 ${arow('printer','Printer & paper size','Connect a printer, choose 2 inch / 3 inch / A4',"go('settings')")}
 ${arow('down','Backup & export','Download your data, Google Sheets, CSV',"go('settings')")}</div>
 <div class="agt">Branches <span>${br.length} of ${lim.branches} used on your plan</span></div><div class="agrp">
 ${br.map(b=>b.id===Branch.cur?arow('store',esc(b.name),'Currently open','',`<span class="pill ok">Current</span>`):arow('store',esc(b.name),'Tap to switch to this branch',`Branch.go('${b.id}')`)).join('')}
 ${arow('plus','Add a branch','Separate items, stock and bills for each shop','Branch.add()')}</div>
 <div class="agt">More</div><div class="agrp">
 ${arow('crown','Plans & pricing','Compare plans, upgrade or renew',"go('plans')")}
 ${Native.on?'':arow('down','Download Android app','In-app printer pairing and a faster experience',`location.href='${APK_URL}'`)}
 ${Cloud.isAdmin?arow('chart','Admin dashboard','Users, plans, trials and leads',"location.href='admin.html'"):''}</div>
 <button class="logout" onclick="Cloud.logout()">${I('lock',18)} Log out</button>
 <p class="muted" style="text-align:center;font-size:12px;margin:12px 0 0">Signed in as ${esc(p.email||'')}<br>You stay signed in on this device until you log out.</p>
 <p class="muted" style="text-align:center;font-size:11.5px">Running in ${Native.on?'Billora Android app':'browser'}</p>`};
function editProfile(){const p=Cloud.prof||{};openSheet(`<h3>Edit profile</h3><label class="lb">Your name</label><input id="ep1" value="${esc(p.name)}"><label class="lb">Shop name</label><input id="ep2" value="${esc(p.shop)}"><label class="lb">Mobile</label><input id="ep3" type="tel" value="${esc(p.phone)}"><button class="btn b w" onclick="saveProfile()">Save profile</button>`)}
async function saveProfile(){const o={name:$('#ep1').value.trim(),shop:$('#ep2').value.trim(),phone:$('#ep3').value.trim()};if(!o.name)return toast('Enter your name');
 try{await Cloud.db.doc('users/'+Cloud.user.uid).update(o);Cloud.setProf({...Cloud.prof,...o});if(o.shop&&DB.d.set.name==='My Shop'){DB.d.set.name=o.shop;DB.save()}closeAll();render();toast('Profile saved')}catch(e){toast('Could not save — check internet')}}
/* ---------- plans ---------- */
const isEv=f=>/^everything in/i.test(f);
V.plans=()=>{const pl=Sub.plans(),y=PERIOD==='y',pr=p=>y?Math.round(p.y/12):p.m,cur=Sub.cache(),act=Sub.state().k==='active';
 const ex=(p,i)=>{const base=(p.feat||[]).filter(f=>!isEv(f)),prev=pl[i-1];return prev?base.filter(f=>!(prev.feat||[]).includes(f)):base};
 const cards=pl.map((p,i)=>{const prev=pl[i-1],e=ex(p,i),d=prev?pr(p)-pr(prev):0,isCur=cur&&cur.plan===p.id&&act;
  return `<div class="plan ${p.pop?'pop':''}">${p.pop?'<div class="ribbon">Most popular</div>':''}<h3>${esc(p.name)}</h3><p class="muted">${esc(p.tag||'')}</p>
  <div class="pr2">${p.was?`<s>${money(p.was)}</s>`:''}<b>${money(pr(p))}</b><span>/month</span></div><small class="muted">${y?'Billed '+money(p.y)+' every year':'Billed every month'}</small>
  ${prev?`<div class="why">${I('plus',16)}<div><b>${money(d)} per month more than ${esc(prev.name)}</b><small>You pay extra for: ${e.map(esc).join(', ')||'higher limits'}</small></div></div>`:''}
  <button class="btn ${p.pop?'b':'o'} w" style="margin:14px 0" onclick="buyPlan('${p.id}')">${isCur?'Renew '+esc(p.name):'Choose '+esc(p.name)}</button>
  <div class="fh">${prev?'Everything in '+esc(prev.name)+', plus:':'What you get'}</div>
  <div class="feat">${e.map(f=>prev?`<div class="x">${I('plus',16)}<span>${esc(f)}</span><em>EXTRA</em></div>`:`<div>${I('check',16)}<span>${esc(f)}</span></div>`).join('')}</div>
  <small class="muted">${p.limits.branches} branch${p.limits.branches>1?'es':''} • ${p.limits.devices} device${p.limits.devices>1?'s':''}${p.cloud?' • cloud sync':''}</small></div>`}).join('');
 const all=[];pl.forEach(p=>(p.feat||[]).forEach(f=>{if(!isEv(f)&&!all.includes(f))all.push(f)}));const has=(i,f)=>pl.slice(0,i+1).some(p=>(p.feat||[]).includes(f)),ck=b=>b?`<span class="y">${I('check',16)}</span>`:'<span class="n">—</span>';
 const table=`<div class="agt">Compare plans</div><div class="agrp cmp"><table><tr><th>Feature</th>${pl.map(p=>`<th>${esc(p.name)}</th>`).join('')}</tr><tr><td>Branches</td>${pl.map(p=>`<td><b>${p.limits.branches}</b></td>`).join('')}</tr><tr><td>Devices</td>${pl.map(p=>`<td><b>${p.limits.devices}</b></td>`).join('')}</tr><tr><td>Cloud sync</td>${pl.map(p=>`<td>${ck(p.cloud)}</td>`).join('')}</tr><tr><td>Label designer</td>${pl.map(p=>`<td>${ck(p.designer)}</td>`).join('')}</tr>${all.map(f=>`<tr><td>${esc(f)}</td>${pl.map((p,i)=>`<td>${ck(has(i,f))}</td>`).join('')}</tr>`).join('')}</table></div>`;
 return `<div class="pagehead"><div><h1>Plans & Pricing</h1><p>${TRIAL_DAYS}-day free trial included • cancel anytime</p></div></div>
 <div class="seg" style="justify-content:center"><button class="${!y?'on':''}" onclick="PERIOD='m';render()">Monthly</button><button class="${y?'on':''}" onclick="PERIOD='y';render()">Yearly <small>save up to 40%</small></button></div>${cards}${table}
 <p class="muted" style="font-size:12px;text-align:center;margin:14px 0">Prices in Indian rupees. Your plan is activated as soon as the payment is confirmed.</p>`};
async function buyPlan(id){const p=Sub.plans().find(x=>x.id===id),y=PERIOD==='y',price=y?p.y:p.m,pr=Cloud.prof||{};
 try{if(Cloud.db)await Cloud.db.collection('requests').add({uid:Cloud.user.uid,email:pr.email||'',name:pr.name||'',phone:pr.phone||'',shop:pr.shop||'',planId:id,planName:p.name,period:y?'yearly':'monthly',price,status:'pending',createdAt:Date.now()})}catch(e){}
 const msg=`Hi, I want the ${p.name} plan (${y?'yearly':'monthly'}, ${money(price)}) for Billora. Shop: ${pr.shop||''}. Email: ${pr.email||''}`,url=p.link||('https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent(msg));
 openSheet(`<h3>${esc(p.name)} — ${money(price)} ${y?'/ year':'/ month'}</h3><p class="mut">Your request is sent. Complete the payment on the next screen. Your plan is activated right after payment confirmation.</p><a class="btn b w" href="${esc(url)}" target="_blank" rel="noopener" style="display:block;text-align:center">${p.link?'Pay now':'Continue on WhatsApp'}</a><button class="btn o w" onclick="closeAll()" style="margin-top:8px">Not now</button>`)}
V.paywall=()=>{const s=Sub.state(),sus=s.k==='suspended';
 return `<div class="card auth2" style="text-align:center"><div class="qi" style="margin:0 auto 12px;width:64px;height:64px;border-radius:20px">${I('lock',30)}</div><h2>${sus?'Account suspended':'Your plan has expired'}</h2><p class="mut">${sus?'Please contact support to restore access.':'Your data is safe. Choose a plan to continue billing.'}</p>
 <button class="btn b w" onclick="go('plans')">${I('crown',18)} View plans</button><button class="btn o w" onclick="backup()">${I('down',18)} Download my data backup</button><button class="btn o w" onclick="Cloud.logout()">Log out</button></div>`};
