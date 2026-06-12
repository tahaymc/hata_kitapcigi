-- =====================================================================
-- Cover image'larını base64'ten Supabase Storage'a taşıma (Faz D)
-- ---------------------------------------------------------------------
-- 1) errors ve guides tablolarına cover_images (text[]) kolonu ekler.
-- 2) cover-images public bucket'ını oluşturur.
-- 3) step-photos bucket'ını da (Faz C'de oluşturuldu) idempotent garanti eder
--    + RLS politikalarını yazar — Faz C'de unutulmuştu.
-- 4) Storage RLS: SELECT herkese açık; INSERT/UPDATE/DELETE yalnız
--    admins.access_role in ('admin', 'super_admin') olan auth_id için.
--
-- NOT: Backend writeDb() service-role ile yazar ve RLS'i bypass eder.
-- Bu politikalar doğrudan istemci yazımına karşı savunma katmanıdır.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) cover_images kolonu (URL listesi)
-- ---------------------------------------------------------------------
alter table public.errors
    add column if not exists cover_images text[] not null default '{}'::text[];

alter table public.guides
    add column if not exists cover_images text[] not null default '{}'::text[];

-- ---------------------------------------------------------------------
-- 2) Bucket'lar (public read; yazma RLS ile kısıtlı)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('cover-images', 'cover-images', true, 10 * 1024 * 1024)
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('step-photos', 'step-photos', true, 10 * 1024 * 1024)
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit;

-- ---------------------------------------------------------------------
-- 3) RLS — cover-images
-- ---------------------------------------------------------------------
drop policy if exists "cover-images public read"  on storage.objects;
create policy "cover-images public read"
on storage.objects for select to public
using (bucket_id = 'cover-images');

drop policy if exists "cover-images admin write" on storage.objects;
create policy "cover-images admin write"
on storage.objects for all to authenticated
using (
    bucket_id = 'cover-images'
    and exists (
        select 1 from public.admins a
        where a.auth_id = auth.uid()
          and a.access_role in ('admin', 'super_admin')
    )
)
with check (
    bucket_id = 'cover-images'
    and exists (
        select 1 from public.admins a
        where a.auth_id = auth.uid()
          and a.access_role in ('admin', 'super_admin')
    )
);

-- ---------------------------------------------------------------------
-- 4) RLS — step-photos (Faz C ek)
-- ---------------------------------------------------------------------
drop policy if exists "step-photos public read"  on storage.objects;
create policy "step-photos public read"
on storage.objects for select to public
using (bucket_id = 'step-photos');

drop policy if exists "step-photos admin write" on storage.objects;
create policy "step-photos admin write"
on storage.objects for all to authenticated
using (
    bucket_id = 'step-photos'
    and exists (
        select 1 from public.admins a
        where a.auth_id = auth.uid()
          and a.access_role in ('admin', 'super_admin')
    )
)
with check (
    bucket_id = 'step-photos'
    and exists (
        select 1 from public.admins a
        where a.auth_id = auth.uid()
          and a.access_role in ('admin', 'super_admin')
    )
);

commit;

-- ---------------------------------------------------------------------
-- Doğrulama:
--   select column_name from information_schema.columns
--     where table_name in ('errors','guides') and column_name='cover_images';
--   select id, public, file_size_limit from storage.buckets
--     where id in ('cover-images','step-photos');
--   select policyname from pg_policies where tablename='objects' and schemaname='storage';
-- ---------------------------------------------------------------------
