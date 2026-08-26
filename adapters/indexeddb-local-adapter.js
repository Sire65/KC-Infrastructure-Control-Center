export const indexedDbLocalAdapter={
  id:'indexeddb-local',
  kind:'database',
  capabilities:['health','latency','schema','storage'],
  async probe(target){
    if(!('indexedDB' in globalThis)) return {status:'FAILED',message:'IndexedDB wird von diesem Browser nicht unterstützt'};
    try{
      let databases=[];
      if(typeof indexedDB.databases==='function') databases=await indexedDB.databases();
      const ownOriginCount=databases.length;
      return {
        status:'HEALTHY',
        schema:{databaseCount:ownOriginCount,scope:'CURRENT_ORIGIN_ONLY'},
        storage:{scope:'CURRENT_ORIGIN_ONLY',measured:false},
        message:typeof indexedDB.databases==='function'?`${ownOriginCount} IndexedDB-Datenbank(en) im KICC-Ursprung erkannt`:'IndexedDB verfügbar; Auflistung vom Browser nicht unterstützt'
      };
    }catch(error){
      return {status:'DEGRADED',message:error?.message||'IndexedDB-Prüfung fehlgeschlagen'};
    }
  }
};
