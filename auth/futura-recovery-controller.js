const FUTURA={
  url:'https://iddudrxuihdodnvejxcp.supabase.co',
  publishableKey:'sb_publishable_DWLycZijZEBvakXVncI5IQ_38LZCQxW'
};
const RETURN_URL='https://sire65.github.io/KC-Infrastructure-Control-Center/?recovery=futura';

function message(text,type=''){
  const host=document.getElementById('kiccAuthMessage');
  if(!host)return;
  host.className=`kicc-auth-message ${type}`.trim();
  host.textContent=text;
}

async function sendRecovery(email){
  const endpoint=`${FUTURA.url}/auth/v1/recover?redirect_to=${encodeURIComponent(RETURN_URL)}`;
  const response=await fetch(endpoint,{
    method:'POST',cache:'no-store',credentials:'omit',
    headers:{'content-type':'application/json','apikey':FUTURA.publishableKey},
    body:JSON.stringify({email})
  });
  let data=null;try{data=await response.json();}catch{}
  if(!response.ok){
    const detail=data?.msg||data?.message||data?.error_description||`HTTP ${response.status}`;
    throw new Error(detail);
  }
  return true;
}

function recoveryToken(){
  const query=new URLSearchParams(location.search);
  if(query.get('recovery')!=='futura')return null;
  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  if(hash.get('type')!=='recovery')return null;
  return hash.get('access_token');
}

function mountRecoveryDialog(){
  const token=recoveryToken();
  if(!token||document.getElementById('kiccFuturaRecoveryDialog'))return;
  const wrap=document.createElement('div');
  wrap.id='kiccFuturaRecoveryDialog';
  wrap.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(2,6,23,.86);display:grid;place-items:center;padding:20px';
  wrap.innerHTML=`<section style="width:min(520px,100%);background:#0f172a;border:1px solid #334155;border-radius:16px;padding:18px;color:#e5e7eb;box-shadow:0 24px 80px rgba(0,0,0,.45)">
    <h2 style="margin:0 0 6px">Future Academy · neues Passwort</h2>
    <p style="margin:0 0 14px;color:#94a3b8;font-size:13px">Der Recovery-Link ist gültig. Neues Passwort zweimal eingeben.</p>
    <label style="display:grid;gap:5px;margin-bottom:9px"><span style="font-size:12px;color:#94a3b8">Neues Passwort</span><input id="kiccFuturaNewPw1" type="password" autocomplete="new-password" style="padding:10px;border-radius:9px;border:1px solid #475569;background:#0b1220;color:#fff"></label>
    <label style="display:grid;gap:5px;margin-bottom:12px"><span style="font-size:12px;color:#94a3b8">Wiederholen</span><input id="kiccFuturaNewPw2" type="password" autocomplete="new-password" style="padding:10px;border-radius:9px;border:1px solid #475569;background:#0b1220;color:#fff"></label>
    <div id="kiccFuturaRecoveryMsg" style="min-height:18px;font-size:12px;margin-bottom:10px"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button id="kiccFuturaRecoverySave" style="padding:9px 12px;border-radius:9px;border:1px solid #2563eb;background:#1d4ed8;color:#fff;cursor:pointer">Neues Passwort speichern</button></div>
  </section>`;
  document.body.appendChild(wrap);
  const msg=wrap.querySelector('#kiccFuturaRecoveryMsg');
  wrap.querySelector('#kiccFuturaRecoverySave').addEventListener('click',async()=>{
    const p1=wrap.querySelector('#kiccFuturaNewPw1').value;
    const p2=wrap.querySelector('#kiccFuturaNewPw2').value;
    if(p1.length<8){msg.textContent='Passwort muss mindestens 8 Zeichen haben.';return;}
    if(p1!==p2){msg.textContent='Die beiden Passwörter stimmen nicht überein.';return;}
    const button=wrap.querySelector('#kiccFuturaRecoverySave');button.disabled=true;msg.textContent='Passwort wird gespeichert …';
    try{
      const response=await fetch(`${FUTURA.url}/auth/v1/user`,{
        method:'PUT',cache:'no-store',credentials:'omit',
        headers:{'content-type':'application/json','apikey':FUTURA.publishableKey,'authorization':`Bearer ${token}`},
        body:JSON.stringify({password:p1})
      });
      let data=null;try{data=await response.json();}catch{}
      if(!response.ok)throw new Error(data?.msg||data?.message||`HTTP ${response.status}`);
      msg.style.color='#86efac';msg.textContent='Passwort geändert. KICC wird zur normalen Anmeldung zurückgeführt.';
      setTimeout(()=>location.replace('https://sire65.github.io/KC-Infrastructure-Control-Center/#admin'),900);
    }catch(e){msg.style.color='#fca5a5';msg.textContent=e instanceof Error?e.message:String(e);button.disabled=false;}
  });
}

// Capture phase intentionally overrides the older reset handler so no duplicate mail is sent.
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('button[data-auth="reset-futura"]');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  const email=document.getElementById('kiccAuthEmail')?.value?.trim();
  if(!email){message('Für den Passwort-Reset zuerst die E-Mail-Adresse eingeben.','error');return;}
  button.disabled=true;
  try{
    await sendRecovery(email);
    message('Future-Passwort-Reset angefordert. Der neue Link führt zurück zu KICC. Bitte nur die neueste Recovery-Mail verwenden.','ok');
  }catch(e){
    const text=e instanceof Error?e.message:String(e);
    message(text.toLowerCase().includes('rate limit')?'E-Mail-Limit erreicht. Bitte jetzt keine weiteren Reset-Mails anfordern und später genau einmal erneut versuchen.':text,'error');
  }finally{button.disabled=false;}
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountRecoveryDialog,{once:true});else mountRecoveryDialog();

globalThis.KICC_FUTURA_RECOVERY={sendRecovery,returnUrl:RETURN_URL};