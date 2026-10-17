-- Doodle Doggo cloud save on Cloudflare D1 (v2.8.1). Database "pawhaven", used by the Worker "pawhaven-api" (cloudflare/worker.js).
--   npx wrangler d1 execute pawhaven --remote --file cloudflare/schema.sql
-- Safe to run again: every statement checks before it creates. 

-- Players. A guest has no email and no password. "Make an account" adds both to the same row.
create table if not exists users (
  id         text primary key,
  email      text unique,              -- lower case; null for guests
  pw_hash    text,                     -- PBKDF2-SHA256, 100k iterations, hex; null for guests
  pw_salt    text,                     -- 16 random bytes, hex
  created_at integer not null,         -- ms
  guest      integer not null default 0,
  migrated   integer not null default 0 -- 1: moved over from Supabase (v2.8.1-v2.9; unused since v2.9.1)
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


-- v2.9.1: Supabase is gone and its accounts with it, so the one-email-one-account list from v2.8.2 is dropped (an old email can sign up).
drop table if exists legacy;

-- Forgot password (v2.8.2): one row per emailed link. Only the SHA-256 of the 32-byte token is kept. 30 minutes, single use.
create table if not exists resets (
  token_hash text primary key,
  user_id    text not null,
  created_at integer not null,
  expires_at integer not null,
  used       integer not null default 0
);
create index if not exists resets_user on resets (user_id);
