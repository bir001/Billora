/* BACKUP: small JSON snapshot (gzip), copy in Billora cloud, download / restore */
const Backup={
 data(){const D=DB.d;return{v:1,app:'billora',at:Date.now(),branch:(typeof Branch!=='undefined'&&Branch.cur)||'main',set:D.set,cats:D.cats,
  prods:D.prods.map(p=>({...p,img:(p.img&&p.img.length>200)?'':p.img})),custs:D.custs,sups:D.sups,bills:D.bills,buys:D.buys,rets:D.rets,prets:D.prets,kots:D.kots,
  labels:D.labels.map(l=>({...l,els:l.els.map(e=>e.type==='image'?{...e,src:''}:e)})),seq:D.seq,kseq:D.kseq,rseq:D.rseq}},
 text(){return JSON.stringify(this.data())},
 async gz(str){if(!window.CompressionStream)return null;const cs=new CompressionStream('gzip'),w=cs.writable.getWriter();w.write(new TextEncoder().encode(str));w.close();return new Uint8Array(await new Response(cs.readable).arrayBuffer())},
 b64(u){let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)},
 async cloud(manual){if(!Cloud.on||!Cloud.db)return manual&&toast('Log in to use cloud backup');if(!navigator.onLine)return manual&&toast('Offline — backup will run when you are online');
  try{const t=this.text(),g=await this.gz(t),data=g?this.b64(g):btoa(unescape(encodeURIComponent(t)));if(data.length>900000)return manual&&toast('Too large for cloud backup — download the file instead');
   await Cloud.db.doc(`users/${Cloud.user.uid}/backups/${Branch.cur}`).set({at:Date.now(),gz:!!g,size:t.length,csize:data.length,bills:DB.d.bills.length,items:DB.d.prods.length,data});
   localStorage.setItem('bl_lastbk',Date.now());manual&&toast('Backup saved to Billora cloud ('+Math.max(1,Math.round(data.length/1024))+' KB)');if(manual&&location.hash==='#settings')render()}catch(e){manual&&toast('Backup failed: '+(e.code||e.message))}},
 auto(){if(!Cloud.on)return;const l=+(localStorage.getItem('bl_lastbk')||0);if(Date.now()-l>6*36e5)this.cloud(false)},
 async download(gz){const t=this.text(),n='billora-backup-'+new Date().toISOString().slice(0,10);if(gz){const g=await this.gz(t);if(g)return Save.blob(n+'.json.gz',new Blob([g],{type:'application/gzip'}))}Save.blob(n+'.json',new Blob([t],{type:'application/json'}))},
 async read(f){if(/\.gz$/i.test(f.name)&&window.DecompressionStream)return JSON.parse(await new Response(f.stream().pipeThrough(new DecompressionStream('gzip'))).text());return JSON.parse(await f.text())},
 async restore(f){if(!f)return;if(Cloud.sync)return toast('Cloud sync is on — your data is already safe in the cloud');
  try{const o=await this.read(f);DB.d=Object.assign(structuredClone(DEF),o,{did:DB.d.did});DB.d.set=Object.assign({},DEF.set,DB.d.set);DB.d.sy=structuredClone(DEF.sy);DB.save();toast('Backup restored');render()}catch(e){toast('Invalid backup file')}},
 panel(){const l=+(localStorage.getItem('bl_lastbk')||0);return `<div class="panel card"><h3>Backup</h3><p class="muted" style="font-size:13px;margin:0 0 4px">Your data is saved as one small JSON file (compressed copy available).</p>
  <p class="muted" style="font-size:12.5px;margin:0 0 12px">${Cloud.on?(l?'Last cloud backup: '+new Date(l).toLocaleString('en-IN'):'No cloud backup yet'):'Log in to enable automatic cloud backup'}</p>
  <div class="acts"><button class="btn b" onclick="Backup.cloud(1)">${I('cloud',18)} Back up to Billora cloud</button></div>
  <div class="acts"><button class="btn o" onclick="Backup.download(0)">${I('down',18)} JSON</button><button class="btn o" onclick="Backup.download(1)">Small .gz</button><button class="btn o" onclick="$('#imp').click()">Restore</button></div>
  <input id="imp" type="file" accept=".json,.gz,application/json" class="hide" onchange="Backup.restore(this.files[0])"></div>`}
};
