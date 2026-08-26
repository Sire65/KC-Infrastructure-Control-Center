const PROJECT_BY_TARGET=Object.freeze({
  'db-supabase-core':'ptblnpiroqftcvlsrhac',
  'db-supabase-futura':'iddudrxuihdodnvejxcp'
});
const CORE_PROJECT='ptblnpiroqftcvlsrhac';
const sessions=new Map();
const resolvers=new Map();

function normalizeSession(value){
  if(!value?.accessToken)return null;
  const expiresAt=Number(value.expiresAt||0);
  if(expiresAt&&Date.now()>=expiresAt-30_000)return null;
  return{accessToken:String(value.accessToken),apikey:value.apikey?String(value.apikey):null,expiresAt:expiresAt||null};
}
function projectFor(targetId){return PROJECT_BY_TARGET[targetId]||null;}
function authFromSession(session){if(!session)return null;return{authorization:`Bearer ${session.accessToken}`,...(session.apikey?{apikey:session.apikey}:{})};}

export function setSupabaseSession(projectId,session){const normalized=normalizeSession(session);if(!normalized)throw new Error('Valid short-lived Supabase access token required');sessions.set(String(projectId),normalized);return true;}
export function clearSupabaseSession(projectId=null){if(projectId)sessions.delete(String(projectId));else sessions.clear();}
export function registerSupabaseSessionResolver(projectId,resolver){if(typeof resolver!=='function')throw new TypeError('resolver must be a function');resolvers.set(String(projectId),resolver);}
async function resolveSession(projectId){let current=normalizeSession(sessions.get(projectId));if(current)return current;sessions.delete(projectId);const resolver=resolvers.get(projectId);if(!resolver)return null;current=normalizeSession(await resolver());if(current)sessions.set(projectId,current);return current;}
export async function getSupabaseBridgeAuth(targetId){const projectId=projectFor(targetId);if(!projectId)return null;return authFromSession(await resolveSession(projectId));}
export async function getNeonBridgeAuth(targetId){if(targetId!=='db-neon-core-mirror')return null;return authFromSession(await resolveSession(CORE_PROJECT));}
export async function getMirrorBridgeAuth(flowId){if(flowId!=='flow-supabase-neon-core')return null;return authFromSession(await resolveSession(CORE_PROJECT));}
export function status(){return Object.entries(PROJECT_BY_TARGET).map(([targetId,projectId])=>{const s=normalizeSession(sessions.get(projectId));return{targetId,projectId,state:s?'READY':'AUTH_REQUIRED',expiresAt:s?.expiresAt||null,storage:'MEMORY_ONLY'};});}

// Tokens are intentionally memory-only. No localStorage, IndexedDB, service worker or repository persistence.
globalThis.KICC_AUTH={...(globalThis.KICC_AUTH||{}),setSupabaseSession,clearSupabaseSession,registerSupabaseSessionResolver,getSupabaseBridgeAuth,getNeonBridgeAuth,getMirrorBridgeAuth,status};
