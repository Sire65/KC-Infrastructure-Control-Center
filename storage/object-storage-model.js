export const OBJECT_STORAGE_CAPABILITIES=['health','latency','capacity','usage','objectCount','upload','download','integrity','encryption','retention','restoreTest'];

export function makeObjectStorageResource({id,name,provider,role='BACKUP',scope='remote',adapterId=null,capabilities=[]}){
  return {id,type:'OBJECT_STORAGE',name,provider,role,scope,adapterId,status:'UNKNOWN',measuredAt:null,trust:'UNVERIFIED',latencyMs:null,capacity:null,usage:null,objectCount:null,lastUpload:null,lastDownload:null,lastIntegrityCheck:null,lastRestoreTest:null,capabilities:[...new Set(capabilities)]};
}

export function summarizeObjectStorage(resource){
  return {
    id:resource.id,provider:resource.provider,role:resource.role,status:resource.status||'UNKNOWN',scope:resource.scope,
    measuredAt:resource.measuredAt||null,trust:resource.trust||'UNVERIFIED',latencyMs:Number.isFinite(resource.latencyMs)?resource.latencyMs:null,
    capacity:resource.capacity??null,usage:resource.usage??null,objectCount:resource.objectCount??null,lastUpload:resource.lastUpload??null,lastIntegrityCheck:resource.lastIntegrityCheck??null,lastRestoreTest:resource.lastRestoreTest??null
  };
}
