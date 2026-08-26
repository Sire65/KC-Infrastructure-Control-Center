const EVIDENCE_ONLY_PATTERNS=[
  /nicht verifiziert/i,
  /kein aktueller verifikationsnachweis/i,
  /nicht autoritativ bestätigt/i,
  /noch keine agent-messung/i,
  /agent.*noch nicht/i,
  /nachweis unvollständig/i
];

function detailIsEvidenceOnly(detail=''){
  const parts=String(detail).split(' · ').map(x=>x.trim()).filter(Boolean);
  return parts.length>0&&parts.every(part=>EVIDENCE_ONLY_PATTERNS.some(rx=>rx.test(part)));
}

export function classifySecurityAction(action){
  if(!action)return{...action,priority:'VERIFY'};
  if(action.severity==='RED')return{...action,priority:'ACTION'};
  if(action.severity==='YELLOW'&&detailIsEvidenceOnly(action.detail))return{...action,priority:'VERIFY'};
  return{...action,priority:'ACTION'};
}

export function prioritizeSecurityActions(actions=[]){
  const classified=actions.map(classifySecurityAction);
  return{
    actionable:classified.filter(x=>x.priority==='ACTION'),
    verification:classified.filter(x=>x.priority==='VERIFY'),
    all:classified
  };
}

function install(){
  const sec=globalThis.KICC_SECURITY;
  if(!sec||sec.__priorityInstalled)return false;
  const original=sec.actions.bind(sec);
  sec.allActions=()=>prioritizeSecurityActions(original()).all;
  sec.verificationOpen=()=>prioritizeSecurityActions(original()).verification;
  sec.actions=()=>prioritizeSecurityActions(original()).actionable;
  sec.__priorityInstalled=true;
  globalThis.dispatchEvent(new CustomEvent('kicc:security-priority-ready'));
  return true;
}

function start(){
  if(install())return;
  const timer=setInterval(()=>{if(install())clearInterval(timer);},250);
  setTimeout(()=>clearInterval(timer),15_000);
}

start();
globalThis.KICC_SECURITY_PRIORITY={classifySecurityAction,prioritizeSecurityActions,install};
