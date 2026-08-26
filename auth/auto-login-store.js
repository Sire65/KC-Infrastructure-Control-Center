const DB_NAME='kicc_secure_auth_v1';
const DB_VERSION=1;
const KEY_ID='kicc-auth-aes-gcm';
const SETTING_ID='auto-login-enabled';

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in globalThis))return reject(new Error('IndexedDB nicht verfügbar'));
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('keys'))db.createObjectStore('keys',{keyPath:'id'});
      if(!db.objectStoreNames.contains('tokens'))db.createObjectStore('tokens',{keyPath:'projectId'});
      if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'id'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Auth-Speicher konnte nicht geöffnet werden'));
  });
}
function txPromise(db,store,mode,work){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,mode),os=tx.objectStore(store);let result;
    try{result=work(os);}catch(e){reject(e);return;}
    tx.oncomplete=()=>resolve(result?.result);
    tx.onerror=()=>reject(tx.error||result?.error||new Error('IndexedDB Fehler'));
    tx.onabort=()=>reject(tx.error||new Error('IndexedDB abgebrochen'));
  });
}
async function getRecord(store,id){const db=await openDb();try{return await txPromise(db,store,'readonly',os=>os.get(id));}finally{db.close();}}
async function putRecord(store,value){const db=await openDb();try{await txPromise(db,store,'readwrite',os=>os.put(value));return true;}finally{db.close();}}
async function deleteRecord(store,id){const db=await openDb();try{await txPromise(db,store,'readwrite',os=>os.delete(id));return true;}finally{db.close();}}
async function clearStore(store){const db=await openDb();try{await txPromise(db,store,'readwrite',os=>os.clear());return true;}finally{db.close();}}

async function key(){
  const existing=await getRecord('keys',KEY_ID).catch(()=>null);
  if(existing?.key)return existing.key;
  if(!globalThis.crypto?.subtle)throw new Error('WebCrypto nicht verfügbar');
  const generated=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  await putRecord('keys',{id:KEY_ID,key:generated,createdAt:new Date().toISOString()});
  return generated;
}
function bytesToBase64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function base64ToBytes(text){const s=atob(text);return Uint8Array.from(s,c=>c.charCodeAt(0));}

export async function isAutoLoginEnabled(){return Boolean((await getRecord('settings',SETTING_ID).catch(()=>null))?.enabled);}
export async function setAutoLoginEnabled(enabled){
  await putRecord('settings',{id:SETTING_ID,enabled:Boolean(enabled),updatedAt:new Date().toISOString()});
  if(!enabled)await clearRefreshTokens();
  return Boolean(enabled);
}
export async function saveRefreshToken(projectId,refreshToken){
  if(!projectId||!refreshToken)throw new Error('Refresh-Token fehlt');
  const cryptoKey=await key(),iv=crypto.getRandomValues(new Uint8Array(12));
  const plain=new TextEncoder().encode(String(refreshToken));
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},cryptoKey,plain));
  await putRecord('tokens',{projectId:String(projectId),iv:bytesToBase64(iv),ciphertext:bytesToBase64(encrypted),updatedAt:new Date().toISOString()});
  return true;
}
export async function loadRefreshToken(projectId){
  const row=await getRecord('tokens',String(projectId)).catch(()=>null);if(!row)return null;
  try{
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(row.iv)},await key(),base64ToBytes(row.ciphertext));
    return new TextDecoder().decode(plain);
  }catch{return null;}
}
export async function removeRefreshToken(projectId){return deleteRecord('tokens',String(projectId));}
export async function clearRefreshTokens(){return clearStore('tokens').catch(()=>true);}
export async function status(){
  const enabled=await isAutoLoginEnabled();
  return{enabled,storage:'INDEXEDDB_AES_GCM',passwordStored:false,accessTokenStored:false};
}

globalThis.KICC_AUTO_LOGIN={isAutoLoginEnabled,setAutoLoginEnabled,saveRefreshToken,loadRefreshToken,removeRefreshToken,clearRefreshTokens,status};
