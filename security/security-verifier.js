const VERIFIED_TRUST=new Set(['OBSERVED_REMOTE','VERIFIED_AGENT']);

export function httpsEndpoint(url){
  try{return new URL(url).protocol==='https:';}catch{return false;}
}

export async function verifyHttpsEndpoint(url,{authorization=null,apikey=null,timeoutMs=8000}={}){
  if(!httpsEndpoint(url))return{ok:false,status:'INSECURE',trust:'OBSERVED_LOCAL',evidence:'Endpoint ist nicht HTTPS',measuredAt:new Date().toISOString()};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const headers={accept:'application/json'};
    if(authorization)headers.authorization=authorization;
    if(apikey)headers.apikey=apikey;
    const response=await fetch(url,{method:'GET',headers,cache:'no-store',credentials:'omit',signal:controller.signal});
    const authProtected=response.status===401||response.status===403;
    return{
      ok:response.ok||authProtected,
      status:response.ok?'SECURE':authProtected?'WARNING':'WARNING',
      transport:'HTTPS',
      authProtected,
      httpStatus:response.status,
      trust:'OBSERVED_REMOTE',
      measuredAt:new Date().toISOString(),
      evidence:response.ok?'HTTPS-Endpunkt erreichbar':authProtected?'HTTPS erreichbar; Authentifizierung wird erzwungen':`HTTPS erreichbar, HTTP ${response.status}`
    };
  }catch(error){
    return{ok:false,status:'WARNING',transport:'HTTPS',trust:'OBSERVED_ATTEMPT',measuredAt:new Date().toISOString(),evidence:error?.name==='AbortError'?'HTTPS-Prüfung Timeout':`HTTPS-Prüfung fehlgeschlagen: ${error instanceof Error?error.message:String(error)}`};
  }finally{clearTimeout(timer);}
}

export function databaseSecurityEvidence(resource){
  if(!resource)return{status:'UNKNOWN',trust:'UNVERIFIED',evidence:'Datenbankressource nicht gefunden'};
  if(!VERIFIED_TRUST.has(resource.trust))return{status:'UNKNOWN',trust:resource.trust||'UNVERIFIED',evidence:'Keine autoritative Live-Telemetrie'};
  const policies=resource.policies;
  const policyCount=typeof policies==='object'&&Number.isFinite(policies?.count)?policies.count:null;
  const policyState=typeof policies==='object'?policies?.state:null;
  if(policyState==='FAILED'||policyState==='INSECURE')return{status:'INSECURE',trust:resource.trust,evidence:'Policy/RLS-Telemetrie meldet unsicheren Zustand'};
  if(policyCount!==null||policyState==='AVAILABLE'||policyState==='HEALTHY')return{status:'SECURE',trust:resource.trust,evidence:`Policy/RLS-Nachweis vorhanden${policyCount!==null?` · ${policyCount} Policies`:''}`,measuredAt:resource.measuredAt};
  return{status:'WARNING',trust:resource.trust,evidence:'Live-Telemetrie vorhanden, RLS/Policy-Nachweis aber unvollständig',measuredAt:resource.measuredAt};
}

export function certificateCapability(){
  return{browserCanVerifyTlsHandshake:true,browserCanReadCertificateMetadata:false,agentRequiredFor:['issuer','validFrom','validTo','daysRemaining','fingerprint','protocolVersion','cipherSuite']};
}
