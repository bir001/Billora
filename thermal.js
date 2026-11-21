/* THERMAL: direct ESC/POS printing over Bluetooth (BLE) and USB (OTG) */
const Thermal={dev:null,ch:null,usb:null,ep:null,
 SVC:['000018f0-0000-1000-8000-00805f9b34fb','49535343-fe7d-4ae5-8fa9-9fafd205e455','e7810a71-73ae-499d-8c15-faa9aef0c3f2','0000ffe0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','0000fee7-0000-1000-8000-00805f9b34fb'],
 async pairBT(){if(!navigator.bluetooth)throw Error('Use Chrome (Android) for Bluetooth printing');
  const d=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:this.SVC});await this.openBT(d)},
 async openBT(d){const g=await d.gatt.connect();
  for(const sv of await g.getPrimaryServices()){const c=(await sv.getCharacteristics()).find(x=>x.properties.write||x.properties.writeWithoutResponse);
   if(c){this.dev=d;this.ch=c;DB.d.set.conn='bt';DB.d.set.pname=d.name||'Bluetooth printer';DB.save();return}}
  throw Error('No BLE write channel found (this may be a classic Bluetooth printer)')},
 async pairUSB(){if(!navigator.usb)throw Error('USB printing needs Chrome and an OTG cable');await this.openUSB(await navigator.usb.requestDevice({filters:[]}))},
 async openUSB(d){await d.open();if(!d.configuration)await d.selectConfiguration(1);let ifc=null,ep=null;
  for(const i of d.configuration.interfaces)for(const a of i.alternates){const o=a.endpoints.find(e=>e.direction==='out');if(o&&(ifc===null||a.interfaceClass===7)){ifc=i.interfaceNumber;ep=o.endpointNumber}}
  if(ifc===null)throw Error('USB printer output endpoint not found');await d.claimInterface(ifc);this.usb=d;this.ep=ep;DB.d.set.conn='usb';DB.d.set.pname=d.productName||'USB printer';DB.save()},
 async ready(){const c=DB.d.set.conn;
  if(c==='bt'){if(this.ch&&this.dev.gatt.connected)return;if(this.dev)return this.openBT(this.dev);
   if(navigator.bluetooth&&navigator.bluetooth.getDevices){const l=await navigator.bluetooth.getDevices();if(l[0])return this.openBT(l[0])}return this.pairBT()}
  if(c==='usb'){if(this.usb&&this.usb.opened)return;if(navigator.usb){const l=await navigator.usb.getDevices();if(l[0])return this.openUSB(l[0])}return this.pairUSB()}},
 rawbt(bytes){let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));location.href='rawbt:base64,'+btoa(bin)},
 async send(bytes){if(DB.d.set.conn==='rawbt')return this.rawbt(bytes);await this.ready();
  if(DB.d.set.conn==='usb'){for(let i=0;i<bytes.length;i+=4096)await this.usb.transferOut(this.ep,bytes.slice(i,i+4096));return}
  const nr=!this.ch.properties.write,n=nr?20:100;
  for(let i=0;i<bytes.length;i+=n){const p=bytes.slice(i,i+n);nr?await this.ch.writeValueWithoutResponse(p):await this.ch.writeValue(p);if(nr)await new Promise(r=>setTimeout(r,12))}},
 disconnect(){try{this.dev&&this.dev.gatt.disconnect()}catch(e){}this.dev=this.ch=this.usb=null;DB.d.set.conn='browser';DB.d.set.pname='';DB.save()}
};
