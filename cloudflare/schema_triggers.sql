-- D1 triggers, applied by tools/cf_api_deploy.sh AFTER schema.sql and its added columns (a trigger that names a column the table does not
-- have yet would make every delete on that table fail), and by cloudflare/d1_node.js in the tests. Each statement is sent on its own
-- (split on the "-- statement" lines), so a trigger body's semicolons never meet a statement splitter. Safe to repeat: drop, then create.
--
-- Refund protection (owner, 14 Nov 2026; V224.md 4.4). Accounts are deleted by hand in D1 (there is no delete route), so this trigger is
-- "the moment": a deleted account that the auto rule pauses right then (2 full refunds or 1 dispute, the Worker's SHOP_PAUSE_REFUNDS and
-- SHOP_PAUSE_DISPUTES; no 'allow' for its user id, email or hash) leaves one shop_flags row: 'h:' + its users.shop_hash, mode 'block'.
-- Nothing else is kept: no plain email, no user id. Guests (no email, no shop_hash) keep nothing. Its purchases go later with tidy().
-- statement
drop trigger if exists users_shop_keep;
-- statement
create trigger users_shop_keep before delete on users for each row
when old.shop_hash is not null
  and ((select count(refunded_at) from purchases where user_id = old.id) >= 2 or (select count(disputed_at) from purchases where user_id = old.id) >= 1)
  and not exists (select 1 from shop_flags where mode = 'allow' and key in ('u:' || old.id, 'e:' || old.email, 'h:' || old.shop_hash))
begin
  insert or ignore into shop_flags (key, mode, note, created_at)
    values ('h:' || old.shop_hash, 'block', 'auto: deleted while paused', cast((julianday('now') - 2440587.5) * 86400000 as integer));
end;
