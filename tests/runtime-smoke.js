import { PREPARED_REPOSITORY_ALLOWLIST } from '../bridge/repository-allowlist.prepared.js';

function check(id,ok,detail,severity='ERROR'){return{id,ok:Boolean(ok),detail,severity};}

export async function runRuntimeSmoke(){
  const out=[];
  const kicc=globalThis.KICC;
  out.push(check('BOOT_KICC',Boolean(kicc),'KICC Runtime global vorhanden'));
  out.push(check('BOOT_PROGRAMS',Boolean(globalThis.KICC_PROGRAMS),'KC-Programmregistry geladen'));
  out.push(check('BOOT_NON_KC',Boolean(globalThis.KICC_NON_KC),'NON_KC-Registry geladen'));
  out.push(check('BOOT_EXPLORER',Boolean(globalThis.KICC_EXPLORER),'Repository-Explorer geladen'));
  out.push(check('BOOT_GIT_BRIDGE_CLIENT',Boolean(globalThis.KICC_GIT_BRIDGE),'Git-Bridge-Client geladen'));
  out.push(check('BOOT_SELFTEST_UI',Boolean(globalThis.KICC_TEST_UI),'Explorer-/Bridge-Selbsttest geladen'));
  out.push(check('INDEXEDDB_AVAILABLE','indexedDB' in globalThis,'IndexedDB im Browser verfügbar'));

  const domVersion=document.getElementById('version')?.textContent?.trim()||null;
  const runtimeVersion=kicc?.version||null;
  out.push(check('VERSION_MATCH',Boolean(domVersion&&runtimeVersion&&domVersion===runtimeVersion),`UI=${domVersion||'—'} · Runtime=${runtimeVersion||'—'}`));

  const explorerHost=document.getElementById('repositoryExplorer');
  out.push(check('EXPLORER_HOST',Boolean(explorerHost),'Explorer-Container im DOM vorhanden'));
  const policyHost=document.getElementById('repositoryPolicySummary');
  out.push(check('POLICY_HOST',Boolean(policyHost),'Berechtigungsmatrix-Container im DOM vorhanden'));
  const selftestHost=document.getElementById('explorerBridgeSelfTest');
  out.push(check('SELFTEST_HOST',Boolean(selftestHost),'Selbsttest-Container im DOM vorhanden'));

  const preparedWrites=PREPARED_REPOSITORY_ALLOWLIST.filter(p=>p.write===true);
  out.push(check('PREPARED_ALLOWLIST_READONLY',preparedWrites.length===0,preparedWrites.length?`${preparedWrites.length} vorbereitete Repos mit write=true`:'Alle vorbereiteten Repos write=false'));

  const bridge=globalThis.KICC_GIT_BRIDGE?.state||null;
  const writeCaps=['repository.upload','repository.copy','repository.move','repository.delete','repository.mkdir'];
  const liveWriteCaps=(bridge?.capabilities||[]).filter(c=>writeCaps.includes(c));
  const bridgeSafe=!bridge||bridge.state!=='READY'||liveWriteCaps.length===0;
  out.push(check('NO_UNEXPECTED_LIVE_WRITES',bridgeSafe,bridge?.state==='READY'?`READY · Schreib-Capabilities: ${liveWriteCaps.join(', ')||'keine'}`:`Bridge ${bridge?.state||'nicht geladen'} · kein aktiver Schreibkanal`));

  const legacyLabel=[...document.querySelectorAll('.security-subhead span')].some(el=>/Legacy Marktkasse/i.test(el.textContent||''));
  out.push(check('LEGACY_LABEL_EXPLICIT',legacyLabel,'Lokaldaten-Migration ist explizit als Legacy Marktkasse bezeichnet'));

  const failed=out.filter(x=>!x.ok);
  return {profile:'KICC_RUNTIME_SMOKE',status:failed.length?'FAIL':'PASS',passed:out.length-failed.length,total:out.length,failed:failed.length,results:out,measuredAt:new Date().toISOString()};
}

globalThis.KICC_RUNTIME_SMOKE={run:runRuntimeSmoke};
