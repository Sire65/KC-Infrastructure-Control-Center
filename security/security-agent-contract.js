export const SECURITY_AGENT_SCHEMA_VERSION='1.0';

export const SECURITY_AGENT_CAPABILITIES=[
  'tls.certificate.inspect',
  'tls.protocol.inspect',
  'tls.cipher.inspect',
  'endpoint.dns.inspect',
  'endpoint.connectivity.inspect'
];

export function createSecurityAgentTarget({id,name,url,domain='KC',critical=false}){
  if(!id||!name||!url)throw new TypeError('id, name and url required');
  return {id,name,url,domain,critical};
}

export function validateSecurityAgentObservation(payload,targetId,{maxAgeMs=10*60*1000}={}){
  if(!payload||typeof payload!=='object')throw new Error('Invalid security agent payload');
  if(payload.schemaVersion!==SECURITY_AGENT_SCHEMA_VERSION)throw new Error('Unsupported security agent schema');
  if(payload.targetId!==targetId)throw new Error('Security agent target mismatch');
  const measuredAt=new Date(payload.measuredAt).getTime();
  if(!Number.isFinite(measuredAt))throw new Error('Invalid security agent timestamp');
  if(Date.now()-measuredAt>maxAgeMs)throw new Error('Security agent observation stale');
  if(payload.trust!=='OBSERVED_AGENT')throw new Error('Security agent trust not authoritative');
  const cert=payload.certificate||{};
  return {
    targetId,
    measuredAt:payload.measuredAt,
    trust:'OBSERVED_AGENT',
    reachable:Boolean(payload.reachable),
    tlsVersion:payload.tlsVersion||null,
    cipher:payload.cipher||null,
    certificate:{
      subject:cert.subject||null,
      issuer:cert.issuer||null,
      serialNumber:cert.serialNumber||null,
      fingerprintSha256:cert.fingerprintSha256||null,
      validFrom:cert.validFrom||null,
      validTo:cert.validTo||null,
      hostnameValid:cert.hostnameValid===true,
      chainValid:cert.chainValid===true
    },
    dns:payload.dns?{addresses:Array.isArray(payload.dns.addresses)?payload.dns.addresses.slice(0,20):[],resolvedAt:payload.dns.resolvedAt||null}:null
  };
}

export function evaluateAgentTlsObservation(obs,now=Date.now()){
  if(!obs)return{status:'UNKNOWN',issues:['Noch keine Agent-Messung']};
  const issues=[];
  if(!obs.reachable)issues.push('Endpoint nicht erreichbar');
  if(!obs.tlsVersion)issues.push('TLS-Version fehlt');
  else if(!/^TLSv?1\.[23]$/i.test(obs.tlsVersion))issues.push(`Veraltete/unerwartete TLS-Version: ${obs.tlsVersion}`);
  if(!obs.cipher)issues.push('Cipher unbekannt');
  if(!obs.certificate?.hostnameValid)issues.push('Hostname-Zertifikatsprüfung nicht bestätigt');
  if(!obs.certificate?.chainValid)issues.push('Zertifikatskette nicht bestätigt');
  const validTo=obs.certificate?.validTo?new Date(obs.certificate.validTo).getTime():NaN;
  if(!Number.isFinite(validTo))issues.push('Zertifikatsablauf unbekannt');
  else {
    const days=(validTo-now)/86400000;
    if(days<0)issues.push('Zertifikat abgelaufen');
    else if(days<14)issues.push(`Zertifikat läuft in ${Math.ceil(days)} Tagen ab`);
  }
  const severe=issues.some(x=>/abgelaufen|nicht erreichbar|Zertifikatskette|Hostname/.test(x));
  return{status:severe?'INSECURE':issues.length?'WARNING':'SECURE',issues};
}

export const SECURITY_AGENT_INVARIANTS=[
  'Agent ist read-only und darf keine Zertifikate, Firewallregeln, DNS-Einträge oder Endpoints verändern.',
  'Agent liefert ausschließlich Security-Metadaten, keine fachlichen Nutzdaten.',
  'Agent-Secrets werden nicht im Browser, Repo oder Service-Worker gespeichert.',
  'Nur frische OBSERVED_AGENT-Messungen dürfen Zertifikats-/TLS-Details verifizieren.',
  'PRIVATE-Targets bleiben vom KC-Gesamtstatus getrennt.'
];
