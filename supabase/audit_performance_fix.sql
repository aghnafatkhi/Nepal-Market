-- Safe, idempotent performance hardening for the existing Nepal Market project.
begin;

create index if not exists idx_moderation_logs_admin_id
  on public.moderation_logs(admin_id);
create index if not exists idx_reports_product_id
  on public.reports(product_id);

drop policy if exists "Pengguna hanya boleh mengubah profilnya sendiri" on public.profiles;
drop policy if exists "Nepal admin updates profile suspension" on public.profiles;
create policy "Nepal users and admins update profiles" on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or (select nepal_private.is_admin())
  )
  with check (
    id = (select auth.uid())
    or (select nepal_private.is_admin())
  );

drop policy if exists "Hanya admin yang boleh melihat semua laporan" on public.reports;
drop policy if exists "Nepal reporter sees own reports" on public.reports;
create policy "Nepal reporters and admins read reports" on public.reports
  for select to authenticated
  using (
    reporter_id = (select auth.uid())
    or (select nepal_private.is_admin())
  );

alter policy "Semua orang boleh melihat produk aktif" on public.products
  using (
    status = 'active'
    or seller_id = (select auth.uid())
    or (select nepal_private.is_admin())
  );
alter policy "Seller hanya boleh membuat produk miliknya sendiri" on public.products
  with check ((select auth.uid()) is not null and seller_id = (select auth.uid()));
alter policy "Seller hanya boleh mengubah produknya sendiri" on public.products
  using (seller_id = (select auth.uid()) or (select nepal_private.is_admin()))
  with check (seller_id = (select auth.uid()) or (select nepal_private.is_admin()));
alter policy "Seller hanya boleh menghapus produknya sendiri" on public.products
  using (seller_id = (select auth.uid()) or (select nepal_private.is_admin()));

alter policy "Semua orang boleh melihat gambar produk aktif" on public.product_images
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and (
          p.status = 'active'
          or p.seller_id = (select auth.uid())
          or (select nepal_private.is_admin())
        )
    )
  );
alter policy "Seller boleh menambahkan gambar pada produk miliknya" on public.product_images
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  );
alter policy "Seller boleh mengubah gambar pada produk miliknya" on public.product_images
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  );
alter policy "Seller boleh menghapus gambar pada produk miliknya" on public.product_images
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  );

alter policy "Pengguna hanya boleh melihat favorite miliknya" on public.favorites
  using (user_id = (select auth.uid()));
alter policy "Pengguna hanya boleh menambahkan favorite miliknya" on public.favorites
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
alter policy "Pengguna hanya boleh menghapus favorite miliknya" on public.favorites
  using (user_id = (select auth.uid()));

alter policy "Pengguna login boleh membuat laporan" on public.reports
  with check ((select auth.uid()) is not null and reporter_id = (select auth.uid()));
alter policy "Hanya admin yang boleh melakukan moderasi laporan" on public.reports
  using ((select nepal_private.is_admin()))
  with check ((select nepal_private.is_admin()));

commit;
