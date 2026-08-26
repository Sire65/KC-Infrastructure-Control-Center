export const TRANSFER_STATES=Object.freeze([
  'DRAFT','ANALYZED','RECOVERY_READY','AWAITING_APPROVAL','APPROVED','EXECUTING','VERIFYING','COMPLETED','FAILED','ROLLED_BACK','BLOCKED'
]);

export function createTransferAction({kind,source,target,branch='main',sourcePath=null,targetPath=null,sourceDomain=null,targetDomain=null}={}){
  const id=`git-action-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  return {
    id,kind,state:'DRAFT',source,target,branch,sourcePath,targetPath,sourceDomain,targetDomain,
    destructive:['MOVE','DELETE'].includes(kind),crossDomain:Boolean(sourceDomain&&targetDomain&&sourceDomain!==targetDomain),
    capability:`repository.${String(kind||'').toLowerCase()}`,
    analysis:null,recoveryPoint:null,approval:null,execution:null,verification:null,rollback:null,
    journal:[{at:new Date().toISOString(),event:'CREATED',detail:'Transfer-Aktion angelegt; noch nicht ausgeführt.'}]
  };
}

export function analyzeTransfer(action){
  const issues=[];
  if(!action?.kind)issues.push('Aktion fehlt');
  if(!action?.source)issues.push('Quelle fehlt');
  if(!action?.branch)issues.push('Branch fehlt');
  if(action.kind!=='DELETE'&&!action.target)issues.push('Ziel fehlt');
  if(['COPY','MOVE','DELETE'].includes(action.kind)&&!action.sourcePath)issues.push('Quellpfad fehlt');
  if(['UPLOAD','COPY','MOVE'].includes(action.kind)&&!action.targetPath)issues.push('Zielpfad fehlt');
  action.analysis={issues,requiresConflictCheck:true,requiresRecoveryPoint:true,requiresExplicitApproval:true};
  action.state=issues.length?'BLOCKED':'ANALYZED';
  action.journal.push({at:new Date().toISOString(),event:'ANALYZED',detail:issues.length?issues.join(' · '):'Auswirkungen geprüft; Recovery/Freigabe erforderlich.'});
  return action;
}

export function markRecoveryReady(action,{type='SOURCE_SHA',value=null}={}){
  if(action.state!=='ANALYZED')throw new Error('Recovery-Punkt erst nach Analyse zulässig');
  if(!value)throw new Error('Recovery-Punkt fehlt');
  action.recoveryPoint={type,value,createdAt:new Date().toISOString()};
  action.state='AWAITING_APPROVAL';
  action.journal.push({at:new Date().toISOString(),event:'RECOVERY_READY',detail:`Recovery-Punkt ${type} gespeichert.`});
  return action;
}

export function approveTransfer(action,{approvedBy,approvalId}={}){
  if(action.state!=='AWAITING_APPROVAL')throw new Error('Aktion ist nicht freigabebereit');
  if(!approvedBy||!approvalId)throw new Error('Explizite Freigabe fehlt');
  action.approval={approvedBy,approvalId,approvedAt:new Date().toISOString()};
  action.state='APPROVED';
  action.journal.push({at:new Date().toISOString(),event:'APPROVED',detail:'Explizite Freigabe erteilt.'});
  return action;
}

export function executionEnvelope(action){
  if(action.state!=='APPROVED')throw new Error('Nicht freigegeben');
  return {
    actionId:action.id,kind:action.kind,capability:action.capability,source:action.source,target:action.target,
    branch:action.branch,sourcePath:action.sourcePath,targetPath:action.targetPath,recoveryPoint:action.recoveryPoint,
    approval:action.approval,crossDomain:action.crossDomain
  };
}
