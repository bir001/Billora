/* GOOGLE: export to Google Sheets, backup to Drive, CSV (for Notion / any sheet) */
const GApi={tok:null,exp:0,
 async token(){if(this.tok&&Date.now()<this.exp)return this.tok;await loadLib('https://accounts.google.com/gsi/client');
  return new Promise((ok,no)=>{google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CLIENT_ID,scope:'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
   callback:r=>{if(r.error)return no(new Error(r.error));this.tok=r.access_token;this.exp=Date.now()+(r.expires_in-60)*1000;ok(this.tok)}}).requestAccessToken()})},
 async call(url,opt={}){const t=await this.token(),r=await fetch(url,{...opt,headers:{...(opt.headers||{}),Authorization:'Bearer '+t}});if(!r.ok)throw new Error('Google '+r.status);return r.json()},
 rows(){const D=DB.d,d=t=>new Date(t).toLocaleString();return{
  Bills:[['Bill','Date','Customer','Mobile','Payment','Subtotal','Discount','GST','Total','Status']].concat(D.bills.map(b=>[b.no,d(b.t),b.cust||'',b.phone||'',b.pay,b.sub,b.disc,b.tax,b.total,b.cancelled?'Cancelled':'OK'])),
  Items:[['Item','Category','Code','Price','Cost','GST %','Stock']].concat(D.prods.map(p=>[p.name,p.cat,p.bc||'',p.price,p.cost,p.gst,p.stock])),
  Customers:[['Name','Mobile','Due']].concat(D.custs.map(c=>[c.name,c.phone||'',c.due||0]))}},
 async sheets(){const R=this.rows(),name='Billora backup '+new Date().toLocaleDateString(),
  sh=await this.call('https://sheets.googleapis.com/v4/spreadsheets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({properties:{title:name},sheets:Object.keys(R).map(t=>({properties:{title:t}}))})});
  await this.call(`https://sheets.googleapis.com/v4/spreadsheets/${sh.spreadsheetId}/values:batchUpdate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({valueInputOption:'RAW',data:Object.keys(R).map(t=>({range:t+'!A1',values:R[t]}))})});
  return sh.spreadsheetUrl},
 async drive(){const meta={name:'billora-backup-'+new Date().toISOString().slice(0,10)+'.json',mimeType:'application/json'},b='bl'+Date.now(),
  body=`--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(DB.d)}\r\n--${b}--`;
  return this.call('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body})}
};
async function gSheets(){if(!GOOGLE_CLIENT_ID)return toast('Add GOOGLE_CLIENT_ID in firebase-config.js');toast('Connecting to Google…');try{const u=await GApi.sheets();toast('Exported to Google Sheets');if(Native.on)location.href=u;else window.open(u,'_blank')}catch(e){toast('Google export failed: '+e.message)}}
async function gDrive(){if(!GOOGLE_CLIENT_ID)return toast('Add GOOGLE_CLIENT_ID in firebase-config.js');toast('Connecting to Google…');try{await GApi.drive();toast('Backup saved to your Google Drive')}catch(e){toast('Drive backup failed: '+e.message)}}
function exportCSV(){const R=GApi.rows(),q=v=>`"${String(v??'').replace(/"/g,'""')}"`;Object.keys(R).forEach((t,i)=>setTimeout(()=>Save.blob('billora-'+t.toLowerCase()+'.csv',new Blob([R[t].map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'})),i*400));toast('CSV files ready — import them into Notion or any spreadsheet')}
