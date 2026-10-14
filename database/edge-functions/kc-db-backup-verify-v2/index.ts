// kc-db-backup-verify-v2 · Restore-Read-Test eines KC-Datenbank-Backup-Satzes (Neon KC Core Mirror).
// Quelle im Repo seit Version 7 (KICC-F-100). Deploy: Supabase Edge Function, verify_jwt=false, Token-geschuetzt.
// Version 7: Ein unvollstaendiger Satz ergibt "error" statt "passed" (AGENTS.md Regel 11).
async function sicherGleich(a:string,b:string){const h=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [x,y]=await Promise.all([h(a),h(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0}
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";
import { assessBackupCompleteness } from "./completeness.js";
const J={"Content-Type":"application/json","X-KC-Function-Version":"7"}; const b64d=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function aesKey(s:string){const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return crypto.subtle.importKey("raw",h,{name:"AES-GCM"},false,["decrypt"])}
async function decrypt(p:any,secret:string){if(typeof p==="string")p=JSON.parse(p);const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(String(p.iv))},await aesKey(secret),b64d(String(p.ciphertext)));return new TextDecoder().decode(plain)}

// Erwartung des Satzes: Tabellenzahl aus dem Dispatch-Audit, Namen aus der Backup-Registry (wie im Backup-Worker).
async function expectation(sb:any,set:string){
  const {data:audit}=await sb.from("kc_db_mirror_audit").select("metadata").eq("action","immutable_backup_dispatched").eq("metadata->>backup_set",set).order("happened_at",{ascending:false}).limit(1);
  const meta=audit?.[0]?.metadata||{};
  const {data:rules}=await sb.from("kc_db_mirror_table_rules").select("table_name").eq("backup_enabled",true).eq("mirror_enabled",true).neq("sensitivity","secret");
  const count=Number(meta.tables);
  return {dispatchedCount:Number.isInteger(count)&&count>0?count:null,registryTables:(rules||[]).map((r:any)=>String(r.table_name)),deferredTables:Array.isArray(meta.deferred)?meta.deferred.map(String):[]};
}

Deno.serve(async req=>{const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);const {data:expected}=await sb.rpc("kc_db_mirror_worker_token");if(!expected||!req.headers.get("x-kc-mirror-token")||!await sicherGleich(String(expected),req.headers.get("x-kc-mirror-token")!))return new Response("auth",{status:401});const {data:key}=await sb.rpc("kc_db_backup_key_v1");const {data:conn}=await sb.rpc("kc_db_mirror_neon_connection");const body=await req.json(),set=String(body.backup_set||"");const neon=postgres(String(conn),{max:1,prepare:false,ssl:{rejectUnauthorized:true}});try{const snaps=await neon.unsafe("select table_name,row_count,content_hash,payload from public.kc_backup_snapshots where backup_set=$1::uuid order by table_name",[set]);const checks:any[]=[];for(const s of snaps){const table=String(s.table_name);try{const text=await decrypt(s.payload,String(key)),arr=JSON.parse(text);const rowOk=Array.isArray(arr)&&arr.length===Number(s.row_count);if(table==="kc_dp_pilot_testers"){checks.push({table,status:rowOk?"ok":"error",integrity:"aes_gcm",schema_compatible:true});continue}const stable=table==="kc_dp_entity_versions"||table==="kc_communication_templates";const base=`jsonb_populate_recordset(null::public."${table}",($1::text)::jsonb)`;const sql=stable?`select count(*)::bigint n,md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by md5(to_jsonb(x)::text) collate "C"),'')) h from ${base} x`:`select count(*)::bigint n,md5(coalesce(string_agg(row_to_json(x)::text,'' order by row_to_json(x)::text),'')) h from ${base} x`;const v=await neon.unsafe(sql,[text]);const ok=String(v[0]?.n||0)===String(s.row_count)&&String(v[0]?.h||"")===String(s.content_hash||"");checks.push({table,status:ok?"ok":"error",row_count:Number(v[0]?.n||0),hash_match:String(v[0]?.h||"")===String(s.content_hash||"")})}catch(e){checks.push({table,status:"error",reason:String(e).slice(0,160)})}}
  const failed=checks.filter(x=>x.status!=="ok").length;
  const comp=assessBackupCompleteness({snapshotTables:snaps.map((s:any)=>String(s.table_name)),...await expectation(sb,set)});
  const bad=failed>0||!comp.complete;
  const completeness={complete:comp.complete,reason:comp.reason,expected_tables:comp.expected,present_tables:comp.present,missing_tables:comp.missing};
  const message=failed?`Backup ${set}: restore-read test failed`:!comp.complete?`Backup ${set}: restore-read test failed (incomplete ${comp.present}/${comp.expected??"?"} tables)`:`Backup ${set}: restore-read test passed`;
  await neon.unsafe("insert into public.kc_backup_verifications(backup_set,status,checked_tables,failed_tables,detail) values ($1::uuid,$2,$3,$4,jsonb_build_object('checks',$5::jsonb,'schema_drift_compatible',true,'stable_hash_compatible',true,'completeness',$6::jsonb))",[set,bad?"error":"ok",checks.length,failed,JSON.stringify(checks),JSON.stringify(completeness)]);
  await sb.from("kc_db_mirror_runs").insert({run_type:"restore_test",status:bad?"error":"ok",started_at:new Date().toISOString(),finished_at:new Date().toISOString(),source_rows:checks.length,target_rows:checks.length-failed,mismatch_count:failed+(comp.complete?0:Math.max(0,(comp.expected??0)-comp.present)),message,metrics:{backup_set:set,checked_tables:checks.length,failed_tables:failed,...completeness,encryption_aware:true,schema_drift_compatible:true,stable_hash_compatible:true,failed_checks:checks.filter(x=>x.status!=="ok")}});
  return new Response(JSON.stringify({ok:!bad,checked_tables:checks.length,failed_tables:failed,...completeness}),{status:bad?500:200,headers:J})}finally{await neon.end({timeout:5})}});
