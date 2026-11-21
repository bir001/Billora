DB.load();window.addEventListener('hashchange',render);
(async()=>{try{await Cloud.init()}catch(e){console.warn(e)}render()})();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
