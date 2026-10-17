/* ======================= v2.8.1 CLOUD: Cloudflare Worker config (CLOUD lane, tag cl) ======================= */
// Public values only: the Worker's address. Logins are bearer tokens the Worker hands out (cloudflare/worker.js).
// Never put an API token or any other secret here.
const CL_CFG = {
  api: 'https://pawhaven-api.ansonyuen0108.workers.dev', // the Worker "pawhaven-api" (cloudflare/wrangler.toml)
  authKey: 'pawhaven_cf_auth', // { token }: this device's login
  metaKey: 'pawhaven_cloud_v1', // { rev, changedAt, pushedAt, uid, dogId, nudged }: sync bookkeeping, never part of the save itself
  backupKey: 'pawhaven_proto_v1_backup', // local backup before an import or a restore
  pushMs: 2000, // a change reaches the cloud about 2 s after it happens
  pullGapMs: 5000 // focus pulls at most every 5 s
};
