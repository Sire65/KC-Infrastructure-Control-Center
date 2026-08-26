import { makeExplorerRepository, canBrowseDirect, downloadUrl, EXPLORER_INVARIANTS } from './repository-explorer-model.js';
import { bridgeTemplate, validateBridgeStatus, GIT_BRIDGE_INVARIANTS } from './git-bridge-contract.js';
import { createTransferAction, analyzeTransfer } from './transfer-action-model.js';

const state={repos:[],selectedRepo:null,currentPath:'',entries:[],loading:false,error:null,bridge:bridgeTemplate(),preparedAction:null};

function collectRepositories(){
  const rows=[];const seen=new Set();
  const add=(p,domain='KC')=>{if(!p)return;const key=`${domain}:${p.owner||'Sire65'}/${p.repo||p.name}`;if(seen.has(key))return;seen.add(key);rows.push(makeExplorerRepository({id:p.id||key,name:p.name||p.repo,owner:p.owner||'Sire65',repo:p.repo||null,domain,visibility:p.visibility||'UNKNOWN',source:'PROGRAM_REGISTRY'}));};
  (globalThis.KICC_PROGRAMS?.programs||[]).forEach(p=>add(p,'KC'));
  (globalThis.KICC_NON_KC?.programs||[]).forEach(p=>add(p,'NON_KC'));
  state.repos=rows.sort((a,b)=>`${a.domain}-${a.name}`.localeCompare(`${b.domain}-${b.name}`,'de'));
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function repoLabel(r){return `${r.domain} · ${r.name}${r.repo?` · ${r.owner}/${r.repo}`:' · kein Repo'}`;}

async function loadRepo(repo,path=''){
  state.selectedRepo=repo;state.currentPath=path;state.entries=[];state.error=null;state.loading=true;state.preparedAction=null;render();
  if(!repo.repo){state.loading=false;state.error='Für dieses Programm ist noch kein Repository registriert.';render();return;}
  if(!canBrowseDirect(repo)){state.loading=false;state.error='Repository nicht als PUBLIC verifiziert. Private Repositories benötigen den sicheren Git-Bridge-Kanal; Browser-Secrets werden nicht verwendet.';render();return;}
  try{
    const suffix=path?`/${path.split('/').map(encodeURIComponent).join('/')}`:'';
    const url=`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/contents${suffix}`;
    const response=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});if(!response.ok)throw new Error(`GitHub HTTP ${response.status}`);
    const data=await response.json(),list=Array.isArray(data)?data:[data];
    state.entries=list.map(x=>({name:x.name,path:x.path,type:x.type,size:x.size||0,sha:x.sha,download_url:x.download_url||null,html_url:x.html_url||null})).sort((a,b)=>(a.type===b.type?a.name.localeCompare(b.name,'de'):a.type==='dir'?-1:1));
  }catch(err){state.error=err?.message||'Repository konnte nicht geladen werden.';}
  state.loading=false;render();
}

function prepareAction(kind,path=null){
  const source=state.selectedRepo?repoLabel(state.selectedRepo):null;
  const action=createTransferAction({kind,source,branch:state.selectedRepo?.defaultBranch||'main',sourcePath:path,sourceDomain:state.selectedRepo?.domain||null});
  state.preparedAction=analyzeTransfer(action);render();return state.preparedAction;
}

function bridgeHtml(){
  const b=validateBridgeStatus(state.bridge),ready=b.ok&&b.state==='READY';
  return `<div class="explorer-bridge"><strong>Git-Bridge: ${esc(b.state)}</strong><span>${ready?'Authentifiziert und frisch verifiziert.':'Schreibkanal noch nicht aktiv; Lesen/Download bleiben getrennt.'}</span><small>${esc((b.issues||[]).join(' · ')||GIT_BRIDGE_INVARIANTS[0])}</small></div>`;
}
function preparedHtml(){
  const a=state.preparedAction;if(!a)return'';
  return `<div class="explorer-prepared"><strong>Aktion vorbereitet · ${esc(a.kind)} · ${esc(a.state)}</strong><span>Quelle: ${esc(a.source||'—')}</span><span>Pfad: ${esc(a.sourcePath||a.targetPath||'—')}</span><span>Recovery-Punkt: ${a.recoveryPoint?'vorhanden':'noch erforderlich'} · Freigabe: ${a.approval?'vorhanden':'noch erforderlich'}</span><small>${esc(a.analysis?.issues?.length?a.analysis.issues.join(' · '):'Noch keine Ausführung. Nächster zulässiger Schritt: Ziel/Recovery festlegen und danach explizit freigeben.')}</small></div>`;
}

