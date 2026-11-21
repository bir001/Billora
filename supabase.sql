-- Billora: Supabase SQL Editor me poora paste karke Run karo (ek hi baar)
create table if not exists public.profiles(
  id uuid primary key references auth.users on delete cascade,
  business_id uuid not null, name text, role text not null default 'pending', created_at timestamptz default now());
create table if not exists public.records(
  business_id uuid not null, kind text not null, id text not null, data jsonb, deleted boolean not null default false,
  updated_at timestamptz not null default now(), primary key(business_id,kind,id));
create index if not exists records_sync on public.records(business_id,updated_at);
create or replace function public.touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records for each row execute function public.touch_updated();
create or replace function public.my_biz() returns uuid language sql security definer set search_path=public stable as $$
  select business_id from public.profiles where id=auth.uid() and role<>'pending' $$;
create or replace function public.my_role() returns text language sql security definer set search_path=public stable as $$
  select role from public.profiles where id=auth.uid() $$;
alter table public.profiles enable row level security;
alter table public.records enable row level security;
create policy p_sel on public.profiles for select using (id=auth.uid() or business_id=public.my_biz());
create policy p_ins on public.profiles for insert with check (id=auth.uid() and ((role='owner' and business_id=auth.uid()) or role='pending'));
create policy p_upd on public.profiles for update using (business_id=public.my_biz() and public.my_role()='owner' and id<>auth.uid());
create policy r_sel on public.records for select using (business_id=public.my_biz());
create policy r_ins on public.records for insert with check (business_id=public.my_biz());
create policy r_upd on public.records for update using (business_id=public.my_biz()) with check (business_id=public.my_biz());
alter publication supabase_realtime add table public.records;
