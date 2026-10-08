import { evaluateMirrorHealth, createMirrorFlow, applyMirrorObservation } from '../sync/mirror-health-model.js';

const check=(id,ok,detail,severity='ERROR')=>({id,ok:Boolean(ok),detail,severity});
const nowIso=(delta=0)=>new Date(Date.now()+delta).toISOString();

export async function runFinalRegression(){
  const out=[];
  const hb=globalThis.KICC_PROGRAM_HEARTBEATS,flows=globalThis.KICC_PROGRAM_FLOWS;
  out.push(check('HB_STALE_UNKNOWN',hb?.fresh?.({measuredAt:nowIso(-91_000)})===false,'Heartbeat >90 s wird verworfen'));
  out.push(check('HB_FUTURE_REJECT',hb?.fresh?.({measuredAt:nowIso(20_000)})===false,'Heartbeat >15 s Zukunft wird verworfen'));
  out.push(check('FLOW_STALE_REJECT',flows?.fresh?.({measuredAt:nowIso(-121_000)})===false,'Flow >120 s wird verworfen'));
  out.push(check('FLOW_FUTURE_REJECT',flows?.fresh?.({measuredAt:nowIso(20_000)})===false,'Flow >15 s Zukunft wird verworfen'));
  const pstatus=globalThis.KICC_DASHBOARD_INSTRUMENTS?.programStatus?.({id:'__missing_final_regression__'});
  out.push(check('PROGRAM_WITHOUT_EVIDENCE_UNKNOWN',pstatus==='UNKNOWN',`Programm ohne Evidenz → ${pstatus||'—'}`));
  const staleNet={measuredAt:nowIso(-30_000),internet:{status:'OK',latencyMs:8,packetLossPct:0},router:{status:'OK'},wan:{status:'OK'}};
  const ih=globalThis.KICC_INTERNET_HEALTH_SUMMARY?.verdict?.(staleNet);
  out.push(check('STALE_NETWORK_NOT_GREEN',ih?.result==='UNKNOWN',`30 s alte grüne Netzprobe → ${ih?.result||'—'}`));
  const fr=globalThis.KICC_FRITZ_RADIO_DETAILS;
  out.push(check('STALE_FRITZ_NOT_FRESH',fr?.fresh?.(staleNet)===false,'FRITZ-Funkdaten >25 s nicht frisch'));
  out.push(check('FUTURE_FRITZ_NOT_FRESH',fr?.fresh?.({measuredAt:nowIso(20_000)})===false,'FRITZ-Zukunftszeit >15 s nicht frisch'));

  const base=createMirrorFlow({id:'t',sourceId:'s',targetId:'n',name:'test',maxAgeMs:120000});
  applyMirrorObservation(base,{status:'HEALTHY',measuredAt:nowIso(),lastSuccessAt:nowIso(-1000),mismatchCount24h:9,errorCount24h:3,currentMismatchCount:0,currentConflictCount:0,trust:'OBSERVED_REMOTE'});
  const mh=evaluateMirrorHealth(base);
  out.push(check('MIRROR_HISTORY_NOT_CURRENT_FAILURE',mh.status==='HEALTHY',`24h-Historie bei aktuell 0 Abweichungen → ${mh.status}`));
  applyMirrorObservation(base,{status:'HEALTHY',measuredAt:nowIso(),lastSuccessAt:nowIso(-1000),currentMismatchCount:1,currentConflictCount:0,trust:'OBSERVED_REMOTE'});
  const mh2=evaluateMirrorHealth(base);
  out.push(check('MIRROR_CURRENT_MISMATCH_BLOCKS',mh2.status==='FAILED'&&!mh2.readyForFailover,`Aktuelle Abweichung → ${mh2.status}, Failover=${mh2.readyForFailover?'JA':'NEIN'}`));
  const mirror=globalThis.KICC_MIRROR?.flow,liveHealth=globalThis.KICC_MIRROR?.health?.();
  out.push(check('MIRROR_FAILOVER_REQUIRES_REMOTE',liveHealth?.readyForFailover!==true||mirror?.trust==='OBSERVED_REMOTE',`Live Failover-ready=${liveHealth?.readyForFailover?'JA':'NEIN'} · Trust=${mirror?.trust||'—'}`));

  // KICC-F-094 · Veraltete Backup-/Vault-Nachweise duerfen nie BEREIT ergeben.
  const gate=globalThis.KICC_RECOVERY_GATE;
  const okRun={last_backup_status:'SUCCESS',integrity_status:'PASS',last_restore_test_result:'PASS',rto_seconds:60,last_verify_at:nowIso(-3600_000),last_restore_test_at:nowIso(-86400_000)};
  const fresh=gate?.evaluate?.({...okRun,measured_at:nowIso(-60_000),last_backup_at:nowIso(-3600_000)},gate.defaults);
  out.push(check('RECOVERY_FRESH_READY',fresh?.state==='READY',`Frischer Vault-Nachweis → ${fresh?.state||'—'}`));
  const oldReport=gate?.evaluate?.({...okRun,measured_at:nowIso(-7*86400_000),last_backup_at:nowIso(-3600_000)},gate.defaults);
  out.push(check('RECOVERY_STALE_VAULT_REPORT_NOT_READY',oldReport?.state==='WARNING'&&oldReport.checks.some(x=>x.id==='telemetry'&&x.stale),`7 Tage alte Vault-Meldung → ${oldReport?.state||'—'}`));
  const noReportTs=gate?.evaluate?.({...okRun,last_backup_at:nowIso(-3600_000)},gate.defaults);
  out.push(check('RECOVERY_MISSING_REPORT_TS_NOT_READY',noReportTs?.state!=='READY',`Vault-Meldung ohne Zeitstempel → ${noReportTs?.state||'—'}`));
  const oldBackup=gate?.evaluate?.({...okRun,measured_at:nowIso(-60_000),last_backup_at:nowIso(-20*86400_000)},gate.defaults);
  out.push(check('RECOVERY_STALE_BACKUP_MARKED',oldBackup?.state!=='READY'&&oldBackup.checks.some(x=>x.id==='backup'&&x.stale),`20 Tage altes Backup → ${oldBackup?.state||'—'}`));

  // KICC-F-095 · Schutz gegen Fremdcode und Token-Abfluss.
  const csp=document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content||'';
  const scriptSrc=(csp.split(';').find(x=>x.trim().startsWith('script-src'))||'');
  out.push(check('CSP_PRESENT_NO_INLINE_SCRIPT',Boolean(scriptSrc)&&!scriptSrc.includes("'unsafe-inline'")&&!scriptSrc.includes("'unsafe-eval'"),`script-src: ${scriptSrc.trim()||'fehlt'}`));
  const cdn=[...document.querySelectorAll('script[src^="http"]')];
  out.push(check('EXTERNAL_SCRIPTS_HAVE_SRI',cdn.every(x=>/^sha(256|384|512)-/.test(x.integrity||'')),`${cdn.filter(x=>x.integrity).length}/${cdn.length} externe Skripte mit Prüfsumme`));
  out.push(check('NO_GLOBAL_REFRESH_TOKEN_READER',typeof globalThis.KICC_AUTO_LOGIN?.loadRefreshToken!=='function','Refresh-Token nicht über globale API lesbar'));

  const panels=[...document.querySelectorAll('[data-kicc-panel]')],visible=panels.filter(p=>!p.hidden);
  out.push(check('NAV_EXACTLY_ONE_PANEL',visible.length===1,`${visible.length} sichtbare Fachregister`));
  out.push(check('INTERNET_GAUGES_4',document.querySelectorAll('#internetInstrumentStrip .internet-instrument').length===4,`${document.querySelectorAll('#internetInstrumentStrip .internet-instrument').length}/4 Internet-Instrumente`));
  out.push(check('MORNING_REPORT_PRESENT',Boolean(document.getElementById('mirrorMorningReport')),'Morgenreport im Dashboard vorhanden'));
  out.push(check('STARTUP_READINESS_PRESENT',Boolean(globalThis.KICC_STARTUP_READINESS),'Start-Selbstheilung geladen'));
  out.push(check('NO_DUPLICATE_IDS',(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return new Set(ids).size===ids.length})(),'Keine doppelten DOM-IDs'));

  const hard=out.filter(x=>!x.ok&&x.severity==='ERROR'),warn=out.filter(x=>!x.ok&&x.severity==='WARN');
  return{profile:'KICC_FINAL_REGRESSION_TUEV',status:hard.length?'FAIL':warn.length?'WARN':'PASS',passed:out.length-hard.length-warn.length,total:out.length,failed:hard.length,warnings:warn.length,results:out,measuredAt:new Date().toISOString()};
}

globalThis.KICC_FINAL_REGRESSION={run:runFinalRegression};
