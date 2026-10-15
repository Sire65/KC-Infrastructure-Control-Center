// kc-db-backup-verify-v2 · Restore-Read-Test eines KC-Datenbank-Backup-Satzes (Neon KC Core Mirror).
// Quelle im Repo seit Version 7 (KICC-F-100). Deploy: Supabase Edge Function, verify_jwt=false, Token-geschuetzt.
// Version 7: Ein unvollstaendiger Satz ergibt "error" statt "passed" (AGENTS.md Regel 11).
// Version 8 (KICC-F-102): Pruefung in Teilpaketen. Der Hauptaufruf ruft sich je Paket selbst auf (eigenes CPU-Budget
// je Aufruf), fuehrt die Ergebnisse zusammen und schreibt wie bisher. Antwortformat unveraendert (Backup-Worker prueft
// checked_tables/failed_tables). Ein abgebrochenes Paket zaehlt als Fehler, nie als bestanden.
// Version 9 (KICC-F-103): nach bestandenem Test laeuft die Aufbewahrungsregel im Neon-Archiv (kc_backup_retention_anwenden).
async function sicherGleich(a:string,b:string){const h=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [x,y]=await Promise.all([h(a),h(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0}
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";
import { assessBackupCompleteness } from "./completeness.js";
import { splitIntoParts, mergePartChecks } from "./parts.js";
const J={"Content-Type":"application/json","X-KC-Function-Version":"9"}; const b64d=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const PART_SIZE=40, PARALLEL=3;
const safeUuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
async function aesKey(s:string){const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return crypto.subtle.importKey("raw",h,{name:"AES-GCM"},false,["decrypt"])}
async function decrypt(p:any,key:CryptoKey){if(typeof p==="string")p=JSON.parse(p);const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(String(p.iv))},key,b64d(String(p.ciphertext)));return new TextDecoder().decode(plain)}

// Erwartung des Satzes: Tabellenzahl aus dem Dispatch-Audit, Namen aus der Backup-Registry (wie im Backup-Worker).
async function expectation(sb:any,set:string){
  const {data:audit}=await sb.from("kc_db_mirror_audit").select("metadata").eq("action","immutable_backup_dispatched").eq("metadata->>backup_set",set).order("happened_at",{ascending:false}).limit(1);
  const meta=audit?.[0]?.metadata||{};
  const {data:rules}=await sb.from("kc_db_mirror_table_rules").select("table_name").eq("backup_enabled",true).eq("mirror_enabled",true).neq("sensitivity","secret");
  const count=Number(meta.tables);
  return {dispatchedCount:Number.isInteger(count)&&count>0?count:null,registryTables:(rules||[]).map((r:any)=>String(r.table_name)),deferredTables:Array.isArray(meta.deferred)?meta.deferred.map(String):[]};
}

// Ein Teilpaket: entschluesseln, Zeilenzahl und Hash in Neon nachrechnen.
async function checkTables(neon:any,secret:string,set:string,tables:string[]){
  const key=await aesKey(secret);
  const snaps=await neon.unsafe("select table_name,row_count,content_hash,payload from public.kc_backup_snapshots where backup_set=$1::uuid and table_name=any($2::text[]) order by table_name",[set,tables]);
  const checks:any[]=[];
  for(const s of snaps){const table=String(s.table_name);try{
    const text=await decrypt(s.payload,key);
    if(table==="kc_dp_pilot_testers"){const arr=JSON.parse(text);checks.push({table,status:Array.isArray(arr)&&arr.length===Number(s.row_count)?"ok":"error",integrity:"aes_gcm",schema_compatible:true});continue}
    const stable=table==="kc_dp_entity_versions"||table==="kc_communication_templates";
    const base=`jsonb_populate_recordset(null::public."${table}",($1::text)::jsonb)`;
    const sql=stable?`select count(*)::bigint n,md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by md5(to_jsonb(x)::text) collate "C"),'')) h from ${base} x`:`select count(*)::bigint n,md5(coalesce(string_agg(row_to_json(x)::text,'' order by row_to_json(x)::text),'')) h from ${base} x`;
    const v=await neon.unsafe(sql,[text]);
    const ok=String(v[0]?.n||0)===String(s.row_count)&&String(v[0]?.h||"")===String(s.content_hash||"");
    checks.push({table,status:ok?"ok":"error",row_count:Number(v[0]?.n||0),hash_match:String(v[0]?.h||"")===String(s.content_hash||"")});
  }catch(e){checks.push({table,status:"error",reason:String(e).slice(0,160)})}}
  return checks;
}

// Teilpaket als eigener Aufruf dieser Funktion; ein Wiederholungsversuch bei Abbruch (z. B. 546 CPU-Limit).
async function runPart(token:string,set:string,tables:string[]){
  for(let attempt=0;attempt<2;attempt++){
    try{
      const r=await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/kc-db-backup-verify-v2`,{method:"POST",headers:{"Content-Type":"application/json","x-kc-mirror-token":token},body:JSON.stringify({backup_set:set,part_tables:tables})});
      if(r.ok){const j=await r.json();if(Array.isArray(j?.checks))return j}
    }catch{/* naechster Versuch */}
  }
  return null;
}

async function runParts(token:string,set:string,parts:string[][]){
  const results:any[]=new Array(parts.length).fill(null);let next=0;
  const lane=async()=>{while(next<parts.length){const i=next++;results[i]=await runPart(token,set,parts[i])}};
  await Promise.all(Array.from({length:Math.min(PARALLEL,parts.length)},lane));
  return results;
}

Deno.serve(async req=>{
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token=req.headers.get("x-kc-mirror-token")||"";
  const {data:expected}=await sb.rpc("kc_db_mirror_worker_token");
  if(!expected||!token||!await sicherGleich(String(expected),token))return new Response("auth",{status:401});
  const body=await req.json(),set=String(body.backup_set||"");
  if(!safeUuid(set))return new Response(JSON.stringify({error:"invalid backup_set"}),{status:400,headers:J});
  const {data:conn}=await sb.rpc("kc_db_mirror_neon_connection");
  const neon=postgres(String(conn),{max:1,prepare:false,ssl:{rejectUnauthorized:true}});
  try{
    // Teilpaket-Modus: nur pruefen und Ergebnisse zurueckgeben, nichts schreiben.
    if(Array.isArray(body.part_tables)){
      const {data:key}=await sb.rpc("kc_db_backup_key_v1");
      const checks=await checkTables(neon,String(key),set,body.part_tables.map(String));
      return new Response(JSON.stringify({ok:true,checks}),{headers:J});
    }
    const names=(await neon.unsafe("select table_name from public.kc_backup_snapshots where backup_set=$1::uuid order by table_name",[set])).map((r:any)=>String(r.table_name));
    const parts=splitIntoParts(names,PART_SIZE);
    const checks=mergePartChecks(parts,await runParts(token,set,parts));
    const failed=checks.filter(x=>x.status!=="ok").length;
    const comp=assessBackupCompleteness({snapshotTables:names,...await expectation(sb,set)});
    const bad=failed>0||!comp.complete;
    const completeness={complete:comp.complete,reason:comp.reason,expected_tables:comp.expected,present_tables:comp.present,missing_tables:comp.missing};
    const message=failed?`Backup ${set}: restore-read test failed`:!comp.complete?`Backup ${set}: restore-read test failed (incomplete ${comp.present}/${comp.expected??"?"} tables)`:`Backup ${set}: restore-read test passed`;
    await neon.unsafe("insert into public.kc_backup_verifications(backup_set,status,checked_tables,failed_tables,detail) values ($1::uuid,$2,$3,$4,jsonb_build_object('checks',$5::jsonb,'schema_drift_compatible',true,'stable_hash_compatible',true,'completeness',$6::jsonb,'parts',$7::int))",[set,bad?"error":"ok",checks.length,failed,JSON.stringify(checks),JSON.stringify(completeness),parts.length]);
    await sb.from("kc_db_mirror_runs").insert({run_type:"restore_test",status:bad?"error":"ok",started_at:new Date().toISOString(),finished_at:new Date().toISOString(),source_rows:checks.length,target_rows:checks.length-failed,mismatch_count:failed+(comp.complete?0:Math.max(0,(comp.expected??0)-comp.present)),message,metrics:{backup_set:set,checked_tables:checks.length,failed_tables:failed,...completeness,parts:parts.length,encryption_aware:true,schema_drift_compatible:true,stable_hash_compatible:true,failed_checks:checks.filter(x=>x.status!=="ok")}});
    // KICC-F-103: Aufbewahrungsregel nur nach bestandenem Restore-Test; Fehler hier aendern das Pruefergebnis nicht.
    let retention:any=null;
    if(!bad){
      try{
        retention=(await neon.unsafe("select public.kc_backup_retention_anwenden(true) as r"))[0]?.r??null;
        if(retention?.ausgefuehrt)await sb.from("kc_db_mirror_audit").insert({severity:"info",action:"backup_retention",detail:`Aufbewahrungsregel: ${retention.loeschen} alte Backup-Saetze entfernt, ${retention.behalten} behalten`,metadata:{backup_set:set,...retention}});
      }catch(e){retention={error:String(e).slice(0,200)}}
    }
    return new Response(JSON.stringify({ok:!bad,checked_tables:checks.length,failed_tables:failed,...completeness,retention}),{status:bad?500:200,headers:J});
  }finally{await neon.end({timeout:5})}
});
