export const REGION_MIGRATION_STATES=['PLANNED','PRECHECK','RECOVERY_POINT','COPYING','DELTA_SYNC','VERIFYING','CUTOVER_READY','CUTOVER','POSTCHECK','COMPLETED','ROLLED_BACK','BLOCKED'];

export function createRegionMigration({id,resourceId,provider,sourceRegion,targetRegion,targetJurisdiction='DE',mode='COPY_AND_CUTOVER'}){
  return {id,resourceId,provider,sourceRegion,targetRegion,targetJurisdiction,mode,state:'PLANNED',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),recoveryPoint:null,copyProgress:null,deltaLagMs:null,verification:null,cutoverApproved:false,oldRegionDeleteApproved:false,notes:[]};
}

export function evaluateRegionMigration(migration,{precheckOk=false,recoveryPointOk=false,copyComplete=false,deltaSynced=false,verificationPassed=false,cutoverApproved=false,postcheckPassed=false,rollbackRequired=false}={}){
  if(rollbackRequired) return {...migration,state:'ROLLED_BACK'};
  if(!precheckOk) return {...migration,state:'PRECHECK'};
  if(!recoveryPointOk) return {...migration,state:'RECOVERY_POINT'};
  if(!copyComplete) return {...migration,state:'COPYING'};
  if(!deltaSynced) return {...migration,state:'DELTA_SYNC'};
  if(!verificationPassed) return {...migration,state:'VERIFYING'};
  if(!cutoverApproved) return {...migration,state:'CUTOVER_READY'};
  if(!postcheckPassed) return {...migration,state:'POSTCHECK'};
  return {...migration,state:'COMPLETED'};
}

export function migrationInvariants(){
  return [
    'Never delete the source region before verified cutover and explicit approval.',
    'Keep a valid recovery point before copy or cutover.',
    'For writable systems use delta sync or a controlled read-only window before cutover.',
    'Verify schema, object counts, checksums/integrity and application health before completion.',
    'Secrets and credentials must not be persisted in browser storage or repository files.'
  ];
}
