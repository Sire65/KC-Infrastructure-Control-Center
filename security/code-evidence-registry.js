export const SECURITY_CODE_EVIDENCE=[
  {
    id:'evidence-kasse-security-baseline',
    productId:'kc-kasse',
    sourceRepo:'Sire65/Kasse',
    sourcePath:'SECURITY_ARCHITECTURE.md',
    evidenceType:'ARCHITECTURE_BASELINE',
    trust:'VERIFIED_CODE',
    findings:{
      transportExpected:'HTTPS/TLS',
      payloadExpected:'AES-256-GCM for application-controlled storage',
      authExpected:'PER_DEVICE_SIGNING_OR_MAC',
      replayProtectionExpected:true,
      secretsInClientForbidden:true
    }
  },
  {
    id:'evidence-kasse-resilience-runtime',
    productId:'kc-kasse',
    sourceRepo:'Sire65/Kasse',
    sourcePath:'shared/kc-resilience.js',
    evidenceType:'CODE_OBSERVATION',
    trust:'OBSERVED_CODE',
    findings:{
      syncEndpoint:'https://kc-failover-gateway.ha-joko.workers.dev',
      transportObserved:'HTTPS',
      clientStorageObserved:'localStorage',
      clientStoragePayloadObserved:'PLAINTEXT_JSON',
      requestAuthObserved:'NOT_VISIBLE_IN_CLIENT_MODULE',
      clientLabelObserved:'x-kc-client: KC-MarktKasse'
    }
  },
  {
    id:'evidence-gateway-security-baseline',
    productId:'kc-failover-gateway',
    sourceRepo:'Sire65/KC-Failover-Gateway',
    sourcePath:'SECURITY_ARCHITECTURE.md',
    evidenceType:'ARCHITECTURE_BASELINE',
    trust:'VERIFIED_CODE',
    findings:{
      syncAuthRequired:true,
      reconcileAuthRequired:true,
      restoreAuthRequired:true,
      clientLabelIsNotAuthentication:true,
      perDeviceRevocationRequired:true,
      replayProtectionRequired:true,
      leastPrivilegeDatabaseTlsRequired:true
    }
  }
];

export function evidenceForProduct(productId){
  return SECURITY_CODE_EVIDENCE.filter(x=>x.productId===productId);
}

export function codeEvidenceSummary(){
  return {
    total:SECURITY_CODE_EVIDENCE.length,
    architectureBaselines:SECURITY_CODE_EVIDENCE.filter(x=>x.evidenceType==='ARCHITECTURE_BASELINE').length,
    codeObservations:SECURITY_CODE_EVIDENCE.filter(x=>x.evidenceType==='CODE_OBSERVATION').length,
    rows:SECURITY_CODE_EVIDENCE.map(x=>({...x}))
  };
}
