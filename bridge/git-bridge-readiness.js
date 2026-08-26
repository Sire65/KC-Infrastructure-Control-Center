import { validateGithubProviderConfig } from './github-provider-adapter-contract.js';

export const BRIDGE_READINESS_STEPS=Object.freeze([
  'HTTPS_ENDPOINT',
  'AUTHENTICATION',
  'CAPABILITY_MAPPING',
  'PROVIDER_CONFIG',
  'REPOSITORY_ALLOWLIST',
  'REPLAY_PROTECTION',
  'RATE_SIZE_LIMITS',
  'AUDIT_PERSISTENCE',
  'RECOVERY_ROLLBACK_TEST',
  'REGRESSION_TEST',
  'EXPLICIT_ACTIVATION_APPROVAL'
]);

export function evaluateGitBridgeReadiness(input={}){
  const checks={
    HTTPS_ENDPOINT:Boolean(input.httpsEndpoint),
    AUTHENTICATION:Boolean(input.authenticationVerified),
    CAPABILITY_MAPPING:Boolean(input.capabilityMappingVerified),
    PROVIDER_CONFIG:validateGithubProviderConfig(input.providerConfig||{}).ok,
    REPOSITORY_ALLOWLIST:Boolean(input.repositoryAllowlistVerified),
    REPLAY_PROTECTION:Boolean(input.replayProtectionVerified),
    RATE_SIZE_LIMITS:Boolean(input.rateSizeLimitsVerified),
    AUDIT_PERSISTENCE:Boolean(input.auditPersistenceVerified),
    RECOVERY_ROLLBACK_TEST:Boolean(input.recoveryRollbackTestPassed),
    REGRESSION_TEST:Boolean(input.regressionTestPassed),
    EXPLICIT_ACTIVATION_APPROVAL:Boolean(input.activationApproved)
  };
  const pending=BRIDGE_READINESS_STEPS.filter(step=>checks[step]!==true);
  return {
    status:pending.length?'PREPARED':'READY_FOR_ACTIVATION',
    ready:pending.length===0,
    checks,
    pending
  };
}
