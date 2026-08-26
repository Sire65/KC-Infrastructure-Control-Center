import { makeTelemetryObservation } from '../telemetry/telemetry-contract.js';

export const browserRuntimeAdapter={
  id:'browser-runtime',
  kind:'RUNTIME',
  capabilities:['health','latency','memory','storage','network','serviceWorker','visibility','version'],
  refreshMs:30_000,
  maxAgeMs:90_000,
  async probe(target){
    const started=globalThis.performance?.now?.()??Date.now();
    const nav=globalThis.navigator||{};
    let quota=null,usage=null;
    try{const estimate=await nav.storage?.estimate?.();quota=Number.isFinite(estimate?.quota)?estimate.quota:null;usage=Number.isFinite(estimate?.usage)?estimate.usage:null;}catch{}
    let sw='UNSUPPORTED';
    try{if('serviceWorker'in nav){const reg=await nav.serviceWorker.getRegistration?.();sw=reg?'REGISTERED':'NOT_REGISTERED';}}catch{sw='ERROR';}
    const memory=Number.isFinite(globalThis.performance?.memory?.usedJSHeapSize)?globalThis.performance.memory.usedJSHeapSize:null;
    const latency=Math.round((globalThis.performance?.now?.()??Date.now())-started);
    const online=nav.onLine!==false;
    return makeTelemetryObservation({
      targetId:target.id,status:online?'HEALTHY':'OFFLINE',trust:'OBSERVED',latencyMs:latency,
      message:online?'KICC Browser-Runtime gemessen':'Browser meldet offline',
      metrics:{
        online,
        storageUsageBytes:usage,
        storageQuotaBytes:quota,
        storageUsagePercent:Number.isFinite(usage)&&Number.isFinite(quota)&&quota>0?Math.round(usage/quota*10000)/100:null,
        jsHeapUsedBytes:memory,
        deviceMemoryGb:Number.isFinite(nav.deviceMemory)?nav.deviceMemory:null,
        hardwareConcurrency:Number.isFinite(nav.hardwareConcurrency)?nav.hardwareConcurrency:null,
        visibilityState:globalThis.document?.visibilityState||null,
        serviceWorker:sw
      },
      capabilities:{storage:{measured:Number.isFinite(usage)||Number.isFinite(quota)},network:{online},serviceWorker:{state:sw}},
      source:{adapterId:'browser-runtime',kind:'RUNTIME',channel:'LOCAL_BROWSER',version:globalThis.KICC?.version||null}
    });
  }
};
