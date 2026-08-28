import { PREPARED_REPOSITORY_ALLOWLIST } from '../bridge/repository-allowlist.prepared.js';
function check(id,ok,detail,severity='ERROR'){return{id,ok:Boolean(ok),detail,severity};}
function fresh(ts,maxAgeMs){const t=Date.parse(ts||'');return Number.isFinite(t)&&t<=Date.now()+15000&&Date.now()-t<=maxAgeMs;}
export async function runRuntimeSmoke(){
 const out=[],kicc=globalThis.KICC;
 out.push(check('BOOT_KICC',Boolean(kicc),'KICC Runtime global vorhanden'));
 out.push(check('BOOT_PROGRAMS',Boolean(globalThis.KICC_PROGRAMS),'KC-Programmregistry geladen'));
 out.push(check('BOOT_HEARTBEATS',Boolean(globalThis.KICC_PROGRAM_HEARTBEATS),'Programm-Heartbeat-Runtime geladen'));
 out.push(check('BOOT_FLOWS',Boolean(globalThis.KICC_PROGRAM_FLOWS),'Programm-Flow-Runtime geladen'));
 out.push(check('BOOT_TOPOLOGY',Boolean(globalThis.KICC_LIVE_TOPOLOGY),'Live-Topologie geladen'));
 out.push(check('BOOT_LINK_DETAILS',Boolean(globalThis.KICC_TOPOLOGY_LINK_DETAILS),'Topologie-Verbindungsdetails geladen'));
 out.push(check('BOOT_FRITZ_OVERLAY',Boolean(globalThis.KICC_FRITZBOX_TOPOLOGY),'FRITZ!Box-Overlay geladen'));
 out.push(check('BOOT_NON_KC',Boolean(globalThis.KICC_NON_KC),'NON_KC-Registry geladen'));
 out.push(check('BOOT_EXPLORER',Boolean(globalThis.KICC_EXPLORER),'Repository-Explorer geladen'));
 out.push(check('BOOT_GIT_BRIDGE_CLIENT',Boolean(globalThis.KICC_GIT_BRIDGE),'Git-Bridge-Client geladen'));
 out.push(check('BOOT_SELFTEST_UI',Boolean(globalThis.KICC_TEST_UI),'Explorer-/Bridge-Selbsttest geladen'));
 out.push(check('BOOT_REPORT_TOOLS',Boolean(globalThis.KICC_REPORT_TOOLS),'Report-/Tabellen-Werkzeuge geladen'));
 out.push(check('TABLE_ROW_LIMIT',globalThis.KICC_REPORT_TOOLS?.maxVisibleRows===50,'Große Tabellen auf 50 sichtbare Zeilen begrenzt'));
 out.push(check('INDEXEDDB_AVAILABLE','indexedDB' in globalThis,'IndexedDB im Browser verfügbar'));
 const domVersion=document.getElementById('version')?.textContent?.trim()||null,runtimeVersion=kicc?.version||null;
 out.push(check('VERSION_MATCH',Boolean(domVersion&&runtimeVersion&&domVersion===runtimeVersion),`UI=${domVersion||'—'} · Runtime=${runtimeVersion||'—'}`));
 const requiredHosts=['repositoryExplorer','repositoryPolicySummary','explorerBridgeSelfTest','runtimeSmoke','topology','internetMonitor','mirrorHealth','kcProgramCards'];for(const id of requiredHosts)out.push(check(`DOM_${id.toUpperCase()}`,Boolean(document.getElementById(id)),`${id} im DOM vorhanden`));
 const duplicateIds=[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i);out.push(check('DOM_UNIQUE_IDS',duplicateIds.length===0,duplicateIds.length?`Doppelte IDs: ${[...new Set(duplicateIds)].join(', ')}`:'Keine doppelten DOM-IDs'));
 const panels=[...document.querySelectorAll('[data-kicc-panel]')],activePanels=panels.filter(p=>!p.hidden);out.push(check('NAV_SINGLE_ACTIVE_PANEL',activePanels.length===1,`${activePanels.length} sichtbare Fachregister`));out.push(check('NAV_PANEL_READY',activePanels.every(p=>p.dataset.kiccReady==='1'),'Aktives Fachregister als ready markiert'));
 const preparedWrites=PREPARED_REPOSITORY_ALLOWLIST.filter(p=>p.write===true);out.push(check('PREPARED_ALLOWLIST_READONLY',preparedWrites.length===0,preparedWrites.length?`${preparedWrites.length} vorbereitete Repos mit write=true`:'Alle vorbereiteten Repos write=false'));
 const bridge=globalThis.KICC_GIT_BRIDGE?.state||null,writeCaps=['repository.upload','repository.copy','repository.move','repository.delete','repository.mkdir'],liveWriteCaps=(bridge?.capabilities||[]).filter(c=>writeCaps.includes(c)),bridgeSafe=!bridge||bridge.state!=='READY'||liveWriteCaps.length===0;out.push(check('NO_UNEXPECTED_LIVE_WRITES',bridgeSafe,bridge?.state==='READY'?`READY · Schreib-Capabilities: ${liveWriteCaps.join(', ')||'keine'}`:`Bridge ${bridge?.state||'nicht geladen'} · kein aktiver Schreibkanal`));
 const hbApi=globalThis.KICC_PROGRAM_HEARTBEATS;out.push(check('HEARTBEAT_90S_POLICY',hbApi?.maxAgeMs===90000,`Heartbeat Max-Age ${hbApi?.maxAgeMs??'—'} ms`));const stale={measuredAt:new Date(Date.now()-91000).toISOString()};out.push(check('HEARTBEAT_STALE_NOT_FRESH',hbApi?hbApi.fresh(stale)===false:true,'Heartbeat >90 s wird nicht als frisch akzeptiert'));
 const currentHbs=hbApi?.list?.()||[],futureHbs=currentHbs.filter(h=>Date.parse(h.measuredAt)>Date.now()+15000);out.push(check('HEARTBEAT_NO_FUTURE_EVIDENCE',futureHbs.length===0,futureHbs.length?`${futureHbs.length} Heartbeat(s) mit unzulässiger Zukunftszeit`:'Keine unzulässigen Zukunfts-Heartbeats'));
 const net=globalThis.KICC_NETWORK_SNAPSHOT,netFresh=fresh(net?.measuredAt,25000);out.push(check('NETWORK_TRUTHFUL_FRESHNESS',!net||netFresh,net?`Snapshot ${netFresh?'frisch':'VERALTET'} · ${net.measuredAt}`:'Kein Snapshot → UNKNOWN zulässig','WARN'));
 const paths=[...document.querySelectorAll('#topology path.klt-link')],unmapped=paths.filter(p=>!p.dataset.from||!p.dataset.to);out.push(check('TOPOLOGY_SEMANTIC_EDGES',unmapped.length===0,unmapped.length?`${unmapped.length} Leitung(en) ohne from/to`:`${paths.length} Leitung(en) semantisch zugeordnet`));
 const legacyDirect=paths.filter(p=>(p.dataset.from==='gateway'&&p.dataset.to==='internet')&&(p.style.display!=='none'));const fritz=Boolean(document.querySelector('[data-klt-id="fritzbox"]'));out.push(check('TOPOLOGY_FRITZ_CORRIDOR',!fritz||legacyDirect.length===0,fritz?(legacyDirect.length?'Direkte Gateway→Internet-Leitung trotz FRITZ!Box sichtbar':'Gateway→FRITZ!Box→Internet-Korridor aktiv'):'FRITZ!Box-Overlay noch ohne aktuellen Agent-Nachweis','WARN'));
 const mirror=globalThis.KICC_MIRROR?.flow;if(mirror){const mh=globalThis.KICC_MIRROR.health?.();out.push(check('MIRROR_FAILOVER_EVIDENCE',mh?.readyForFailover!==true||mirror.trust==='OBSERVED_REMOTE',`Failover-ready=${mh?.readyForFailover?'JA':'NEIN'} · Trust=${mirror.trust}`));}else out.push(check('BOOT_MIRROR',false,'Mirror-Runtime nicht geladen'));
 const legacyLabel=[...document.querySelectorAll('.security-subhead span')].some(el=>/Legacy Marktkasse/i.test(el.textContent||''));out.push(check('LEGACY_LABEL_EXPLICIT',legacyLabel,'Lokaldaten-Migration explizit als Legacy Marktkasse bezeichnet'));
 const hardFails=out.filter(x=>!x.ok&&x.severity==='ERROR'),warnings=out.filter(x=>!x.ok&&x.severity==='WARN');return{profile:'KICC_RUNTIME_SMOKE_FINAL',status:hardFails.length?'FAIL':warnings.length?'WARN':'PASS',passed:out.length-hardFails.length-warnings.length,total:out.length,failed:hardFails.length,warnings:warnings.length,results:out,measuredAt:new Date().toISOString()};
}
globalThis.KICC_RUNTIME_SMOKE={run:runRuntimeSmoke};
