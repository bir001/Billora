const C='billora-v1',F=['./','index.html','css/style.css','css/pos.css','js/core.js','js/print.js','js/billing.js','js/catalog.js','js/stock.js','js/people.js','js/reports.js','js/settings.js','js/boot.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
