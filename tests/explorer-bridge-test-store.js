const DB_NAME='kicc-diagnostics';
const DB_VERSION=1;
const STORE='test_results';
const KEY='explorer_bridge_standard';

function openDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in globalThis)){reject(new Error('IndexedDB nicht verfügbar'));return;}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Diagnose-DB konnte nicht geöffnet werden'));
  });
}

export async function saveExplorerBridgeTestResult(result){
  const db=await openDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put({id:KEY,savedAt:new Date().toISOString(),result});
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Testergebnis konnte nicht gespeichert werden'));
    });
  }finally{db.close();}
  return result;
}

export async function loadExplorerBridgeTestResult(){
  const db=await openDb();
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
  finally{db.close();}
}
