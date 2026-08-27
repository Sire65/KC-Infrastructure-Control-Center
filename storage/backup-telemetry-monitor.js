const ENDPOINT='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-backup-telemetry';
const REFRESH_MS=60_000;
let latest=null;
let measuredAt=null;
let errorText='';

function ageText(ts){
  if(!ts)return'—';
  const ms=Date.now()-new Date(ts).getTime();
  if(!Number.isFinite(ms)||ms<0)return'—';
  const m=Math.floor(ms/60000);if(m<1)return'< 1 min';if(m<60)return`${m} min`;
  const h=Math.floor(m/60);if(h<48)return`${h} h`;
  return`${Math.floor(h/24)} d`;
}
function bytes(v){if(!Number.isFinite(Number(v)))return'—';let n=Number(v);const u=['B','KB','MB','GB','TB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++;}return`${n.toFixed(i?1:0)} ${u[i]}`;}
function cls(v){const s=String(v||'UNKNOWN').toUpperCase();if(['HEALTHY','SUCCESS','PASS','PASSED','READY','BEREIT'].includes(s))return'healthy';if(['DEGRADED','PARTIAL','WARN','WARNING','CANCELLED','RUNNING','PRÜFEN'].includes(s))return'degraded';if(['FAILED','FAIL','OFFLINE','INTERRUPTED','BLOCKED','BLOCKED_LIMIT','GESPERRT'].includes(s))return'failed';return'unknown';}
function chip(label,value){return`<span class="status-chip ${cls(value)}"><span class="dot"></span>${label}: ${value||'UNKNOWN'}</span>`;}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function host(){
  let el=document.getElementById('backupTelemetryEvidence');if(el)return el;
  const panel=document.querySelector('[data-kicc-panel="backup"]');
  const privatePanel=panel?.querySelector('.panel.db-panel');if(!panel||!privatePanel)return null;
  const section=document.createElement('section');section.className='panel db-panel';section.innerHTML='<div class="panel-head"><h2>Backup & Recovery Nachweise</h2><span>PC Backup Vault · serverseitig verifiziert</span></div><div id="backupTelemetryEvidence" class="database-grid"></div>';
  privatePanel.before(section);return section.querySelector('#backupTelemetryEvidence');
}
function policyText(policy){return`Backup ≤ ${policy.backupMaxAgeHours} h · Verify ≤ ${policy.verifyMaxAgeHours} h · Restore ≤ ${policy.restoreMaxAgeDays} d · RTO ≤ ${policy.rtoTargetSeconds} s`;}
function render(){
  const el=host();if(!el)return;
  const gate=globalThis.KICC_RECOVERY_GATE?.evaluate?.(latest)||{state:'UNKNOWN',label:'UNBEKANNT',reason:'Recovery-Bewertung wird geladen.',checks:[],policy:{backupMaxAgeHours:24,verifyMaxAgeHours:24,restoreMaxAgeDays:30,rtoTargetSeconds:300}};
  const recoveryCard=`<article class="db-card"><div class="db-title">${chip('Recovery',gate.label)}<strong>Recovery-Freigabe</strong></div><div class="db-meta"><span><strong>${esc(gate.reason)}</strong></span><span>Ziele: ${esc(policyText(gate.policy))}</span><span>Messung: ${measuredAt?new Date(measuredAt).toLocaleString('de-DE'):'—'}</span></div><div class="caps">${(gate.checks||[]).map(x=>`<span class="cap ${x.state==='READY'?'available':x.state==='BLOCKED'?'failed':'unknown'}" title="${esc(x.reason)}">${esc(x.label)} · ${x.state}</span>`).join('')}</div><div class="db-note">Kritische Aktionen erhalten nur bei BEREIT eine automatische Recovery-Freigabe. Andere Zustände benötigen Prüfung bzw. ausdrückliche Freigabe.</div></article>`;
  if(!latest){el.innerHTML=recoveryCard+`<article class="db-card"><div class="db-title">${chip('Telemetrie',errorText?'DEGRADED':'UNKNOWN')}<strong>PC Backup Vault</strong></div><div class="db-note">${esc(errorText||'Noch kein authentifizierter Backup-Nachweis empfangen.')}</div></article>`;return;}
  const r=latest;
  el.innerHTML=recoveryCard+`<article class="db-card"><div class="db-title">${chip('Backup',r.last_backup_status)}<strong>Letzte Sicherung</strong></div><div class="db-meta"><span>Zeit: ${r.last_backup_at?new Date(r.last_backup_at).toLocaleString('de-DE'):'—'} · ${ageText(r.last_backup_at)} alt</span><span>Umfang: ${Number.isFinite(Number(r.last_backup_files))?Number(r.last_backup_files).toLocaleString('de-DE'):'—'} Dateien · ${bytes(r.last_backup_bytes)}</span><span>Ziel: ${esc(r.backup_target||'—')}</span><span>Vault-Version: ${esc(r.app_version||'—')}</span></div></article>
  <article class="db-card"><div class="db-title">${chip('Integrität',r.integrity_status)}<strong>Verify / Integrität</strong></div><div class="db-meta"><span>Letzte Prüfung: ${r.last_verify_at?new Date(r.last_verify_at).toLocaleString('de-DE'):'—'}</span><span>Ergebnis: ${esc(r.last_verify_result||'UNKNOWN')}</span><span>Nachweisalter: ${ageText(r.last_verify_at)}</span></div></article>
  <article class="db-card"><div class="db-title">${chip('Restore',r.last_restore_test_result)}<strong>Wiederherstellung</strong></div><div class="db-meta"><span>Letzter Restore-Test: ${r.last_restore_test_at?new Date(r.last_restore_test_at).toLocaleString('de-DE'):'—'}</span><span>Ergebnis: ${esc(r.last_restore_test_result||'UNKNOWN')}</span><span>RPO aktuell: ${Number.isFinite(Number(r.rpo_seconds))?ageText(new Date(Date.now()-Number(r.rpo_seconds)*1000).toISOString()):'—'}</span><span>RTO: ${Number.isFinite(Number(r.rto_seconds))?`${Math.round(Number(r.rto_seconds))} s`:'noch nicht gemessen'}</span></div></article>`;
}
async function refresh(){
  const auth=await globalThis.KICC_AUTH?.getProgramHeartbeatBridgeAuth?.();
  if(!auth?.authorization){errorText='KC-Core-Anmeldung für Backup-Telemetrie erforderlich.';render();return;}
  const headers={accept:'application/json',authorization:auth.authorization};if(auth.apikey)headers.apikey=auth.apikey;
  try{
    const r=await fetch(ENDPOINT,{headers,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const p=await r.json();latest=p.latest||null;measuredAt=p.measuredAt||new Date().toISOString();errorText='';
  }catch(e){errorText=e instanceof Error?e.message:String(e);}
  render();
  globalThis.dispatchEvent(new CustomEvent('kicc:backup-telemetry',{detail:{latest,measuredAt,error:errorText,recovery:globalThis.KICC_RECOVERY_GATE?.evaluate?.(latest)||null}}));
}
function start(){render();refresh();setInterval(refresh,REFRESH_MS);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
globalThis.addEventListener('kicc:recovery-policy',render);
globalThis.KICC_BACKUP_TELEMETRY={refresh,render,snapshot:()=>({latest,measuredAt,error:errorText,recovery:globalThis.KICC_RECOVERY_GATE?.evaluate?.(latest)||null})};
