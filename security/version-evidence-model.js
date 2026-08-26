export const VERSION_EVIDENCE_ROWS=[
  {
    id:'kasse-legacy-root',product:'KC Marktkasse',variant:'LEGACY_ROOT',lifecycle:'DEPLOYED_LEGACY',
    source:'Sire65/Kasse · Repository-Root',sourceDate:null,
    storage:'localStorage',storageEncryption:'UNENCRYPTED',transport:'HTTPS',auth:'UNKNOWN',
    trust:'OBSERVED_CODE',runtimeVerified:false,
    note:'Plaintext-JSON in shared/kc-resilience.js belegt. Befund gilt nur für diesen Legacy-Root.'
  },
  {
    id:'kasse-suite-candidate',product:'KC Bilderkasse / MarktKasse Suite',variant:'SUITE_CANDIDATE',lifecycle:'CANDIDATE_NOT_DEPLOYED',
    source:'Sire65/Kasse · markt-kasse-suite · Paketimport 24.08.2026',sourceDate:'2026-08-24',
    storage:'IndexedDB (Hinweis, noch nicht direkt verifiziert)',storageEncryption:'UNKNOWN',transport:'HTTPS + TLS peer fingerprint pinning',auth:'ROTATING_DEVICE_CREDENTIAL',
    trust:'PARTIAL_VERIFIED_CODE',runtimeVerified:false,
    note:'Suite-Backend ist direkt lesbar und belegt HTTPS, Fingerprint-Pinning, Geräteidentität und Credential-Rotation. Lokale POS-/Bilderkassen-Speicherung ist im derzeit direkt lesbaren Bestand noch nicht eindeutig als IndexedDB/AES-GCM verifiziert.'
  }
];

export function versionEvidenceSummary(){
  return {
    total:VERSION_EVIDENCE_ROWS.length,
    deployed:VERSION_EVIDENCE_ROWS.filter(x=>x.lifecycle.startsWith('DEPLOYED')).length,
    candidates:VERSION_EVIDENCE_ROWS.filter(x=>x.lifecycle.includes('CANDIDATE')).length,
    runtimeVerified:VERSION_EVIDENCE_ROWS.filter(x=>x.runtimeVerified===true).length,
    rows:VERSION_EVIDENCE_ROWS.map(x=>({...x}))
  };
}

export function evidenceAppliesTo({variant,lifecycle}={}){
  return VERSION_EVIDENCE_ROWS.filter(x=>(!variant||x.variant===variant)&&(!lifecycle||x.lifecycle===lifecycle));
}

export const VERSION_EVIDENCE_RULES=[
  'Ein Security-Befund gilt nur für die Variante und den Build/Stand, aus dem der Nachweis stammt.',
  'LEGACY_ROOT-Befunde dürfen nicht automatisch auf SUITE_CANDIDATE oder eine spätere produktive Bilderkasse übertragen werden.',
  'Code-Nachweis ist nicht gleich Runtime-Nachweis.',
  'UNKNOWN bleibt UNKNOWN, bis Quellcode oder autoritative Laufzeittelemetrie den Schutz bestätigt.',
  'Eine produktive Installation muss später einen Build-/Release-Fingerprint liefern, damit KICC den passenden Evidence-Satz zuordnen kann.'
];
