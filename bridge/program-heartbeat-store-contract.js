export const HEARTBEAT_RETENTION_MS=15*60_000;
export const HEARTBEAT_MAX_PER_PROGRAM=12;

const clean=(v,max=160)=>typeof v==='string'?v.trim().slice(0,max):'';

export function createInMemoryHeartbeatStore({retentionMs=HEARTBEAT_RETENTION_MS,maxPerProgram=HEARTBEAT_MAX_PER_PROGRAM}={}){
  const rows=new Map();
  const purge=(now=Date.now())=>{
    for(const [key,list] of rows){
      const fresh=list.filter(x=>now-new Date(x.receivedAt).getTime()<=retentionMs).slice(-maxPerProgram);
      if(fresh.length)rows.set(key,fresh);else rows.delete(key);
    }
  };
  return Object.freeze({
    kind:'EPHEMERAL_MEMORY',
    async put(record){
      purge();
      const programId=clean(record?.heartbeat?.programId,120);if(!programId)throw new Error('programId required');
      const instanceId=clean(record?.heartbeat?.instanceId,120)||'default';
      const key=`${programId}:${instanceId}`;
      const list=rows.get(key)||[];
      list.push({...record,receivedAt:record.receivedAt||new Date().toISOString()});
      rows.set(key,list.slice(-maxPerProgram));
      return rows.get(key).at(-1);
    },
    async latest(){purge();return [...rows.values()].map(x=>x.at(-1)).filter(Boolean).sort((a,b)=>new Date(b.receivedAt)-new Date(a.receivedAt));},
    async clearExpired(){purge();return true;},
    stats(){purge();const lists=[...rows.values()];return{keys:lists.length,records:lists.reduce((n,x)=>n+x.length,0),retentionMs,maxPerProgram};}
  });
}

export function validateHeartbeatStore(store){
  return Boolean(store&&typeof store.put==='function'&&typeof store.latest==='function'&&typeof store.clearExpired==='function');
}
