import { evaluateGitBridgeReadiness, BRIDGE_READINESS_STEPS } from '../bridge/git-bridge-readiness.js';
import { PREPARED_ALLOWLIST_STATE } from '../bridge/repository-allowlist.prepared.js';

const state={last:null};
const LABELS={
  HTTPS_ENDPOINT:'HTTPS Endpoint',AUTHENTICATION:'Authentifizierung',CAPABILITY_MAPPING:'Capability Mapping',PROVIDER_CONFIG:'GitHub App / Provider',REPOSITORY_ALLOWLIST:'Repository-Allowlist',REPLAY_PROTECTION:'Replay-Schutz',RATE_SIZE_LIMITS:'Rate-/Größenlimits',AUDIT_PERSISTENCE:'Audit-Persistenz',RECOVERY_ROLLBACK_TEST:'Recovery/Rollback-Test',REGRESSION_TEST:'Regressionstest',EXPLICIT_ACTIVATION_APPROVAL:'Aktivierungsfreigabe'
};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function currentInput(){
  const bridge=globalThis.KICC_GIT_BRIDGE?.state||{};
  const test=globalThis.KICC_TEST_UI?.state?.last||null;
  return {
    httpsEndpoint:Boolean(globalThis.KICC_GIT_BRIDGE?.endpoint?.()),
    authenticationVerified:bridge.state==='READY'&&bridge.authenticated===true,
    capabilityMappingVerified:Array.isArray(bridge.capabilities)&&bridge.capabilities.length>0,
    providerConfig:{mode:'GITHUB_APP',appId:null,installationId:null,privateKeySource:'SERVER_SECRET_STORE',tokenLifetimeSeconds:3600,repositoryScope:'ALLOWLIST_ONLY'},
    repositoryAllowlistVerified:PREPARED_ALLOWLIST_STATE==='ACTIVE_VERIFIED',
    replayProtectionVerified:false,
    rateSizeLimitsVerified:false,
    auditPersistenceVerified:false,
    recoveryRollbackTestPassed:Boolean(test?.status==='PASS'),
    regressionTestPassed:Boolean(test?.status==='PASS'),
    activationApproved:false
  };
}
function render(){
  const host=document.getElementById('explorerBridgeReadiness');if(!host)return;
  const r=evaluateGitBridgeReadiness(currentInput());state.last=r;
  const rows=BRIDGE_READINESS_STEPS.map(step=>`<div class="cap"><strong>${r.checks[step]?'✓':'—'} ${esc(LABELS[step]||step)}</strong><span>${r.checks[step]?'bestätigt':'offen'}</span></div>`).join('');
  host.innerHTML=`<div class="explorer-policy"><div><strong>${esc(r.status)}</strong><span>${r.ready?'Bridge könnte nach finaler Freigabe aktiviert werden.':`${r.pending.length} Aktivierungsgates noch offen`}</span><small>Prepared Allowlist: ${esc(PREPARED_ALLOWLIST_STATE)} · produktive Schreibrechte bleiben deaktiviert</small></div></div><div class="caps">${rows}</div>`;
}

globalThis.KICC_BRIDGE_READINESS_UI={render,state,currentInput};
render();setInterval(render,15000);
