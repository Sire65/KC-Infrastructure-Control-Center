const CACHE='kicc-0.1.0-dev.71';
const CORE=['./','./index.html','./styles.css','./app.js','./navigation/leitstand-tabs.js','./dashboard/instrument-panel.css','./dashboard/instrument-panel.js','./dashboard/dashboard-polish.js','./programs/remote-heartbeat-server-readiness.js','./programs/remote-heartbeat-bridge-runtime.js','./programs/remote-heartbeat-bridge-ui.js','./auth/runtime-auth-provider.js','./update/pwa-update-manager.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('message',event=>{if(event.data?.type==='KICC_ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const hit=await cache.match(event.request,{ignoreSearch:false});
    if(hit)return hit;
    try{return await fetch(event.request,{cache:'no-store'});}catch{return (await caches.match('./index.html'))||Response.error();}
  }));
});
