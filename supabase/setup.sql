-- ============================================================
-- Birthday Wishlist: database setup
-- Paste this whole file into Supabase > SQL Editor and click Run.
-- It is safe to run more than once.
-- ============================================================

-- 1. The gifts table --------------------------------------------------
create table if not exists public.items (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 120),
  image_url        text check (image_url is null or char_length(image_url) <= 1000),
  price            text check (price is null or char_length(price) <= 40),
  link             text check (link is null or char_length(link) <= 2000),
  position         integer not null default 0,
  claimed_by_name  text check (claimed_by_name is null or char_length(claimed_by_name) <= 60),
  claim_token_hash text,
  claimed_at       timestamptz,
  is_claimed       boolean generated always as (claimed_at is not null) stored,
  created_at       timestamptz not null default now()
);

create index if not exists items_position_idx on public.items (position);

-- 2. Row Level Security: lock the table down -------------------------
alter table public.items enable row level security;

-- Guests (the "anon" role) may READ rows...
drop policy if exists "Guests can read items" on public.items;
create policy "Guests can read items"
  on public.items for select
  to anon
  using (true);

-- ...but only the SAFE columns. The claimer's name and secret token
-- are never readable by guests, even if someone pokes at the API.
revoke all on public.items from anon, authenticated;
grant select (id, name, image_url, price, link, position, is_claimed)
  on public.items to anon;

-- The server (secret key = service_role) gets full access.
grant select, insert, update, delete on public.items to service_role;

-- No insert / update / delete policies exist for guests, so they can never
-- change anything. Only the server (using the secret key) can.

-- 3. Claim: one single atomic update ----------------------------------
-- The "where claimed_at is null" part means: only works if still free.
-- If two people tap at the same moment, Postgres lets exactly one win.
create or replace function public.claim_item(
  p_item_id uuid,
  p_name text,
  p_token_hash text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if p_name is null or char_length(btrim(p_name)) = 0 or char_length(btrim(p_name)) > 60 then
    raise exception 'invalid name';
  end if;
  if p_token_hash is null or char_length(p_token_hash) < 32 then
    raise exception 'invalid token';
  end if;

  update public.items
     set claimed_by_name  = btrim(p_name),
         claim_token_hash = p_token_hash,
         claimed_at       = now()
   where id = p_item_id
     and claimed_at is null;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

-- 4. Unclaim: only works with the matching secret token ---------------
create or replace function public.unclaim_item(
  p_item_id uuid,
  p_token_hash text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.items
     set claimed_by_name  = null,
         claim_token_hash = null,
         claimed_at       = null
   where id = p_item_id
     and claim_token_hash is not null
     and claim_token_hash = p_token_hash;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

-- Only the server (service_role / secret key) may call these functions.
revoke all on function public.claim_item(uuid, text, text) from public, anon, authenticated;
revoke all on function public.unclaim_item(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_item(uuid, text, text) to service_role;
grant execute on function public.unclaim_item(uuid, text) to service_role;

-- 5. Picture storage --------------------------------------------------
-- A public bucket: anyone can VIEW pictures by their link, but with no
-- upload policies only the server can add or delete pictures.
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = true;
