import '../auth/runtime-auth-provider.js';
import '../auth/supabase-login-ui.js';
import '../auth/futura-reset-redirect-fix.js';
import '../auth/futura-password-recovery.js';
import '../telemetry/neon-runtime-config.js';
import '../sync/mirror-runtime-config.js';
import '../products/github-telemetry-runtime.js';
import '../ui/report-tools.js';
import '../live/live-console.js';
import '../update/pwa-update-manager.js';

const TAB_STORAGE='kicc.active.tab.v1';
const DEFAULT_TAB='dashboard';
function tabs(){return [...document.querySelectorAll('[data-kicc-tab]')];}
function panels(){return [...document.querySelectorAll('[data-kicc-panel]')];}
function validTab(id){return tabs().some(x=>x.dataset.kiccTab===id);}
export function activateTab(id,{updateHash=true}={}){const next=validTab(id)?id:DEFAULT_TAB;tabs().forEach(button=>{const active=button.dataset.kiccTab===next;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});panels().forEach(panel=>{const active=panel.dataset.kiccPanel===next;panel.hidden=!active;panel.classList.toggle('active',active);});try{localStorage.setItem(TAB_STORAGE,next);}catch{}if(updateHash&&location.hash!==`#${next}`)history.replaceState(null,'',`#${next}`);globalThis.dispatchEvent(new CustomEvent('kicc:tabchange',{detail:{tab:next}}));return next;}
function initialTab(){const hash=location.hash.replace(/^#/,'');if(validTab(hash))return hash;try{const stored=localStorage.getItem(TAB_STORAGE);if(validTab(stored))return stored;}catch{}return DEFAULT_TAB;}
function bind(){tabs().forEach(button=>button.addEventListener('click',()=>activateTab(button.dataset.kiccTab)));document.querySelector('[data-kicc-tablist]')?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const list=tabs();const current=Math.max(0,list.indexOf(document.activeElement));let index=current;if(event.key==='ArrowRight')index=(current+1)%list.length;if(event.key==='ArrowLeft')index=(current-1+list.length)%list.length;if(event.key==='Home')index=0;if(event.key==='End')index=list.length-1;event.preventDefault();activateTab(list[index].dataset.kiccTab);list[index].focus();});addEventListener('hashchange',()=>{const h=location.hash.replace(/^#/,'').trim();if(validTab(h))activateTab(h,{updateHash:false});});activateTab(initialTab(),{updateHash:false});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();globalThis.KICC_NAV={activateTab};
