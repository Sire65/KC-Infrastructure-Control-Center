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

export function evaluateFailoverState({supabaseHealth='UNKNOWN',neonHealth='UNKNOWN',syncLagMs=null,resyncComplete=false,verificationPassed=false,failbackApproved=false}){
  const supabaseDown=['FAILED','OFFLINE'].includes(supabaseHealth);
  const supabaseUp=['HEALTHY','ONLINE'].includes(supabaseHealth);
  const neonUp=['HEALTHY','ONLINE'].includes(neonHealth);

  if(supabaseDown && !neonUp) return {state:FAILOVER_STATES.BLOCKED,primary:'NONE',reason:'Supabase und Neon nicht betriebsbereit'};
  if(supabaseDown && neonUp) return {state:FAILOVER_STATES.FAILOVER_PENDING,primary:'SUPABASE',candidatePrimary:'NEON',reason:'Supabase ausgefallen, Neon betriebsbereit'};
  if(!supabaseUp) return {state:FAILOVER_STATES.DEGRADED,primary:'SUPABASE',reason:'Supabase-Status nicht bestätigt'};
  if(supabaseUp && !neonUp) return {state:FAILOVER_STATES.DEGRADED,primary:'SUPABASE',reason:'Neon Mirror nicht betriebsbereit'};
  if(supabaseUp && neonUp && resyncComplete && verificationPassed && failbackApproved) return {state:FAILOVER_STATES.RECOVERED,primary:'SUPABASE',reason:'Rücksynchronisierung und Failback verifiziert'};
  if(supabaseUp && neonUp && resyncComplete && verificationPassed) return {state:FAILOVER_STATES.FAILBACK_READY,primary:'NEON',candidatePrimary:'SUPABASE',reason:'Supabase wieder synchron und verifiziert'};
  if(supabaseUp && neonUp && resyncComplete) return {state:FAILOVER_STATES.VERIFYING,primary:'NEON',reason:'Rücksynchronisierung abgeschlossen, Verifikation ausstehend'};
  if(supabaseUp && neonUp && Number.isFinite(syncLagMs) && syncLagMs>0) return {state:FAILOVER_STATES.RESYNC_REQUIRED,primary:'NEON',reason:'Supabase wieder erreichbar, Datenabgleich erforderlich'};
  return {state:FAILOVER_STATES.NORMAL,primary:'SUPABASE',reason:'Supabase Primary, Neon Mirror/Standby'};
}

export function failoverRules(){
  return {
    automaticAllowed:['health-detection','incident-create','prepare-failover','prepare-resync','verification'],
    approvalRequired:['promote-neon-primary','failback-to-supabase'],
    invariants:[
      'Nie zwei schreibende PRIMARYs gleichzeitig.',
      'Failback zu Supabase erst nach vollständigem Resync und Verifikation.',
      'Während Neon PRIMARY ist, werden neue Änderungen auf Neon authoritative.',
      'Nach Rückkehr von Supabase werden Änderungen bidirektional abgeglichen, Konflikte deterministisch aufgelöst und protokolliert.',
      'KICC darf keinen Failover auslösen, wenn Recovery/Verifikation unklar ist.'
    ]
  };
}
