function toRuntimeObservation(heartbeat={},device={}){
  const status=String(heartbeat.status||device.status||'UNKNOWN').toUpperCase();
  const health=['HEALTHY','ONLINE'].includes(status)?'HEALTHY':['DEGRADED','WARNING'].includes(status)?'DEGRADED':['FAILED','OFFLINE'].includes(status)?'FAILED':'UNKNOWN';
  return{
    measuredAt:heartbeat.measuredAt||device.measuredAt||new Date().toISOString(),
    trust:heartbeat.trust||device.trust||'UNVERIFIED',
    version:heartbeat.version||device.version||null,
    lastActivityAt:heartbeat.measuredAt||device.measuredAt||new Date().toISOString(),
    deploymentHealth:health,
    telemetryHealth:health
  };
}

function ingestEvent(event){
  const detail=event?.detail||{};
  const heartbeat=detail.heartbeat||detail;
  const device=detail.device||detail;
  const productId=detail.productId||heartbeat.programId||device.programId||null;
  if(!productId||typeof globalThis.KICC_PROGRAMS?.applyRuntimeObservation!=='function')return false;
  try{globalThis.KICC_PROGRAMS.applyRuntimeObservation(productId,toRuntimeObservation(heartbeat,device));return true;}catch{return false;}
}

globalThis.addEventListener('kicc:program-heartbeat-ingested',ingestEvent);
globalThis.KICC_PROGRAM_HEARTBEAT_PRODUCT_LINK={ingestEvent,toRuntimeObservation};
