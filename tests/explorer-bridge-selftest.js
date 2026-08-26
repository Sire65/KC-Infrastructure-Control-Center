import { evaluateRepositoryAccess, makeRepositoryPolicy } from '../bridge/repository-allowlist.js';
import { BRIDGE_ROLES } from '../bridge/bridge-roles.js';
import { createTransferAction, analyzeTransfer, markRecoveryReady, approveTransfer, executionEnvelope } from '../explorer/transfer-action-model.js';
import { createAuditPersistence } from '../bridge/audit-persistence.js';
import { validateBridgeStatus, bridgeTemplate } from '../explorer/git-bridge-contract.js';

function result(id,ok,detail=''){return{id,ok:Boolean(ok),detail};}
function expectThrows(fn){try{fn();return false;}catch{return true;}}

export async function runExplorerBridgeSelfTests(){
  const out=[];

  const policy=makeRepositoryPolicy({owner:'Sire65',repo:'Kasse',domain:'KC',read:true,download:true,write:false,branches:['main']});
  out.push(result('ALLOWLIST_DENY_UNKNOWN',!evaluateRepositoryAccess([policy],{owner:'Sire65',repo:'Unknown',ref:'main',capability:'repository.read'}).allowed,'Unbekanntes Repo muss blockiert bleiben'));
  out.push(result('ALLOWLIST_READ_KNOWN',evaluateRepositoryAccess([policy],{owner:'Sire65',repo:'Kasse',ref:'main',capability:'repository.read'}).allowed,'Bekanntes Repo read erlaubt'));
  out.push(result('ALLOWLIST_WRITE_BLOCKED',!evaluateRepositoryAccess([policy],{owner:'Sire65',repo:'Kasse',ref:'main',capability:'repository.upload'}).allowed,'Prepared-Allowlist darf nicht schreiben'));
  out.push(result('ALLOWLIST_BRANCH_BLOCKED',!evaluateRepositoryAccess([policy],{owner:'Sire65',repo:'Kasse',ref:'dev',capability:'repository.read'}).allowed,'Nicht erlaubter Branch blockiert'));

  out.push(result('ROLE_VIEWER_NO_DELETE',!BRIDGE_ROLES.VIEWER.includes('repository.delete'),'Viewer darf nicht löschen'));
  out.push(result('ROLE_OPERATOR_NO_MOVE',!BRIDGE_ROLES.OPERATOR.includes('repository.move'),'Operator darf nicht verschieben'));
  out.push(result('ROLE_ADMIN_DELETE',BRIDGE_ROLES.ADMIN.includes('repository.delete'),'Admin besitzt Delete-Capability'));

  const draft=createTransferAction({kind:'MOVE',source:'Sire65/Kasse',target:'Sire65/dp3',branch:'main',sourcePath:'a.txt',targetPath:'a.txt',sourceDomain:'KC',targetDomain:'KC'});
  analyzeTransfer(draft);
  out.push(result('MOVE_NEEDS_RECOVERY',draft.state==='ANALYZED'&&!draft.recoveryPoint,'MOVE muss Recovery benötigen'));
  out.push(result('MOVE_CANNOT_APPROVE_EARLY',expectThrows(()=>approveTransfer(draft,{approvedBy:'test',approvalId:'a1'})),'Freigabe vor Recovery blockiert'));
  markRecoveryReady(draft,{type:'SOURCE_SHA',value:'deadbeef'});
  approveTransfer(draft,{approvedBy:'selftest',approvalId:'approval-test'});
  const env=executionEnvelope(draft);
  out.push(result('TRANSFER_ENVELOPE_APPROVED',Boolean(env.approval&&env.recoveryPoint),'Envelope enthält Freigabe + Recovery'));

  const initial=bridgeTemplate();
  out.push(result('BRIDGE_DEFAULT_NOT_READY',validateBridgeStatus(initial).state!=='READY','Unkonfigurierte Bridge darf nicht READY sein'));
  const fakeReady={...initial,state:'READY',authenticated:true,trust:'OBSERVED_BRIDGE',measuredAt:new Date().toISOString(),capabilities:['repository.read']};
  out.push(result('BRIDGE_READY_REQUIRES_AUTH',validateBridgeStatus({...fakeReady,authenticated:false}).ok===false,'READY ohne Auth blockiert'));
  out.push(result('BRIDGE_FRESH_AUTH_READY',validateBridgeStatus(fakeReady).ok===true,'Frische authentifizierte Messung akzeptiert'));

  const memory=[];
  const store={
    async last(){return memory.at(-1)||null;},
    async findByRequestId(id){return memory.find(x=>x.event?.requestId===id)||null;},
    async append(r){memory.push(r);return r;},
    async list(){return [...memory];}
  };
  const persistence=createAuditPersistence({store});
  await persistence.append({schema:'kicc.git.audit.v1',requestId:'r1',at:new Date().toISOString(),subject:'selftest',action:'COPY',result:'STARTED'});
  await persistence.append({schema:'kicc.git.audit.v1',requestId:'r2',at:new Date().toISOString(),subject:'selftest',action:'COPY',result:'COMPLETED'});
  const chain=await persistence.verify();
  out.push(result('AUDIT_CHAIN_VALID',chain.ok===true,'Audit-Hash-Kette muss valide sein'));
  const duplicate=await persistence.append({schema:'kicc.git.audit.v1',requestId:'r2',at:new Date().toISOString(),subject:'selftest',action:'COPY',result:'COMPLETED'});
  out.push(result('AUDIT_IDEMPOTENT',duplicate.duplicate===true,'Doppelte requestId darf nicht doppelt persistieren'));

  const passed=out.filter(x=>x.ok).length;
  return {profile:'EXPLORER_BRIDGE_STANDARD',passed,total:out.length,failed:out.length-passed,status:passed===out.length?'PASS':'FAIL',results:out,measuredAt:new Date().toISOString()};
}

globalThis.KICC_TESTS={...(globalThis.KICC_TESTS||{}),runExplorerBridgeSelfTests};
