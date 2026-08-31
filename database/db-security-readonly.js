const FORBIDDEN_SQL=/\b(insert|update|delete|merge|alter|drop|truncate|create|grant|revoke|comment|vacuum|analyze|refresh|reindex|cluster|copy|call|do)\b/i;
const ALLOWED_PREFIX=/^\s*(select|with|show|explain\s+(?!analyze\b))/i;

export function assertReadOnlySql(sql){
  const text=String(sql||'').trim();
  if(!text) throw new Error('Leere SQL-Prüfung ist nicht erlaubt');
  if(text.includes(';') && text.replace(/;\s*$/,'').includes(';')) throw new Error('Mehrfach-Statements sind im DB-TÜV gesperrt');
  if(FORBIDDEN_SQL.test(text)) throw new Error('Schreibender oder administrativer SQL-Befehl im DB-TÜV gesperrt');
  if(!ALLOWED_PREFIX.test(text)) throw new Error('Nur SELECT, WITH, SHOW oder EXPLAIN ohne ANALYZE sind erlaubt');
  return text.replace(/;\s*$/,'');
}

export const READ_ONLY_SECURITY_QUERIES=Object.freeze({
  version:'select version()',
  ssl:'select current_setting(\'ssl\', true) as ssl',
  rls:`select n.nspname as schema_name,c.relname as table_name,c.relrowsecurity as rls_enabled,c.relforcerowsecurity as rls_forced from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname not in ('pg_catalog','information_schema') order by 1,2`,
  policies:`select schemaname,tablename,policyname,permissive,roles,cmd from pg_policies order by schemaname,tablename,policyname`,
  securityDefiner:`select n.nspname as schema_name,p.proname as function_name,p.prosecdef as security_definer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef=true and n.nspname not in ('pg_catalog','information_schema') order by 1,2`,
  publicPrivileges:`select table_schema,table_name,privilege_type from information_schema.table_privileges where grantee='PUBLIC' order by 1,2,3`,
  extensions:`select extname,extversion from pg_extension order by extname`
});

export function validateSecurityQuerySet(){
  return Object.fromEntries(Object.entries(READ_ONLY_SECURITY_QUERIES).map(([k,v])=>[k,assertReadOnlySql(v)]));
}

const ENVELOPE_KEYS=['ciphertext','cipher','ct','iv','nonce','tag','salt','alg','algorithm','version'];
const SENSITIVE_KEY=/pass(word)?|secret|token|private.?key|iban|email|phone|address/i;

export function classifyRecordShape(value){
  if(value==null||typeof value!=='object') return {encryptedEnvelope:false,sensitivePlaintextKeys:[]};
  const keys=Object.keys(value);
  const lower=keys.map(k=>k.toLowerCase());
  const encryptedEnvelope=ENVELOPE_KEYS.some(k=>lower.includes(k))&&(lower.includes('ciphertext')||lower.includes('cipher')||lower.includes('ct'));
  const sensitivePlaintextKeys=keys.filter(k=>SENSITIVE_KEY.test(k)&&!ENVELOPE_KEYS.includes(k.toLowerCase()));
  return {encryptedEnvelope,sensitivePlaintextKeys};
}

function openExistingDatabase(name){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(name);
    req.onupgradeneeded=()=>{ try{req.transaction?.abort();}catch{} reject(new Error('DB-TÜV öffnet keine neue/zu aktualisierende IndexedDB')); };
    req.onerror=()=>reject(req.error||new Error('IndexedDB konnte nicht geöffnet werden'));
    req.onsuccess=()=>resolve(req.result);
  });
}

function sampleStore(db,storeName,limit=3){
  return new Promise(resolve=>{
    const result={name:storeName,mode:'readonly',sampled:0,envelopeSamples:0,plaintextRiskKeys:[]};
    try{
      const tx=db.transaction(storeName,'readonly');
      const store=tx.objectStore(storeName);
      result.keyPath=store.keyPath??null;
      result.autoIncrement=store.autoIncrement===true;
      result.indexCount=store.indexNames.length;
      const req=store.openCursor();
      req.onerror=()=>resolve(result);
      req.onsuccess=e=>{
        const cursor=e.target.result;
        if(!cursor||result.sampled>=limit){ resolve(result); return; }
        result.sampled++;
        const shape=classifyRecordShape(cursor.value);
        if(shape.encryptedEnvelope) result.envelopeSamples++;
        for(const key of shape.sensitivePlaintextKeys) if(!result.plaintextRiskKeys.includes(key)) result.plaintextRiskKeys.push(key);
        cursor.continue();
      };
    }catch{ resolve(result); }
  });
}

export async function probeIndexedDbSecurity(){
  if(!('indexedDB' in globalThis)) return {status:'FAILED',scope:'CURRENT_ORIGIN_ONLY',databases:[]};
  if(typeof indexedDB.databases!=='function') return {status:'DEGRADED',scope:'CURRENT_ORIGIN_ONLY',databases:[],message:'Browser unterstützt indexedDB.databases() nicht'};
  const listed=(await indexedDB.databases()).filter(x=>x?.name);
  const databases=[];
  for(const meta of listed){
    let db;
    try{
      db=await openExistingDatabase(meta.name);
      const stores=[];
      for(const storeName of [...db.objectStoreNames]) stores.push(await sampleStore(db,storeName));
      databases.push({name:meta.name,version:db.version,stores,readOnly:true});
    }catch(error){
      databases.push({name:meta.name,error:error?.message||'Prüfung fehlgeschlagen',readOnly:true});
    }finally{ try{db?.close();}catch{} }
  }
  const risks=databases.flatMap(d=>(d.stores||[]).filter(s=>s.plaintextRiskKeys?.length).map(s=>({database:d.name,store:s.name,keys:s.plaintextRiskKeys})));
  return {status:risks.length?'DEGRADED':'HEALTHY',scope:'CURRENT_ORIGIN_ONLY',readOnly:true,databases,risks};
}
