const CACHE='kicc-0.1.0-dev.52';
const ASSETS=['./','./index.html','./styles.css','./navigation/leitstand-tabs.css','./navigation/leitstand-tabs.js','./dashboard/instrument-panel.css','./dashboard/instrument-panel.js','./ui/report-tools.css','./ui/report-tools.js','./live/live-console.js','./update/pwa-update-manager.js','./app.js','./manifest.webmanifest','./telemetry/telemetry-contract.js','./telemetry/neon-runtime-config.js','./auth/runtime-auth-provider.js','./auth/auto-login-store.js','./auth/supabase-login-ui.js','./auth/futura-reset-redirect-fix.js','./auth/futura-password-recovery.js','./adapters/adapter-core.js','./adapters/github-repository-adapter.js','./adapters/github-deployment-telemetry.js','./adapters/indexeddb-local-adapter.js','./adapters/browser-runtime-adapter.js','./adapters/telemetry-bridge-adapter.js','./database/database-model.js','./failover/failover-state-machine.js','./storage/object-storage-model.js','./storage/storage-monitor.js','./storage/kc-b2-prepared.js','./migration/region-migration-model.js','./migration/region-migration-ui.js','./migration/migration-center.js','./migration/prepared-resources.js','./health/system-health.js','./runtime/probe-scheduler.js','./sync/mirror-runtime-config.js','./sync/mirror-health-model.js','./sync/mirror-bridge-adapter.js','./sync/mirror-monitor.js','./scope/domain-model.js','./scope/private-infrastructure-ui.js','./products/kc-product-model.js','./products/impact-analysis.js','./products/kc-program-registry.js','./products/github-telemetry-runtime.js','./products/non-kc-program-registry.js','./explorer/repository-explorer-model.js','./explorer/repository-explorer-ui.js','./explorer/repository-policy-ui.js','./explorer/repository-explorer.css','./explorer/git-bridge-contract.js','./explorer/git-bridge-client.js','./explorer/transfer-action-model.js','./bridge/git-bridge-core.js','./bridge/github-provider-adapter-contract.js','./bridge/git-bridge-readiness.js','./bridge/repository-allowlist.js','./bridge/repository-allowlist.prepared.js','./bridge/bridge-roles.js','./bridge/audit-store-model.js','./bridge/audit-persistence-contract.js','./bridge/audit-persistence.js','./tests/explorer-bridge-selftest.js','./tests/explorer-bridge-selftest-ui.js','./tests/explorer-bridge-test-store.js','./tests/explorer-bridge-readiness-ui.js','./tests/runtime-smoke.js','./tests/runtime-smoke-ui.js','./security/security-model.js','./security/security-verifier.js','./security/security-agent-contract.js','./security/security-register.js','./security/version-scope-correction.js','./security/version-evidence-model.js','./security/version-evidence-ui.js','./security/runtime-security-attestation.js','./security/runtime-security-attestation-ui.js','./security/security-agent-monitor.js','./security/security-agent.css','./security/code-evidence-registry.js','./security/local-storage-migration-plan.js','./security/local-storage-migration-ui.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='KICC_ACTIVATE_UPDATE') self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreSearch:false});
    if(cached)return cached;
    try{return await fetch(event.request,{cache:'no-store'});}catch{
      const fallback=await caches.match('./index.html');
      return fallback||Response.error();
    }
  }));
});
