-- Doodle Doggo cloud save on Cloudflare D1 (v2.8.1). Database "pawhaven", used by the Worker "pawhaven-api" (cloudflare/worker.js).
--   npx wrangler d1 execute pawhaven --remote --file cloudflare/schema.sql
-- Safe to run again: every statement checks before it creates. Same save fields as supabase/schema.sql.

-- Players. A guest has no email and no password. "Make an account" adds both to the same row.
-- Players moved from Supabase keep their Supabase user id, so a device's save stays theirs.
create table if not exists users (
  id         text primary key,
  email      text unique,              -- lower case; null for guests
  pw_hash    text,                     -- PBKDF2-SHA256, 100k iterations, hex; null for guests and for a carried-over login not yet typed
  pw_salt    text,                     -- 16 random bytes, hex
  created_at integer not null,         -- ms
  guest      integer not null default 0,
  migrated   integer not null default 0 -- 1: moved over from Supabase
);

-- Logins. Only the SHA-256 of the 32-byte bearer token is kept.
create table if not exists sessions (
  token_hash text primary key,
  user_id    text not null,
  created_at integer not null,
  last_seen  integer not null
);
create index if not exists sessions_user on sessions (user_id);

-- One save per player: exactly what the game keeps in localStorage.
create table if not exists saves (
  user_id    text primary key,
  data       text not null,            -- JSON, under 512 KB
  rev        integer not null default 1,
  changed_at text not null,            -- ISO time of the newest change in the game (the newer save wins)
  device     text,
  updated_at text not null
);

-- The save that lost (older than another device, a guest save before sign-in, before an import). The newest 5 are kept.
create table if not exists save_backups (
  id         integer primary key autoincrement,
  user_id    text not null,
  data       text not null,
  reason     text,
  created_at text not null
);
create index if not exists save_backups_user_time on save_backups (user_id, created_at desc);

-- Rate limits: one counter per key and time window.
create table if not exists rate (
  k        text primary key,
  n        integer not null,
  reset_at integer not null
);


-- SHA-256 of the lower-cased email of each Supabase account (v2.8.2, owner's choice: one email = one account). No emails, no
-- passwords. "Make an account" with one of them is refused until that account logs in once, which moves it over and drops the row.
-- The list is final: no Supabase accounts are made since v2.8.1.
create table if not exists legacy (
  email_hash text primary key
);

-- Forgot password (v2.8.2): one row per emailed link. Only the SHA-256 of the 32-byte token is kept. 30 minutes, single use.
create table if not exists resets (
  token_hash text primary key,
  user_id    text not null,
  created_at integer not null,
  expires_at integer not null,
  used       integer not null default 0
);
create index if not exists resets_user on resets (user_id);
