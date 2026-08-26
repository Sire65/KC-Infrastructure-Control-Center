const MAX_VISIBLE_ROWS=50;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const textOf=el=>(el?.innerText||'').replace(/\n{3,}/g,'\n\n').trim();

async function copyPanel(panel,status){
  const title=panel.querySelector('.panel-head h2,h2,h3')?.textContent?.trim()||'KICC Report';
  const text=`${title}\n${new Date().toLocaleString('de-DE')}\n\n${textOf(panel)}`;
  try{await navigator.clipboard.writeText(text);status.textContent='kopiert';setTimeout(()=>status.textContent='',1800);}catch{status.textContent='Fehler';}
}
function printPanel(panel){
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('print-target',p===panel));
  document.body.classList.add('print-single-panel');
  requestAnimationFrame(()=>{window.print();setTimeout(()=>{document.body.classList.remove('print-single-panel');document.querySelectorAll('.panel').forEach(p=>p.classList.remove('print-target'));},250);});
}
function ensurePanelTools(panel){
  if(panel.dataset.reportTools==='1')return;
  const head=panel.querySelector(':scope > .panel-head');if(!head)return;
  const tools=document.createElement('div');tools.className='report-toolbar';
  tools.innerHTML='<button type="button" class="report-tool-btn" data-copy>Report kopieren</button><button type="button" class="report-tool-btn" data-print>Drucken</button><span class="report-status" aria-live="polite"></span>';
  head.appendChild(tools);panel.dataset.reportTools='1';
  tools.querySelector('[data-copy]').addEventListener('click',()=>copyPanel(panel,tools.querySelector('.report-status')));
  tools.querySelector('[data-print]').addEventListener('click',()=>printPanel(panel));
}
function keyFor(table,index){return `kicc.table.view.${table.id||index}`;}
function applyLimit(table,wrap,index){
  const rows=[...table.tBodies].flatMap(tb=>[...tb.rows]);
  const key=keyFor(table,index),cleared=sessionStorage.getItem(`${key}.cleared`)==='1';
  wrap.classList.toggle('report-cleared',cleared);
  const showAll=sessionStorage.getItem(`${key}.all`)==='1';
  rows.forEach((row,i)=>{row.hidden=!showAll&&rows.length>MAX_VISIBLE_ROWS&&i<rows.length-MAX_VISIBLE_ROWS;});
  const count=wrap.querySelector('.table-count');if(count)count.textContent=cleared?`${rows.length} Zeilen · Ansicht geleert`:rows.length>MAX_VISIBLE_ROWS&&!showAll?`${rows.length} Zeilen · letzte ${MAX_VISIBLE_ROWS} sichtbar`:`${rows.length} Zeilen`;
  const toggle=wrap.querySelector('[data-table-toggle]');if(toggle)toggle.textContent=showAll?'Letzte 50':'Alle anzeigen';
}
function ensureTableTools(wrap,index){
  const table=wrap.querySelector('table');if(!table||wrap.dataset.tableTools==='1')return;
  const bar=document.createElement('div');bar.className='table-report-tools';
  bar.innerHTML='<span class="table-count"></span><button type="button" class="report-tool-btn" data-table-copy>Tabelle kopieren</button><button type="button" class="report-tool-btn" data-table-print>Drucken</button><button type="button" class="report-tool-btn" data-table-toggle>Alle anzeigen</button><button type="button" class="report-tool-btn danger" data-table-clear>Ansicht leeren</button>';
  wrap.prepend(bar);wrap.dataset.tableTools='1';
  const key=keyFor(table,index);
  bar.querySelector('[data-table-copy]').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(textOf(table));bar.querySelector('.table-count').textContent='Tabelle kopiert';setTimeout(()=>applyLimit(table,wrap,index),1600);}catch{}});
  bar.querySelector('[data-table-print]').addEventListener('click',()=>printPanel(wrap.closest('.panel')||wrap));
  bar.querySelector('[data-table-toggle]').addEventListener('click',()=>{sessionStorage.setItem(`${key}.all`,sessionStorage.getItem(`${key}.all`)==='1'?'0':'1');sessionStorage.removeItem(`${key}.cleared`);applyLimit(table,wrap,index);});
  bar.querySelector('[data-table-clear]').addEventListener('click',()=>{if(!confirm('Nur die lokale Tabellenansicht leeren? Produktive Daten werden nicht gelöscht.'))return;sessionStorage.setItem(`${key}.cleared`,'1');applyLimit(table,wrap,index);});
  applyLimit(table,wrap,index);
  new MutationObserver(()=>applyLimit(table,wrap,index)).observe(table,{childList:true,subtree:true});
}
function install(){document.querySelectorAll('.panel').forEach(ensurePanelTools);document.querySelectorAll('.table-wrap').forEach(ensureTableTools);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
globalThis.KICC_REPORT_TOOLS={install,maxVisibleRows:MAX_VISIBLE_ROWS};