function render(){
  const host=document.getElementById('repositoryExplorer');if(!host)return;if(!state.repos.length)collectRepositories();
  const selected=state.selectedRepo;
  const repoRows=state.repos.map(r=>`<button type="button" class="explorer-repo ${selected?.id===r.id?'selected':''}" data-repo="${esc(r.id)}"><span>${esc(r.name)}</span><small>${esc(r.domain)} · ${r.repo?esc(`${r.owner}/${r.repo}`):'kein Repo'}</small></button>`).join('');
  const crumbs=selected?`<button type="button" class="explorer-crumb" data-path="">${esc(selected.name)}</button>${state.currentPath.split('/').filter(Boolean).map((p,i,a)=>`<span>›</span><button type="button" class="explorer-crumb" data-path="${esc(a.slice(0,i+1).join('/'))}">${esc(p)}</button>`).join('')}`:'Kein Repository ausgewählt';
  const entries=state.loading?'<div class="empty-list">Repository wird gelesen …</div>':state.error?`<div class="empty-list">${esc(state.error)}</div>`:state.entries.length?state.entries.map(e=>{const isDir=e.type==='dir',dl=!isDir&&selected?downloadUrl(selected,e.path,selected.defaultBranch||'main'):null;return `<div class="explorer-entry"><button type="button" class="explorer-open" data-entry-path="${esc(e.path)}" data-entry-type="${esc(e.type)}"><span class="explorer-icon">${isDir?'📁':'📄'}</span><span><strong>${esc(e.name)}</strong><small>${isDir?'Ordner':`${Math.max(0,e.size)} Byte`}</small></span></button><div class="explorer-actions">${dl?`<a href="${esc(dl)}" download target="_blank" rel="noopener">Download</a>`:''}<button type="button" data-prepare="COPY" data-path="${esc(e.path)}">Kopieren vorbereiten</button><button type="button" data-prepare="MOVE" data-path="${esc(e.path)}">Verschieben vorbereiten</button><button type="button" data-prepare="DELETE" data-path="${esc(e.path)}">Löschen vorbereiten</button></div></div>`;}).join(''):'<div class="empty-list">Keine Einträge.</div>';
  host.innerHTML=`<div class="explorer-shell"><aside class="explorer-sidebar"><div class="explorer-toolbar"><strong>Git Explorer</strong><input id="explorerSearch" type="search" placeholder="Programme / Repos suchen" aria-label="Explorer durchsuchen"></div><div class="explorer-repos">${repoRows}</div></aside><section class="explorer-main"><div class="explorer-head"><div class="explorer-crumbs">${crumbs}</div><div class="explorer-head-actions"><button type="button" id="explorerRefresh" ${selected?'':'disabled'}>Aktualisieren</button><button type="button" id="prepareUpload" ${selected?'':'disabled'}>Upload vorbereiten</button></div></div>${bridgeHtml()}${preparedHtml()}${entries}<div class="explorer-policy"><strong>Schreibschutz / Action-Gate</strong><span>${esc(EXPLORER_INVARIANTS[3])}</span><span>${esc(GIT_BRIDGE_INVARIANTS[2])}</span></div></section></div>`;bind();
}
function bind(){
  const host=document.getElementById('repositoryExplorer');if(!host)return;
  host.querySelectorAll('[data-repo]').forEach(btn=>btn.addEventListener('click',()=>{const r=state.repos.find(x=>x.id===btn.dataset.repo);if(r)loadRepo(r,'');}));
  host.querySelectorAll('[data-entry-path]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.entryType==='dir'&&state.selectedRepo)loadRepo(state.selectedRepo,btn.dataset.entryPath);}));
  host.querySelectorAll('[data-path].explorer-crumb').forEach(btn=>btn.addEventListener('click',()=>state.selectedRepo&&loadRepo(state.selectedRepo,btn.dataset.path||'')));
  host.querySelector('#explorerRefresh')?.addEventListener('click',()=>state.selectedRepo&&loadRepo(state.selectedRepo,state.currentPath));
  host.querySelector('#prepareUpload')?.addEventListener('click',()=>prepareAction('UPLOAD',state.currentPath||null));
  host.querySelectorAll('[data-prepare]').forEach(btn=>btn.addEventListener('click',()=>prepareAction(btn.dataset.prepare,btn.dataset.path||null)));
  const search=host.querySelector('#explorerSearch');search?.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();host.querySelectorAll('.explorer-repo').forEach(btn=>{btn.hidden=q&&!btn.textContent.toLowerCase().includes(q);});});
}
function ingestBridgeStatus(payload){state.bridge=payload;render();return validateBridgeStatus(payload);}

globalThis.KICC_EXPLORER={state,render,refreshRegistry(){collectRepositories();render();},loadRepo,prepareAction,ingestBridgeStatus,bridgeStatus:()=>validateBridgeStatus(state.bridge)};
setTimeout(()=>{collectRepositories();render();},200);
