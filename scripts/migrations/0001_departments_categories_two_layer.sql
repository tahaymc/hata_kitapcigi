-- =====================================================================
-- İki katmanlı yapı: DEPARTMAN (ana) > KATEGORİ (alt)
-- ---------------------------------------------------------------------
-- Renk YALNIZCA departmanda tutulur; alt kategorinin rengi UI'da
-- kullanılmaz. Bir departmanın altındaki tüm kayıtlar departman rengini
-- kullanır. categories.color geriye dönük uyumluluk için BIRAKILIR.
--
-- NOT: 'departments' tablosu zaten INTEGER birincil anahtarla mevcuttur
-- ve people/errors/guides ona integer department_id ile bağlıdır. Bu
-- yüzden uuid'ye geçilmez; mevcut tablo non-destructive şekilde
-- genişletilir (yalnızca sort_order eklenir; icon/color zaten vardır).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) departments: eksik kolonları ekle (id/name/color/icon/created_at var)
-- ---------------------------------------------------------------------
alter table public.departments
    add column if not exists sort_order integer not null default 0;

-- Mevcut departmanlara id sırasına göre başlangıç sırası ver
-- (yalnızca tümü hâlâ 0 ise; tekrar çalıştırmaya karşı güvenli).
update public.departments d
set sort_order = sub.rn
from (
    select id, (row_number() over (order by id) - 1) as rn
    from public.departments
) sub
where d.id = sub.id
  and not exists (select 1 from public.departments where sort_order <> 0);

-- ---------------------------------------------------------------------
-- 2) categories: department_id (alt kategori -> ana departman)
--    Bir departman silinirse alt kategoriler silinmez, bağı kopar.
-- ---------------------------------------------------------------------
alter table public.categories
    add column if not exists department_id integer
    references public.departments(id) on delete set null;

create index if not exists idx_categories_department_id
    on public.categories(department_id);

-- ---------------------------------------------------------------------
-- 3) RLS — SELECT herkese açık; INSERT/UPDATE/DELETE yalnızca
--    admins tablosunda access_role='admin' olan auth_id için.
--    (Backend service-role ile yazar ve RLS'i bypass eder; bu politikalar
--     doğrudan istemci erişimine karşı güvenlik katmanıdır.)
-- ---------------------------------------------------------------------
alter table public.departments enable row level security;
alter table public.categories  enable row level security;

-- departments --------------------------------------------------------
drop policy if exists departments_select_all  on public.departments;
create policy departments_select_all on public.departments
    for select
    using (true);

drop policy if exists departments_admin_write on public.departments;
create policy departments_admin_write on public.departments
    for all
    using (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role = 'admin'
        )
    );

-- categories ---------------------------------------------------------
drop policy if exists categories_select_all  on public.categories;
create policy categories_select_all on public.categories
    for select
    using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
    for all
    using (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role = 'admin'
        )
    );

commit;

-- ---------------------------------------------------------------------
-- Backfill (mevcut kategorileri "Bilgi İşlem" departmanına bağlama) AYRI
-- script ile yapılır: node scripts/backfill-categories-department.mjs
-- (Script service-role kullanır, RLS'i bypass eder.)
-- ---------------------------------------------------------------------
