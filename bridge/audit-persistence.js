import { makeAuditRecord, validateAuditEvent } from './audit-store-model.js';

function canonical(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}

async function sha256Hex(text){
  if(!globalThis.crypto?.subtle)throw new Error('WEBCRYPTO_REQUIRED');
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function eventHash(event,previousHash=null){
  return sha256Hex(canonical({previousHash:previousHash||null,event}));
}

export function createAuditPersistence({store}={}){
  if(!store||typeof store.last!=='function'||typeof store.append!=='function'||typeof store.list!=='function')throw new Error('AUDIT_STORE_REQUIRED');
  return {
    async append(event){
      const v=validateAuditEvent(event);if(!v.ok)throw new Error(v.issues.join(' · '));
      if(typeof store.findByRequestId==='function'){
        const existing=await store.findByRequestId(event.requestId);
        if(existing)return{duplicate:true,record:existing};
      }
      const prev=await store.last();
      const previousHash=prev?.eventHash||null;
      const hash=await eventHash(event,previousHash);
      const record=makeAuditRecord(event,{previousHash,eventHash:hash});
      await store.append(record);
      return{duplicate:false,record};
    },
    async verify(){return verifyAuditChain(await store.list());},
    async list(){return store.list();}
  };
}

export async function verifyAuditChain(records=[]){
  const issues=[];
  let expectedPrevious=null;
  for(let i=0;i<records.length;i++){
    const record=records[i];
    if(record?.previousHash!==(expectedPrevious||null))issues.push(`CHAIN_LINK_INVALID:${i}`);
    const expectedHash=await eventHash(record.event,record.previousHash||null);
    if(record?.eventHash!==expectedHash)issues.push(`EVENT_HASH_INVALID:${i}`);
    if(record?.appendOnly!==true)issues.push(`APPEND_ONLY_FLAG_MISSING:${i}`);
    expectedPrevious=record?.eventHash||null;
  }
  return{ok:issues.length===0,count:records.length,headHash:expectedPrevious,issues};
}
