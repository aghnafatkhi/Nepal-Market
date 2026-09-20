-- Apply ONCE after the original Nepal Market schema and storage setup.
-- This adds missing features to an existing database without dropping user data.
begin;

alter table public.profiles add column if not exists is_suspended boolean not null default false;
alter table public.profiles add column if not exists suspension_reason text;

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null check (target_type in ('product', 'profile', 'report')),
  target_id uuid not null,
  target_title text,
  reason text not null default '',
  created_at timestamptz not null default now()
);
alter table public.moderation_logs enable row level security;
revoke all on public.moderation_logs from anon, authenticated;
grant select, insert on public.moderation_logs to authenticated;

-- Internal authorization helper; evaluates the caller's own identity, never an input ID.
create schema if not exists nepal_private;
revoke all on schema nepal_private from public;
grant usage on schema nepal_private to authenticated;
create or replace function nepal_private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function nepal_private.is_admin() from public, anon;
grant execute on function nepal_private.is_admin() to authenticated;

drop policy if exists "Nepal admin reads moderation logs" on public.moderation_logs;
create policy "Nepal admin reads moderation logs" on public.moderation_logs
  for select to authenticated using ((select nepal_private.is_admin()));
drop policy if exists "Nepal admin writes moderation logs" on public.moderation_logs;
create policy "Nepal admin writes moderation logs" on public.moderation_logs
  for insert to authenticated
  with check (admin_id = (select auth.uid()) and (select nepal_private.is_admin()));

-- Client role can write only the two suspension fields; trigger rejects self changes.
grant select (is_suspended, suspension_reason) on public.profiles to authenticated;
grant update (is_suspended, suspension_reason) on public.profiles to authenticated;
drop policy if exists "Nepal admin updates profile suspension" on public.profiles;
create policy "Nepal admin updates profile suspension" on public.profiles
  for update to authenticated
  using ((select nepal_private.is_admin()))
  with check ((select nepal_private.is_admin()));

create or replace function nepal_private.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null then
    if new.role is distinct from old.role then
      raise exception 'Role cannot be changed by a client';
    end if;
    if (new.is_suspended is distinct from old.is_suspended
        or new.suspension_reason is distinct from old.suspension_reason)
       and not nepal_private.is_admin() then
      raise exception 'Only an admin can change account suspension';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function nepal_private.guard_profile_changes() from public, anon, authenticated;
drop trigger if exists nepal_guard_profile_changes on public.profiles;
create trigger nepal_guard_profile_changes before update on public.profiles
  for each row execute function nepal_private.guard_profile_changes();

-- A suspended seller cannot publish/edit, or restore a listing hidden by an admin.
create or replace function nepal_private.guard_product_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not nepal_private.is_admin() then
    if exists (select 1 from public.profiles
               where id = (select auth.uid()) and is_suspended) then
      raise exception 'Account is suspended';
    end if;
    if tg_op = 'UPDATE' then
      if old.status in ('hidden', 'removed') and new.status is distinct from old.status then
        raise exception 'Only an admin can restore a moderated listing';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function nepal_private.guard_product_changes() from public, anon, authenticated;
drop trigger if exists nepal_guard_product_changes on public.products;
create trigger nepal_guard_product_changes before insert or update on public.products
  for each row execute function nepal_private.guard_product_changes();

-- Report duplicate checks require the reporter to see their own prior report.
drop policy if exists "Nepal reporter sees own reports" on public.reports;
create policy "Nepal reporter sees own reports" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.reports'::regclass
                   and conname = 'unique_reporter_product') then
    alter table public.reports add constraint unique_reporter_product
      unique (reporter_id, product_id);
  end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Nepal users upload own avatar" on storage.objects;
create policy "Nepal users upload own avatar" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
