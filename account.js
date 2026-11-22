/* ACCOUNT: profile, plan status, branches, Plans & Pricing (Hostinger-style), paywall */
let PERIOD='y';
const planBadge=()=>{const s=Sub.state();return s.k==='trial'?`<span class="pill low">Trial • ${s.left} day${s.left===1?'':'s'} left</span>`:s.k==='active'?`<span class="pill ok">${esc(Sub.label())} • ${s.left}d left</span>`:s.k==='expired'?'<span class="pill bad">Expired</span>':s.k==='suspended'?'<span class="pill bad">Suspended</span>':''};
V.account=()=>{const p=Cloud.prof||{},en=Cloud.enabled;
 if(!en)return `<div class="pagehead"><div><h1>Account</h1><p>Cloud login is not set up yet</p></div></div><div class="panel card"><p class="muted">Billora is running in local mode. Add your Firebase keys in <b>firebase-config.js</b> to enable login, plans and sync.</p><button class="btn b w" onclick="go('settings')">${I('sliders',18)} Billing details & printer</button></div>`;
 const s=Sub.state(),br=Branch.list();
 return `<div class="pagehead"><div><h1>Account</h1><p>${esc(Cloud.sync?'Cloud sync on':'Local data only')} • ${navigator.onLine?'Online':'Offline'}</p></div></div>
 <div class="hero2"><div class="row"><div class="avt big">${esc((p.name||'U')[0].toUpperCase())}</div><div style="flex:1;margin-left:12px"><b style="font-size:18px">${esc(p.name||'')}</b><div style="opacity:.85;font-size:13px">${esc(p.email||'')}</div><div style="opacity:.85;font-size:13px">${esc(p.shop||'')}</div></div></div>
 <div class="hrow" style="margin-top:14px"><span>${I('crown',14)} ${esc(Sub.label())}</span>${s.k==='trial'||s.k==='active'?`<span>${s.left} days left</span>`:''}</div></div>
 <button class="btn b w" onclick="go('plans')">${I('crown',18)} ${s.k==='active'?'Change / renew plan':'View plans & upgrade'}</button>
 <div class="panel card" style="margin-top:14px"><h3>Branches</h3>${br.map(b=>`<div class="ln" onclick="${b.id===Branch.cur?'':`Branch.go('${b.id}')`}" style="cursor:pointer"><span>${I('store',16)} ${esc(b.name)}</span><b>${b.id===Branch.cur?'<span class="pill ok">Current</span>':'Switch'}</b></div>`).join('')}
 <button class="btn o w" style="margin-top:10px" onclick="Branch.add()">+ Add branch <small>(${br.length}/${Sub.limit().branches})</small></button></div>
 <div class="panel card"><h3>More</h3>
 <div class="ln" onclick="go('settings')" style="cursor:pointer"><span>${I('sliders',16)} Billing details & printer</span>${I('right',16)}</div>
 <div class="ln" onclick="go('plans')" style="cursor:pointer"><span>${I('crown',16)} Plans & pricing</span>${I('right',16)}</div>
 ${Native.on?'':`<a class="ln" href="${APK_URL}" style="text-decoration:none;color:inherit"><span>${I('down',16)} Download Android app</span>${I('right',16)}</a>`}
 ${Cloud.isAdmin?`<a class="ln" href="admin.html" style="text-decoration:none;color:inherit"><span>${I('chart',16)} Admin dashboard</span>${I('right',16)}</a>`:''}
 <div class="ln" onclick="Cloud.logout()" style="cursor:pointer"><span class="danger">${I('x',16)} Log out</span></div></div>`};
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
V.plans=()=>{const pl=Sub.plans(),cur=Sub.cache(),y=PERIOD==='y';
 return `<div class="pagehead"><div><h1>Plans & Pricing</h1><p>Simple pricing, cancel anytime</p></div></div>
 <div class="seg" style="justify-content:center"><button class="${!y?'on':''}" onclick="PERIOD='m';render()">Monthly</button><button class="${y?'on':''}" onclick="PERIOD='y';render()">Yearly <small>save up to 40%</small></button></div>
 ${pl.map(p=>{const price=y?Math.round(p.y/12):p.m,isCur=cur&&cur.plan===p.id&&Sub.state().k==='active';
  return `<div class="plan ${p.pop?'pop':''}">${p.pop?'<div class="ribbon">Most popular</div>':''}<h3>${esc(p.name)}</h3><p class="muted">${esc(p.tag||'')}</p>
  <div class="pr2">${p.was?`<s>${money(p.was)}</s>`:''}<b>${money(price)}</b><span>/month</span></div><small class="muted">${y?'Billed '+money(p.y)+' every year':'Billed monthly'}</small>
  <button class="btn ${p.pop?'b':'o'} w" style="margin:14px 0" onclick="buyPlan('${p.id}')">${isCur?'Renew '+esc(p.name):'Choose '+esc(p.name)}</button>
  <div class="feat">${(p.feat||[]).map(f=>`<div>${I('check',16)} ${esc(f)}</div>`).join('')}</div><small class="muted">${p.limits.branches} branch${p.limits.branches>1?'es':''} • ${p.limits.devices} device${p.limits.devices>1?'s':''}${p.cloud?' • cloud sync':''}</small></div>`}).join('')}
 <p class="muted" style="font-size:12px;text-align:center;margin:12px 0">Prices in Indian rupees. After you choose a plan we activate it as soon as the payment is confirmed.</p>`};
async function buyPlan(id){const p=Sub.plans().find(x=>x.id===id),y=PERIOD==='y',price=y?p.y:p.m,pr=Cloud.prof||{};
 try{if(Cloud.db)await Cloud.db.collection('requests').add({uid:Cloud.user.uid,email:pr.email||'',name:pr.name||'',phone:pr.phone||'',shop:pr.shop||'',planId:id,planName:p.name,period:y?'yearly':'monthly',price,status:'pending',createdAt:Date.now()})}catch(e){}
 const msg=`Hi, I want the ${p.name} plan (${y?'yearly':'monthly'}, ${money(price)}) for Billora. Shop: ${pr.shop||''}. Email: ${pr.email||''}`;
 const url=p.link||('https://wa.me/'+ADMIN_WHATSAPP+'?text='+encodeURIComponent(msg));
 openSheet(`<h3>${esc(p.name)} — ${money(price)} ${y?'/ year':'/ month'}</h3><p class="mut">Your request is sent. Complete the payment on the next screen. Your plan is activated right after payment confirmation.</p><a class="btn b w" href="${esc(url)}" target="_blank" rel="noopener" style="display:block;text-align:center">${p.link?'Pay now':'Continue on WhatsApp'}</a><button class="btn o w" onclick="closeAll()" style="margin-top:8px">Not now</button>`)}
V.paywall=()=>{const s=Sub.state(),sus=s.k==='suspended';
 return `<div class="card auth2" style="text-align:center"><div class="qi" style="margin:0 auto 12px;width:64px;height:64px;border-radius:20px">${I('lock',30)}</div><h2>${sus?'Account suspended':'Your plan has expired'}</h2><p class="mut">${sus?'Please contact support to restore access.':'Your data is safe. Choose a plan to continue billing.'}</p>
 <button class="btn b w" onclick="go('plans')">${I('crown',18)} View plans</button><button class="btn o w" onclick="backup()">${I('down',18)} Download my data backup</button><button class="btn o w" onclick="Cloud.logout()">Log out</button></div>`};
