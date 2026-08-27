const POLICY_KEY='kicc.recovery.policy.v1';
const DEFAULT_POLICY=Object.freeze({
  backupMaxAgeHours:24,
  verifyMaxAgeHours:24,
  restoreMaxAgeDays:30,
  rtoTargetSeconds:300
});

function readPolicy(){
  try{
    const raw=localStorage.getItem(POLICY_KEY);
    if(!raw)return{...DEFAULT_POLICY};
    const parsed=JSON.parse(raw);
    return{...DEFAULT_POLICY,...parsed};
  }catch{return{...DEFAULT_POLICY};}
}
function savePolicy(next){
  const clean={
    backupMaxAgeHours:Math.max(1,Number(next.backupMaxAgeHours)||DEFAULT_POLICY.backupMaxAgeHours),
    verifyMaxAgeHours:Math.max(1,Number(next.verifyMaxAgeHours)||DEFAULT_POLICY.verifyMaxAgeHours),
    restoreMaxAgeDays:Math.max(1,Number(next.restoreMaxAgeDays)||DEFAULT_POLICY.restoreMaxAgeDays),
    rtoTargetSeconds:Math.max(1,Number(next.rtoTargetSeconds)||DEFAULT_POLICY.rtoTargetSeconds)
  };
  try{localStorage.setItem(POLICY_KEY,JSON.stringify(clean));}catch{}
  globalThis.dispatchEvent(new CustomEvent('kicc:recovery-policy',{detail:{policy:clean}}));
  return clean;
}
function upper(v){return String(v||'UNKNOWN').toUpperCase();}
function success(v){return ['SUCCESS','PASS','PASSED','HEALTHY','OK','VERIFIED'].includes(upper(v));}
function failed(v){return ['FAILED','FAIL','ERROR','CORRUPT','INTERRUPTED','BLOCKED','BLOCKED_LIMIT'].includes(upper(v));}
function ageMs(ts){const t=Date.parse(ts||'');return Number.isFinite(t)?Math.max(0,Date.now()-t):null;}
function checkAge(ts,maxMs,label){
  const age=ageMs(ts);
  if(age===null)return{state:'UNKNOWN',label,reason:`${label}: kein Zeitnachweis`};
  if(age>maxMs)return{state:'WARNING',label,reason:`${label}: Nachweis zu alt`};
  return{state:'READY',label,reason:`${label}: aktuell`};
}
function evaluate(telemetry,policy=readPolicy()){
  if(!telemetry)return{state:'UNKNOWN',label:'UNBEKANNT',reason:'Noch kein authentifizierter Backup-Nachweis vorhanden.',checks:[],policy};
  const checks=[];
  const backupStatus=upper(telemetry.last_backup_status);
  const verifyStatus=upper(telemetry.integrity_status||telemetry.last_verify_result);
  const restoreStatus=upper(telemetry.last_restore_test_result);

  if(failed(backupStatus))checks.push({state:'BLOCKED',label:'Backup',reason:`Letzte Sicherung: ${backupStatus}`});
  else if(success(backupStatus))checks.push(checkAge(telemetry.last_backup_at,policy.backupMaxAgeHours*3600_000,'Backup'));
  else checks.push({state:'UNKNOWN',label:'Backup',reason:'Backup-Erfolg noch nicht bestätigt'});

  if(failed(verifyStatus))checks.push({state:'BLOCKED',label:'Integrität',reason:`Integritätsprüfung: ${verifyStatus}`});
  else if(success(verifyStatus))checks.push(checkAge(telemetry.last_verify_at,policy.verifyMaxAgeHours*3600_000,'Integrität'));
  else checks.push({state:'UNKNOWN',label:'Integrität',reason:'Integrität noch nicht bestätigt'});

  if(failed(restoreStatus))checks.push({state:'BLOCKED',label:'Restore',reason:`Restore-Test: ${restoreStatus}`});
  else if(success(restoreStatus))checks.push(checkAge(telemetry.last_restore_test_at,policy.restoreMaxAgeDays*86400_000,'Restore-Test'));
  else checks.push({state:'UNKNOWN',label:'Restore',reason:'Restore-Test noch nicht bestätigt'});

  const rto=Number(telemetry.rto_seconds);
  if(Number.isFinite(rto))checks.push(rto<=policy.rtoTargetSeconds?{state:'READY',label:'RTO',reason:`RTO ${Math.round(rto)} s innerhalb Ziel ${policy.rtoTargetSeconds} s`}:{state:'WARNING',label:'RTO',reason:`RTO ${Math.round(rto)} s über Ziel ${policy.rtoTargetSeconds} s`});
  else checks.push({state:'UNKNOWN',label:'RTO',reason:'RTO noch nicht gemessen'});

  let state='READY';
  if(checks.some(x=>x.state==='BLOCKED'))state='BLOCKED';
  else if(checks.some(x=>x.state==='WARNING'))state='WARNING';
  else if(checks.some(x=>x.state==='UNKNOWN'))state='UNKNOWN';
  const label=state==='READY'?'BEREIT':state==='WARNING'?'PRÜFEN':state==='BLOCKED'?'GESPERRT':'UNBEKANNT';
  const reason=state==='READY'?'Backup, Integrität und Restore-Nachweis erfüllen die aktuellen Recovery-Ziele.':checks.filter(x=>x.state!=='READY').map(x=>x.reason).join(' · ');
  return{state,label,reason,checks,policy};
}
function canProceed(action,telemetry){
  const result=evaluate(telemetry);
  return{
    allowed:result.state==='READY',
    requiresApproval:result.state!=='READY',
    state:result.state,
    action:String(action||'critical-operation'),
    reason:result.reason,
    recovery:result
  };
}

globalThis.KICC_RECOVERY_GATE={evaluate,canProceed,policy:readPolicy,setPolicy:savePolicy,defaults:{...DEFAULT_POLICY}};
