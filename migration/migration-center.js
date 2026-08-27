import { evaluateRegionMigration } from './region-migration-model.js';

const phaseOrder=['PRECHECK','RECOVERY_POINT','COPYING','DELTA_SYNC','VERIFYING','CUTOVER_READY','POSTCHECK','COMPLETED'];

function progressForState(state){
  const i=phaseOrder.indexOf(state);
  return i<0?0:Math.round((i/(phaseOrder.length-1))*100);
}

function jurisdictionLabel(code){
  if(code==='DE')return'Deutschland';
  if(code==='EU')return'EU · nicht Deutschland';
  return code||'Unbekannt';
}

function ensureRuntime(migration){
  migration.runtime ||= {precheckOk:false,recoveryPointOk:false,copyComplete:false,deltaSynced:false,verificationPassed:false,cutoverApproved:false,postcheckPassed:false,rollbackRequired:false};
  return migration.runtime;
}
function recoverySnapshot(){return globalThis.KICC_BACKUP_TELEMETRY?.snapshot?.().latest||null;}
function recoveryGate(){return globalThis.KICC_RECOVERY_GATE?.canProceed?.('migration',recoverySnapshot())||{allowed:false,state:'UNKNOWN',reason:'Recovery-Gate noch nicht verfügbar.'};}

function recalc(migration){
  const next=evaluateRegionMigration(migration,ensureRuntime(migration));
  Object.assign(migration,next,{updatedAt:new Date().toISOString()});
  return migration;
}

function setGate(migrationId,gate,value=true){
  const migrations=globalThis.KICC_REGION_MIGRATION?.migrations||[];
  const migration=migrations.find(x=>x.id===migrationId);
  if(!migration)throw new Error('Unknown migration');
  const runtime=ensureRuntime(migration);
  if(!(gate in runtime))throw new Error('Unknown migration gate');
  if(gate==='recoveryPointOk'&&value===true){
    const recovery=recoveryGate();
    if(!recovery.allowed)throw new Error(`Recovery Point nicht freigegeben: ${recovery.reason}`);
  }
  if(gate==='cutoverApproved'&&value===true&&!runtime.recoveryPointOk)throw new Error('Cutover blockiert: Recovery Point wurde noch nicht bestätigt.');
  runtime[gate]=Boolean(value);
  recalc(migration);
  globalThis.KICC_REGION_MIGRATION?.render?.();
  renderCenter();
  return migration;
}

function stateText(state){
  return ({PLANNED:'Geplant',PRECHECK:'Vorprüfung',RECOVERY_POINT:'Recovery Point',COPYING:'Erstkopie',DELTA_SYNC:'Delta-Sync',VERIFYING:'Verifikation',CUTOVER_READY:'Umschaltung freigabebereit',POSTCHECK:'Nachkontrolle',COMPLETED:'Abgeschlossen',ROLLED_BACK:'Rollback',BLOCKED:'Blockiert'})[state]||state;
}

function gateRows(m){
  const r=ensureRuntime(m);
  const recovery=recoveryGate();
  const gates=[
    ['precheckOk','Vorprüfung','Region, Kompatibilität, Kosten/Quota, Abhängigkeiten'],
    ['recoveryPointOk','Recovery Point',`Wiederherstellbarer Ausgangsstand vorhanden · Recovery ${recovery.state}`],
    ['copyComplete','Erstkopie','Ziel vollständig initial befüllt'],
    ['deltaSynced','Delta-Sync','Letzte Änderungen aufgeholt / Schreibfenster kontrolliert'],
    ['verificationPassed','Verifikation','Schema, Counts, Checksums, Integrität und App-Test bestanden'],
    ['cutoverApproved','Cutover-Freigabe','Explizite Freigabe für Routing-/Endpoint-Wechsel'],
    ['postcheckPassed','Nachkontrolle','Ziel nach Umschaltung gesund und performant']
  ];
  return gates.map(([key,label,desc])=>`<div class="migration-gate"><span class="gate-mark ${r[key]?'done':''}">${r[key]?'✓':'○'}</span><div><strong>${label}</strong><small>${desc}</small></div></div>`).join('');
}

function renderCenter(){
  const host=document.getElementById('migrationCenter');
  const migrations=globalThis.KICC_REGION_MIGRATION?.migrations||[];
  if(!host||!migrations.length)return;
  migrations.forEach(recalc);
  host.innerHTML=migrations.map(m=>{
    const pct=progressForState(m.state);
    const de=m.targetJurisdiction==='DE';
    return `<article class="migration-card"><div class="migration-head"><div><strong>${m.provider}</strong><small>${m.sourceRegion} → ${m.targetRegion}</small></div><span class="status-chip ${m.state==='COMPLETED'?'healthy':m.state==='BLOCKED'?'failed':'degraded'}"><span class="dot"></span>${stateText(m.state)}</span></div><div class="migration-meta"><span>Ziel: ${jurisdictionLabel(m.targetJurisdiction)}</span><span>${de?'DE-Ziel erfüllt':'EU-Ziel · Deutschland nicht verfügbar'}</span><span>Ressource: ${m.resourceId}</span></div><div class="migration-progress"><div style="width:${pct}%"></div></div><div class="migration-gates">${gateRows(m)}</div><div class="migration-warning">Quelle bleibt erhalten. Löschung des alten Standorts ist ein separater, späterer Freigabeschritt.</div></article>`;
  }).join('');
}

window.KICC_MIGRATION_CENTER={render:renderCenter,setGate,progressForState,stateText,recoveryGate,summary(){return (globalThis.KICC_REGION_MIGRATION?.migrations||[]).map(m=>({id:m.id,state:recalc(m).state,progress:progressForState(m.state),targetJurisdiction:m.targetJurisdiction,recovery:recoveryGate().state}));}};

queueMicrotask(renderCenter);
setInterval(renderCenter,15000);
