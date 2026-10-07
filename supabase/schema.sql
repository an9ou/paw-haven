-- Paw Haven cloud save (v2.2). Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run again: every statement checks before it creates.
-- Guests (anonymous sign-ins) and email players are both in the "authenticated" role,
-- so the same rules cover both. Each player can only see and change their own rows.

-- 1. One save per player
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,                -- exactly what the game keeps in localStorage
  rev        bigint      not null default 1,      -- goes up by 1 on every push
  changed_at timestamptz not null default now(),  -- time of the newest change in the game (the newer save wins)
  device     text,                                -- e.g. "iPhone Safari", shown in Settings
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.saves add constraint saves_size check (pg_column_size(data) < 524288); -- 512 KB is plenty (a big family is about 160 KB)
exception when duplicate_object then null; end $$;

alter table public.saves enable row level security;

drop policy if exists "saves: read own"   on public.saves;
drop policy if exists "saves: insert own" on public.saves;
drop policy if exists "saves: update own" on public.saves;
create policy "saves: read own"   on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: insert own" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: update own" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.saves_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before update on public.saves for each row execute function public.saves_touch();

-- 2. Backups: the save that lost (older than another device, a guest save before sign-in, before an import)
create table if not exists public.save_backups (
  id         bigserial   primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  data       jsonb       not null,
  reason     text,
  created_at timestamptz not null default now()
);
create index if not exists save_backups_user_time on public.save_backups (user_id, created_at desc);

alter table public.save_backups enable row level security;

drop policy if exists "backups: read own"   on public.save_backups;
drop policy if exists "backups: insert own" on public.save_backups;
drop policy if exists "backups: delete own" on public.save_backups;
create policy "backups: read own"   on public.save_backups for select to authenticated using ((select auth.uid()) = user_id);
create policy "backups: insert own" on public.save_backups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "backups: delete own" on public.save_backups for delete to authenticated using ((select auth.uid()) = user_id);

-- keep only the newest 5 backups per player
create or replace function public.save_backups_trim() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.save_backups b
  where b.user_id = new.user_id
    and b.id not in (select id from public.save_backups where user_id = new.user_id order by created_at desc, id desc limit 5);
  return null;
end $$;
drop trigger if exists save_backups_trim on public.save_backups;
create trigger save_backups_trim after insert on public.save_backups for each row execute function public.save_backups_trim();
-- Trigger-only: nobody may call it through the API (Supabase advisor 0028/0029). The trigger still fires.
revoke execute on function public.save_backups_trim() from public, anon, authenticated;

-- 3. Real time: other devices hear about a new save straight away
do $$ begin
  alter publication supabase_realtime add table public.saves;
exception when duplicate_object then null; end $$;

-- 4. Optional, off by default: weekly clean-up of guest accounts that never added an email and were unused for 90 days.
-- To turn on: Database -> Extensions -> enable pg_cron, then run the lines below without the leading "-- ".
-- select cron.schedule('paw-haven-guest-cleanup', '0 4 * * 0', $cron$
--   delete from auth.users where is_anonymous and coalesce(last_sign_in_at, created_at) < now() - interval '90 days'
-- $cron$);
