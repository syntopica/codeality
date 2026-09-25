create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  email text unique,
  status text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, status)
);
create index orders_created_at_idx on public.orders (created_at desc);
create unique index if not exists orders_status_lower on public.orders (lower(status));
create table public.notes (id bigint generated always as identity, body text, primary key (id));
alter table public.notes add constraint notes_body_key unique (body);
create index concurrently notes_body_trgm on public.notes using gin (body gin_trgm_ops);
create table "public"."Quoted" ("Id" int primary key, "ownerId" uuid);
create index on public."Quoted" ("ownerId");
