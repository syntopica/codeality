create or replace function public.safe() returns void language plpgsql security definer set search_path = public as $$ begin end $$;
create function public.unsafe() returns void language plpgsql security definer as $$ begin end $$;
create or replace function public.invoker() returns void language sql as $$ select 1 $$;
