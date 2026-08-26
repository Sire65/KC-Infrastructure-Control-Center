export const FAILOVER_STATES={
  NORMAL:'NORMAL',
  DEGRADED:'DEGRADED',
  FAILOVER_PENDING:'FAILOVER_PENDING',
  NEON_PRIMARY:'NEON_PRIMARY',
  RESYNC_REQUIRED:'RESYNC_REQUIRED',
  RESYNCING:'RESYNCING',
  VERIFYING:'VERIFYING',
  FAILBACK_READY:'FAILBACK_READY',
  FAILBACK_PENDING:'FAILBACK_PENDING',
  RECOVERED:'RECOVERED',
  BLOCKED:'BLOCKED'
};

export function evaluateFailoverState({supabaseHealth='UNKNOWN',neonHealth='UNKNOWN',syncLagMs=null,mirrorReady=null,resyncComplete=false,verificationPassed=false,failbackApproved=false,neonWasPrimary=false}){
  const supabaseDown=['FAILED','OFFLINE'].includes(supabaseHealth);
  const supabaseUp=['HEALTHY','ONLINE'].includes(supabaseHealth);
  const neonUp=['HEALTHY','ONLINE'].includes(neonHealth);

  if(supabaseDown && !neonUp) return {state:FAILOVER_STATES.BLOCKED,primary:'NONE',reason:'Supabase und Neon nicht betriebsbereit'};
  if(supabaseDown && neonUp && mirrorReady!==true) return {state:FAILOVER_STATES.BLOCKED,primary:'SUPABASE',candidatePrimary:'NEON',reason:'Neon erreichbar, aber Mirror-Frische/Integrität für Failover nicht bestätigt'};
  if(supabaseDown && neonUp && mirrorReady===true && !neonWasPrimary) return {state:FAILOVER_STATES.FAILOVER_PENDING,primary:'SUPABASE',candidatePrimary:'NEON',reason:'Supabase ausgefallen; Neon und Mirror-Telemetrie failover-bereit, Promotion noch nicht freigegeben'};
  if(supabaseDown && neonUp && neonWasPrimary) return {state:FAILOVER_STATES.NEON_PRIMARY,primary:'NEON',candidatePrimary:'SUPABASE',reason:'Neon wurde ausdrücklich zum PRIMARY promoviert'};
  if(!supabaseUp) return {state:FAILOVER_STATES.DEGRADED,primary:neonWasPrimary?'NEON':'SUPABASE',reason:'Supabase-Status nicht bestätigt'};
  if(supabaseUp && !neonUp) return {state:FAILOVER_STATES.DEGRADED,primary:neonWasPrimary?'NEON':'SUPABASE',reason:'Neon Mirror nicht betriebsbereit'};
  if(supabaseUp && neonUp && mirrorReady===false && !neonWasPrimary) return {state:FAILOVER_STATES.DEGRADED,primary:'SUPABASE',reason:'Neon erreichbar, Mirror-Bereitschaft aber nicht bestätigt'};

  if(neonWasPrimary){
    if(supabaseUp && neonUp && resyncComplete && verificationPassed && failbackApproved) return {state:FAILOVER_STATES.RECOVERED,primary:'SUPABASE',reason:'Rücksynchronisierung und Failback verifiziert'};
    if(supabaseUp && neonUp && resyncComplete && verificationPassed) return {state:FAILOVER_STATES.FAILBACK_READY,primary:'NEON',candidatePrimary:'SUPABASE',reason:'Supabase wieder synchron und verifiziert'};
    if(supabaseUp && neonUp && resyncComplete) return {state:FAILOVER_STATES.VERIFYING,primary:'NEON',reason:'Rücksynchronisierung abgeschlossen, Verifikation ausstehend'};
    if(supabaseUp && neonUp && Number.isFinite(syncLagMs) && syncLagMs>0) return {state:FAILOVER_STATES.RESYNC_REQUIRED,primary:'NEON',candidatePrimary:'SUPABASE',reason:'Supabase wieder erreichbar, Datenabgleich nach bestätigtem Neon-Failover erforderlich'};
    if(supabaseUp && neonUp) return {state:FAILOVER_STATES.NEON_PRIMARY,primary:'NEON',candidatePrimary:'SUPABASE',reason:'Neon bleibt PRIMARY bis Resync, Verifikation und Failback-Freigabe abgeschlossen sind'};
  }

  if(supabaseUp && neonUp && Number.isFinite(syncLagMs) && syncLagMs>0) return {state:FAILOVER_STATES.DEGRADED,primary:'SUPABASE',candidatePrimary:'NEON',reason:'Mirror-Sync-Lag erkannt; Supabase bleibt PRIMARY, da kein Neon-Failover bestätigt ist'};
  return {state:FAILOVER_STATES.NORMAL,primary:'SUPABASE',reason:'Supabase PRIMARY, Neon Mirror/Standby'};
}

export function failoverRules(){
  return {
    automaticAllowed:['health-detection','incident-create','prepare-failover','prepare-resync','verification'],
    approvalRequired:['promote-neon-primary','failback-to-supabase'],
    invariants:[
      'Nie zwei schreibende PRIMARYs gleichzeitig.',
      'Failover nur bei aktuell bestätigter Mirror-Frische und Integrität.',
      'Failback zu Supabase erst nach vollständigem Resync und Verifikation.',
      'Während Neon PRIMARY ist, werden neue Änderungen auf Neon authoritative.',
      'Nach Rückkehr von Supabase werden Änderungen bidirektional abgeglichen, Konflikte deterministisch aufgelöst und protokolliert.',
      'KICC darf keinen Failover auslösen, wenn Recovery/Verifikation unklar ist.',
      'Neon darf nur nach explizit bestätigter Promotion als PRIMARY angezeigt werden.'
    ]
  };
}
