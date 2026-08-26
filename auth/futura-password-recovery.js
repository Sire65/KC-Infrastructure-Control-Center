const FUTURA={url:'https://iddudrxuihdodnvejxcp.supabase.co',publishableKey:'sb_publishable_DWLycZijZEBvakXVncI5IQ_38LZCQxW'};
const RECOVERY_MARKER='recovery-futura';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function parseRecovery(){
  const hash=location.hash.replace(/^#/,'');
  const params=new URLSearchParams(hash.includes('=')?hash:'');
  const access=params.get('access_token');
  const type=params.get('type');
  const marker=hash===RECOVERY_MARKER||params.get('kicc')===RECOVERY_MARKER;
  return {active:Boolean(access&&(type==='recovery'||marker)),accessToken:access};
}

async function updatePassword(accessToken,password){
  const response=await fetch(`${FUTURA.url}/auth/v1/user`,{
    method:'PUT',cache:'no-store',credentials:'omit',
    headers:{'content-type':'application/json','apikey':FUTURA.publishableKey,'authorization':`Bearer ${accessToken}`},
    body:JSON.stringify({password})
  });
  let data=null;try{data=await response.json();}catch{}
  if(!response.ok)throw new Error(data?.msg||data?.message||`Passwortänderung HTTP ${response.status}`);
  return data;
}

function mount(){
  const state=parseRecovery();if(!state.active||document.getElementById('kiccFuturaRecovery'))return;
  const shell=document.querySelector('.shell')||document.body;
  const panel=document.createElement('section');panel.id='kiccFuturaRecovery';panel.className='panel';
  panel.innerHTML=`<div class="panel-head"><div><h2>Future Academy · neues Passwort setzen</h2><p>Der Recovery-Link wurde erkannt. Das neue Passwort wird direkt an Supabase übertragen und nicht in KICC gespeichert.</p></div><span class="tab-badge">PASSWORD RECOVERY</span></div><div style="padding:14px;display:grid;grid-template-columns:minmax(220px,1fr) minmax(220px,1fr) auto;gap:8px;align-items:end"><label class="kicc-auth-field"><span>Neues Passwort</span><input id="kiccRecoveryPw1" type="password" autocomplete="new-password"></label><label class="kicc-auth-field"><span>Passwort wiederholen</span><input id="kiccRecoveryPw2" type="password" autocomplete="new-password"></label><button id="kiccRecoverySave" class="btn primary">Neues Passwort speichern</button><div id="kiccRecoveryMsg" style="grid-column:1/-1;font-size:12px;color:#94a3b8"></div></div>`;
  shell.prepend(panel);
  const p1=panel.querySelector('#kiccRecoveryPw1'),p2=panel.querySelector('#kiccRecoveryPw2'),btn=panel.querySelector('#kiccRecoverySave'),msg=panel.querySelector('#kiccRecoveryMsg');
  btn.addEventListener('click',async()=>{
    if(p1.value.length<8){msg.textContent='Bitte mindestens 8 Zeichen verwenden.';return;}
    if(p1.value!==p2.value){msg.textContent='Die beiden Passwörter stimmen nicht überein.';return;}
    btn.disabled=true;msg.textContent='Passwort wird geändert …';
    try{await updatePassword(state.accessToken,p1.value);p1.value='';p2.value='';msg.textContent='Passwort erfolgreich geändert. Du kannst dich jetzt mit dem neuen Future-Academy-Passwort anmelden.';history.replaceState(null,'',location.pathname+location.search+'#admin');globalThis.KICC_NAV?.activateTab?.('admin');}
    catch(e){msg.textContent=e instanceof Error?e.message:String(e);}finally{btn.disabled=false;}
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
globalThis.KICC_FUTURA_RECOVERY={mount};
