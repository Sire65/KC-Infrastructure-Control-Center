const ENDPOINTS=Object.freeze({
  'db-neon-core-mirror':'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kicc-neon-telemetry'
});

globalThis.KICC_BRIDGE_ENDPOINTS={
  ...(globalThis.KICC_BRIDGE_ENDPOINTS||{}),
  ...ENDPOINTS
};

export const NEON_RUNTIME_ENDPOINTS=ENDPOINTS;
