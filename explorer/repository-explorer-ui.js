import { makeExplorerRepository, canBrowseDirect, downloadUrl, writeActionPreview, EXPLORER_INVARIANTS } from './repository-explorer-model.js';

const state={repos:[],selectedRepo:null,currentPath:'',entries:[],loading:false,error:null};

function collectRepositories(){
  const rows=[];
  const seen=new Set();
  const add=(p,domain='KC')=>{
    if(!p)return;
    const key=`${domain}:${p.owner||'Sire65'}/${p.repo||p.name}`;
    if(seen.has(key))return;seen.add(key);
    rows.push(makeExplorerRepository({
      id:p.id||key,name:p.name||p.repo,owner:p.owner||'Sire65',repo:p.repo||null,domain,
      visibility:p.visibility||'UNKNOWN',source:'PROGRAM_REGISTRY'
    }));
  };
  (globalThis.KICC_PROGRAMS?.programs||[]).forEach(p=>add(p,'KC'));
  (globalThis.KICC_NON_KC?.programs||[]).forEach(p=>add(p,'NON_KC'));
  state.repos=rows.sort((a,b)=>`${a.domain}-${a.name}`.localeCompare(`${b.domain}-${b.name}`,'de'));
}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function repoLabel(r){return `${r.domain} · ${r.name}${r.repo?` · ${r.owner}/${r.repo}`:' · kein Repo'}`;}
function parentPath(path){const p=String(path||'').split('/').filter(Boolean);p.pop();return p.join('/');}

async function loadRepo(repo,path=''){
  state.selectedRepo=repo;state.currentPath=path;state.entries=[];state.error=null;state.loading=true;render();
  if(!repo.repo){state.loading=false;state.error='Für dieses Programm ist noch kein Repository registriert.';render();return;}
  if(!canBrowseDirect(repo)){
    state.loading=false;state.error='Dieses Repository ist nicht als PUBLIC verifiziert. Für private Repositories ist ein sicherer Git-Bridge-Kanal erforderlich; Browser-Secrets werden nicht verwendet.';render();return;
  }
  try{
    const suffix=path?`/${path.split('/').map(encodeURIComponent).join('/')}`:'';
    const url=`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/contents${suffix}`;
    const response=await fetch(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!response.ok)throw new Error(`GitHub HTTP ${response.status}`);
    const data=await response.json();
    const list=Array.isArray(data)?data:[data];
    state.entries=list.map(x=>({name:x.name,path:x.path,type:x.type,size:x.size||0,sha:x.sha,download_url:x.download_url||null,html_url:x.html_url||null})).sort((a,b)=>(a.type===b.type? a.name.localeCompare(b.name,'de') : a.type==='dir'?-1:1));
  }catch(err){state.error=err?.message||'Repository konnte nicht geladen werden.';}
  state.loading=false;render();
}

function render(){
  const host=document.getElementById('repositoryExplorer');if(!host)return;
  if(!state.repos.length)collectRepositories();
  const selected=state.selectedRepo;
  const repoRows=state.repos.map(r=>`<button type="button" class="explorer-repo ${selected?.id===r.id?'selected':''}" data-repo="${esc(r.id)}"><span>${esc(r.name)}</span><small>${esc(r.domain)} · ${r.repo?esc(`${r.owner}/${r.repo}`):'kein Repo'}</small></button>`).join('');
  const crumbs=selected?`<button type="button" class="explorer-crumb" data-path="">${esc(selected.name)}</button>${state.currentPath.split('/').filter(Boolean).map((p,i,a)=>`<span>›</span><button type="button" class="explorer-crumb" data-path="${esc(a.slice(0,i+1).join('/'))}">${esc(p)}</button>`).join('')}`:'Kein Repository ausgewählt';
  const entries=state.loading?'<div class="empty-list">Repository wird gelesen …</div>':state.error?`<div class="empty-list">${esc(state.error)}</div>`:state.entries.length?state.entries.map(e=>{
    const isDir=e.type==='dir';
    const dl=!isDir&&selected?downloadUrl(selected,e.path,selected.defaultBranch||'main'):null;
    return `<div class="explorer-entry"><button type="button" class="explorer-open" data-entry-path="${esc(e.path)}" data-entry-type="${esc(e.type)}"><span class="explorer-icon">${isDir?'📁':'📄'}</span><span><strong>${esc(e.name)}</strong><small>${isDir?'Ordner':`${Math.max(0,e.size)} Byte`}</small></span></button><div class="explorer-actions">${dl?`<a href="${esc(dl)}" download target="_blank" rel="noopener">Download</a>`:''}<button type="button" data-prepare="COPY" data-path="${esc(e.path)}" disabled title="Benötigt sicheren Git-Bridge-Kanal">Kopieren</button><button type="button" data-prepare="MOVE" data-path="${esc(e.path)}" disabled title="Benötigt sicheren Git-Bridge-Kanal">Verschieben</button></div></div>`;
  }).join(''):'<div class="empty-list">Keine Einträge.</div>';
  host.innerHTML=`<div class="explorer-shell"><aside class="explorer-sidebar"><div class="explorer-toolbar"><strong>Git Explorer</strong><input id="explorerSearch" type="search" placeholder="Programme / Repos suchen" aria-label="Explorer durchsuchen"></div><div class="explorer-repos">${repoRows}</div></aside><section class="explorer-main"><div class="explorer-head"><div class="explorer-crumbs">${crumbs}</div><div class="explorer-head-actions"><button type="button" id="explorerRefresh" ${selected?'':'disabled'}>Aktualisieren</button><button type="button" disabled title="Benötigt sicheren Git-Bridge-Kanal">Upload</button></div></div>${entries}<div class="explorer-policy"><strong>Schreibschutz aktiv</strong><span>${esc(EXPLORER_INVARIANTS[1])}</span><span>${esc(EXPLORER_INVARIANTS[3])}</span></div></section></div>`;
  bind();
}

function bind(){
  const host=document.getElementById('repositoryExplorer');if(!host)return;
  host.querySelectorAll('[data-repo]').forEach(btn=>btn.addEventListener('click',()=>{const r=state.repos.find(x=>x.id===btn.dataset.repo);if(r)loadRepo(r,'');}));
  host.querySelectorAll('[data-entry-path]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.entryType==='dir'&&state.selectedRepo)loadRepo(state.selectedRepo,btn.dataset.entryPath);}));
  host.querySelectorAll('[data-path].explorer-crumb').forEach(btn=>btn.addEventListener('click',()=>state.selectedRepo&&loadRepo(state.selectedRepo,btn.dataset.path||'')));
  host.querySelector('#explorerRefresh')?.addEventListener('click',()=>state.selectedRepo&&loadRepo(state.selectedRepo,state.currentPath));
  const search=host.querySelector('#explorerSearch');search?.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();host.querySelectorAll('.explorer-repo').forEach(btn=>{btn.hidden=q&&!btn.textContent.toLowerCase().includes(q);});});
}

function prepareWriteAction(kind,path){return writeActionPreview({kind,source:state.selectedRepo?repoLabel(state.selectedRepo):null,path});}

globalThis.KICC_EXPLORER={state,render,refreshRegistry(){collectRepositories();render();},loadRepo,prepareWriteAction};
setTimeout(()=>{collectRepositories();render();},200);
