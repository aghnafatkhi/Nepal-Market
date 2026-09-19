-- Run after schema.sql. Safe to rerun for the storage bucket; policies are replaced.
-- Keep the browser role unable to set itself as admin.
drop policy if exists "Pengguna boleh membuat profil miliknya sendiri" on public.profiles;
revoke insert, update, select on table public.profiles from anon, authenticated;
grant select (id, name, username, avatar_url, phone, instagram, role, created_at) on table public.profiles to anon, authenticated;
grant update (name, username, avatar_url, phone, instagram) on table public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Seller uploads own product photos" on storage.objects;
create policy "Seller uploads own product photos" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.products p
    where p.id::text = (storage.foldername(name))[2]
      and p.seller_id = (select auth.uid())
      and p.status = 'draft'
  )
);

drop policy if exists "Seller reads own product photos" on storage.objects;
create policy "Seller reads own product photos" on storage.objects
for select to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Seller removes own product photos" on storage.objects;
create policy "Seller removes own product photos" on storage.objects
for delete to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
