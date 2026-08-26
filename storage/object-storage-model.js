export const OBJECT_STORAGE_CAPABILITIES=['health','latency','capacity','usage','objectCount','upload','download','integrity','encryption','retention','restoreTest'];

export function makeObjectStorageResource({id,name,provider,role='BACKUP',scope='remote',domain='KC',bucket=null,credentialRef=null,retentionPolicy=null,encryptionPolicy=null,restorePolicy=null,adapterId=null,capabilities=[]}){
  return {id,type:'OBJECT_STORAGE',name,provider,role,scope,domain,bucket,credentialRef,retentionPolicy,encryptionPolicy,restorePolicy,adapterId,status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',latencyMs:null,capacity:null,usage:null,objectCount:null,lastUpload:null,lastDownload:null,lastIntegrityCheck:null,lastRestoreTest:null,capabilities:[...new Set(capabilities)]};
}

export function summarizeObjectStorage(resource){
  return {
    id:resource.id,provider:resource.provider,role:resource.role,status:resource.status||'UNKNOWN',scope:resource.scope,domain:resource.domain||'KC',bucket:resource.bucket||null,
    credentialRef:resource.credentialRef||null,retentionPolicy:resource.retentionPolicy||null,encryptionPolicy:resource.encryptionPolicy||null,restorePolicy:resource.restorePolicy||null,
    measuredAt:resource.measuredAt||null,trust:resource.trust||'UNVERIFIED',latencyMs:Number.isFinite(resource.latencyMs)?resource.latencyMs:null,
    capacity:resource.capacity??null,usage:resource.usage??null,objectCount:resource.objectCount??null,lastUpload:resource.lastUpload??null,lastIntegrityCheck:resource.lastIntegrityCheck??null,lastRestoreTest:resource.lastRestoreTest??null
  };
}
