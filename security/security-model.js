export const SECURITY_STATES=['UNKNOWN','SECURE','WARNING','INSECURE'];
export const SECURITY_CONTROLS=[
  {id:'sec-payload-aes256gcm',name:'Payload-Verschlüsselung',category:'ENCRYPTION',expected:'AES-256-GCM',status:'UNKNOWN',evidence:null},
  {id:'sec-transport-tls',name:'Transportverschlüsselung',category:'TRANSPORT',expected:'TLS/HTTPS',status:'UNKNOWN',evidence:null},
  {id:'sec-auth-jwt',name:'Authentifizierung',category:'AUTH',expected:'JWT / kurzlebige Token',status:'UNKNOWN',evidence:null},
  {id:'sec-rls',name:'Row Level Security',category:'DATABASE',expected:'RLS/Policies für exponierte Tabellen',status:'UNKNOWN',evidence:null},
  {id:'sec-key-separation',name:'Schlüsseltrennung',category:'KEY_MANAGEMENT',expected:'Keine Secrets in Browser/Repo; getrennte Schlüssel pro Scope',status:'UNKNOWN',evidence:null},
  {id:'sec-audit',name:'Audit / Journal',category:'AUDIT',expected:'Sicherheitsrelevante Änderungen nachvollziehbar',status:'UNKNOWN',evidence:null}
];

export function createSecurityFlow({id,source,target,dataClass='UNKNOWN',transport='UNKNOWN',payloadEncryption='UNKNOWN',auth='UNKNOWN',keySource='UNKNOWN',lastVerifiedAt=null,trust='UNVERIFIED',domain='KC',notes=''}){
  return {id,type:'SECURITY_FLOW',source,target,dataClass,transport,payloadEncryption,auth,keySource,lastVerifiedAt,trust,domain,notes};
}

export function evaluateSecurityFlow(flow,now=Date.now(),maxAgeMs=24*60*60*1000){
  const issues=[];
  const transport=String(flow.transport||'UNKNOWN').toUpperCase();
  const payload=String(flow.payloadEncryption||'UNKNOWN').toUpperCase();
  const auth=String(flow.auth||'UNKNOWN').toUpperCase();
  const verified=flow.lastVerifiedAt?now-new Date(flow.lastVerifiedAt).getTime()<=maxAgeMs:false;

  if(transport==='NONE'||transport==='HTTP'||transport==='UNENCRYPTED')issues.push({severity:'RED',code:'TRANSPORT_UNENCRYPTED',message:'Transport nicht verschlüsselt'});
  else if(transport==='UNKNOWN')issues.push({severity:'YELLOW',code:'TRANSPORT_UNKNOWN',message:'Transportverschlüsselung nicht verifiziert'});

  if(payload==='NONE'||payload==='UNENCRYPTED')issues.push({severity:'RED',code:'PAYLOAD_UNENCRYPTED',message:'Payload unverschlüsselt'});
  else if(payload==='UNKNOWN')issues.push({severity:'YELLOW',code:'PAYLOAD_UNKNOWN',message:'Payload-Verschlüsselung nicht verifiziert'});

  if(auth==='NONE'||auth==='ANONYMOUS')issues.push({severity:'RED',code:'AUTH_WEAK',message:'Authentifizierung fehlt oder ist anonym'});
  else if(auth==='UNKNOWN')issues.push({severity:'YELLOW',code:'AUTH_UNKNOWN',message:'Authentifizierung nicht verifiziert'});

  if(!verified)issues.push({severity:'YELLOW',code:'STALE_EVIDENCE',message:'Kein aktueller Verifikationsnachweis'});
  if(!['OBSERVED_REMOTE','VERIFIED_CONFIG'].includes(flow.trust))issues.push({severity:'YELLOW',code:'TRUST_UNVERIFIED',message:'Security-Angaben nicht autoritativ bestätigt'});

  const red=issues.some(x=>x.severity==='RED');
  const yellow=issues.some(x=>x.severity==='YELLOW');
  return {status:red?'INSECURE':yellow?'WARNING':'SECURE',issues,verified};
}

export function securityGapSummary(flows=[]){
  const rows=flows.map(flow=>({flow,...evaluateSecurityFlow(flow)}));
  return {
    total:rows.length,
    secure:rows.filter(x=>x.status==='SECURE').length,
    warning:rows.filter(x=>x.status==='WARNING').length,
    insecure:rows.filter(x=>x.status==='INSECURE').length,
    unknown:rows.filter(x=>x.flow.transport==='UNKNOWN'||x.flow.payloadEncryption==='UNKNOWN'||x.flow.auth==='UNKNOWN').length,
    rows
  };
}
