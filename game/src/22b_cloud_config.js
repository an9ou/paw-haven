/* ======================= v2.2 CLOUD: Supabase config (CLOUD lane, tag cl) ======================= */
// Public values only. The publishable (anon) key is public by design: row-level security in supabase/schema.sql protects the data.
// Never put the secret / service_role key here.
const CL_CFG = {
  url: 'https://oxdupprqfdihklgwwvol.supabase.co',
  key: 'sb_publishable_pQ0O3jdn7SRMyxmG3UJYeQ_AxBuJRxe',
  lib: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  authKey: 'pawhaven_sb_auth', // where supabase-js keeps the login
  metaKey: 'pawhaven_cloud_v1', // { rev, changedAt, pushedAt, uid, dogId, nudged }: sync bookkeeping, never part of the save itself
  backupKey: 'pawhaven_proto_v1_backup', // local backup before an import or a restore
  pushMs: 2000, // a change reaches the cloud about 2 s after it happens
  pullGapMs: 5000 // focus pulls at most every 5 s
};
