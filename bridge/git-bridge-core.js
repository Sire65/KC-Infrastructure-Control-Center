import { evaluateRepositoryAccess } from './repository-allowlist.js';
import { authorizeCapability } from './bridge-roles.js';

export const BRIDGE_SCHEMA='kicc.git.bridge.v1';

export const ACTION_CAPABILITY=Object.freeze({
  BROWSE:'repository.read',
  DOWNLOAD:'repository.download',
  UPLOAD:'repository.upload',
  COPY:'repository.copy',
  MOVE:'repository.move',
  DELETE:'repository.delete',
  MKDIR:'repository.mkdir'
});

export function requireAuthenticatedContext(ctx){
  if(!ctx?.authenticated||!ctx?.subject)throw new Error('AUTH_REQUIRED');
  if(!Array.isArray(ctx.roles))throw new Error('ROLES_REQUIRED');
  return ctx;
}

export function requireCapability(ctx,capability){
  requireAuthenticatedContext(ctx);
  const auth=authorizeCapability({roles:ctx.roles,capability});
  if(!auth.allowed)throw new Error(`CAPABILITY_DENIED:${capability}`);
  return true;
}

export function validateRepoRef({owner,repo,ref='main',path=''}={}){
  if(!owner||!repo)throw new Error('REPOSITORY_REQUIRED');
  const safePart=v=>typeof v==='string'&&v.length>0&&!v.includes('..')&&!v.includes('\\');
  if(!safePart(owner)||!safePart(repo)||!safePart(ref))throw new Error('INVALID_REPOSITORY_REFERENCE');
  if(path&&(!safePart(path)||path.startsWith('/')||path.includes('//')))throw new Error('INVALID_PATH');
  return {owner,repo,ref,path};
}

export function requireRepositoryAccess({ctx,policies,owner,repo,ref='main',capability}){
  requireCapability(ctx,capability);
  const access=evaluateRepositoryAccess(policies,{owner,repo,ref,capability});
  if(!access.allowed)throw new Error(access.reason);
  return access.policy;
}

export function makeAuditEvent({requestId,subject,action,repository,path,result,detail=null,recoveryPoint=null,approvalId=null}={}){
  return {
    schema:'kicc.git.audit.v1',requestId,at:new Date().toISOString(),subject,action,
    repository,path:path||null,result,detail,recoveryPoint,approvalId
  };
}

export function validateApprovedTransfer(envelope,ctx){
  if(!envelope?.actionId||!envelope?.kind||!envelope?.capability)throw new Error('TRANSFER_ENVELOPE_INCOMPLETE');
  requireCapability(ctx,envelope.capability);
  if(!envelope.approval?.approvalId||!envelope.approval?.approvedBy)throw new Error('APPROVAL_REQUIRED');
  if(!envelope.recoveryPoint?.type||!envelope.recoveryPoint?.value)throw new Error('RECOVERY_POINT_REQUIRED');
  if(!envelope.branch)throw new Error('BRANCH_REQUIRED');
  if(['COPY','MOVE','DELETE'].includes(envelope.kind)&&!envelope.sourcePath)throw new Error('SOURCE_PATH_REQUIRED');
  if(['UPLOAD','COPY','MOVE'].includes(envelope.kind)&&!envelope.targetPath)throw new Error('TARGET_PATH_REQUIRED');
  return true;
}

export async function executeTransfer({envelope,ctx,adapter,audit,policies=[]}){
  validateApprovedTransfer(envelope,ctx);
  if(!adapter)throw new Error('ADAPTER_REQUIRED');
  const requestId=envelope.actionId;
  const targetRef=envelope.target||envelope.source;
  if(targetRef?.owner&&targetRef?.repo)requireRepositoryAccess({ctx,policies,owner:targetRef.owner,repo:targetRef.repo,ref:envelope.branch,capability:envelope.capability});
  const journal=async(result,detail)=>audit?.(makeAuditEvent({requestId,subject:ctx.subject,action:envelope.kind,repository:targetRef,path:envelope.targetPath||envelope.sourcePath,result,detail,recoveryPoint:envelope.recoveryPoint,approvalId:envelope.approval?.approvalId||null}));
  await journal('STARTED');
  try{
    let result;
    if(envelope.kind==='UPLOAD')result=await adapter.upload(envelope,ctx);
    else if(envelope.kind==='COPY')result=await adapter.copy(envelope,ctx);
    else if(envelope.kind==='MOVE'){
      const copied=await adapter.copy(envelope,ctx);
      const verified=await adapter.verifyTarget(envelope,copied,ctx);
      if(!verified?.ok)throw new Error('MOVE_TARGET_VERIFY_FAILED');
      const deleted=await adapter.deleteSource(envelope,ctx);
      result={copied,verified,deleted};
    } else if(envelope.kind==='DELETE')result=await adapter.delete(envelope,ctx);
    else if(envelope.kind==='MKDIR')result=await adapter.mkdir(envelope,ctx);
    else throw new Error('UNSUPPORTED_TRANSFER_KIND');
    await journal('COMPLETED',result?.commitSha||null);
    return {ok:true,result};
  }catch(error){
    await journal('FAILED',error?.message||'UNKNOWN_ERROR');
    throw error;
  }
}
