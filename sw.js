const CACHE='kicc-0.1.0-dev.87';
const CORE=['./','./index.html','./styles.css','./app.js','./navigation/leitstand-tabs.js','./runtime/build-version.js','./runtime/version-runtime-guard.js','./dashboard/instrument-panel.css','./dashboard/instrument-panel.js','./dashboard/dashboard-polish.js','./live/live-console.js','./live/dataflow-topology.js','./products/program-version-lifecycle.js','./products/github-telemetry-runtime.js','./programs/program-flow-contract.js','./programs/program-flow-runtime.js','./programs/remote-program-flow-bridge.js','./programs/program-heartbeat-contract.js','./programs/program-heartbeat-runtime.js','./programs/kicc-self-heartbeat.js','./programs/failover-gateway-runtime.js','./programs/remote-heartbeat-server-readiness.js','./programs/remote-heartbeat-bridge-runtime.js','./programs/remote-heartbeat-bridge-ui.js','./storage/recovery-policy.js','./storage/backup-telemetry-monitor.js','./incidents/incident-center.js','./performance/performance-center.js','./flows/data-lineage-center.js','./auth/runtime-auth-provider.js','./security/security-auth-verification-fix.js','./update/pwa-update-manager.js'];
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
