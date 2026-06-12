-- =====================================================================
-- Rol modeli: iki seviye (super_admin + admin)
-- ---------------------------------------------------------------------
-- Önceki model: 'admin' (panel yetkili) + 'user' (sadece içerik yazan).
-- Yeni model:
--   - super_admin: Yönetici Paneli, Bot Yönetimi, kullanıcı/departman yönetimi
--                 + içerik CRUD
--   - admin:      yalnızca içerik (hata/kılavuz/kategori/kişi) CRUD
--   - anonim:     salt görüntüleme
--
-- Eşleme:
--   eski 'admin' -> yeni 'super_admin'
--   eski 'user'  -> yeni 'admin'
--
-- Önemli: backend yazma işlemleri service-role client (writeDb) ile yapılır
-- ve RLS'i bypass eder. RLS politikaları doğrudan istemci yazımına karşı
-- savunma katmanıdır. Yine de politikaları yeni rol değerleriyle uyumlu
-- tutmak için aşağıda güncelleniyor.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) admins.access_role ve admins.role değerlerini taşı.
--    Sıra önemli: önce 'admin' -> 'super_admin', sonra 'user' -> 'admin'.
--    Aksi halde önce user->admin yapılırsa, yeni admin'ler de super_admin'e
--    yükseltilir.
-- ---------------------------------------------------------------------
update public.admins set access_role = 'super_admin' where access_role = 'admin';
update public.admins set access_role = 'admin'       where access_role = 'user';

update public.admins set role = 'super_admin' where role = 'admin';
update public.admins set role = 'admin'       where role = 'user';

-- ---------------------------------------------------------------------
-- 2) departments RLS — yazma yalnızca super_admin
-- ---------------------------------------------------------------------
drop policy if exists departments_admin_write on public.departments;
create policy departments_admin_write on public.departments
    for all
    using (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role = 'super_admin'
        )
    )
    with check (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role = 'super_admin'
        )
    );

-- ---------------------------------------------------------------------
-- 3) categories RLS — yazma admin VEYA super_admin
-- ---------------------------------------------------------------------
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
    for all
    using (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role in ('admin', 'super_admin')
        )
    )
    with check (
        exists (
            select 1 from public.admins a
            where a.auth_id = auth.uid() and a.access_role in ('admin', 'super_admin')
        )
    );

commit;

-- ---------------------------------------------------------------------
-- Doğrulama:
--   select access_role, count(*) from public.admins group by access_role;
-- Beklenen değerler: 'super_admin' ve/veya 'admin' (eski 'admin'/'user' yok).
-- ---------------------------------------------------------------------
