const FUTURA_URL='https://iddudrxuihdodnvejxcp.supabase.co';
const FUTURA_KEY='sb_publishable_DWLycZijZEBvakXVncI5IQ_38LZCQxW';
const RECOVERY_URL='https://sire65.github.io/KC-Infrastructure-Control-Center/#recovery-futura';

async function request(email){
  const endpoint=`${FUTURA_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(RECOVERY_URL)}`;
  const response=await fetch(endpoint,{method:'POST',cache:'no-store',credentials:'omit',headers:{'content-type':'application/json','apikey':FUTURA_KEY},body:JSON.stringify({email})});
  let data=null;try{data=await response.json();}catch{}
  if(!response.ok)throw new Error(data?.msg||data?.message||`Reset-Anfrage HTTP ${response.status}`);
}

document.addEventListener('click',async event=>{
  const button=event.target.closest?.('button[data-auth="reset-futura"]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  const panel=button.closest('#kiccSupabaseAuth');
  const email=panel?.querySelector('#kiccAuthEmail')?.value?.trim();
  const msg=panel?.querySelector('#kiccAuthMessage');
  if(!email){if(msg){msg.className='kicc-auth-message error';msg.textContent='Für den Passwort-Reset zuerst die E-Mail-Adresse eingeben.';}return;}
  button.disabled=true;if(msg){msg.className='kicc-auth-message';msg.textContent='Future-Academy-Recovery-Mail wird angefordert …';}
  try{await request(email);if(msg){msg.className='kicc-auth-message ok';msg.textContent='Recovery-Mail gesendet. Der Link führt jetzt zurück zu KICC statt zu localhost.';}}
  catch(e){if(msg){msg.className='kicc-auth-message error';msg.textContent=e instanceof Error?e.message:String(e);}}
  finally{button.disabled=false;}
},true);

globalThis.KICC_FUTURA_RESET={recoveryUrl:RECOVERY_URL};
