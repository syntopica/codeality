create table public.with_policy (id int);
alter table public.with_policy enable row level security;
create policy "p" on public.with_policy for select using ((select auth.uid()) = id);
create table if not exists public.service_only (id int);
alter table public.service_only enable row level security;
create table "public"."Naked" (id int);
create table private.internal (id int);
