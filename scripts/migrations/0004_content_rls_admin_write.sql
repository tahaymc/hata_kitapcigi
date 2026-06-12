-- =====================================================================
-- İçerik tabloları için RLS — yazma yalnızca admin/super_admin
-- ---------------------------------------------------------------------
-- 0001 yalnız departments + categories tablolarına RLS koymuştu; içerik
-- tabloları (errors, guides, people ve assignee join tabloları) RLS'siz
-- kalmıştı. RLS kapalı/permissive iken, geçerli bir Supabase oturumu olan
-- HERHANGİ bir kullanıcı (rolü ne olursa olsun) anon key ile doğrudan
-- istemciden yazma yapabilir — API'deki verifyAdmin kontrolünü bypass ederek.
-- Bu migration o açığı kapatır.
--
-- Model (frontend-renovation-auth-rule ile uyumlu):
--   - SELECT  : herkese açık (anonim ziyaretçi salt görüntüleme).
--   - INSERT/UPDATE/DELETE : yalnız admins.access_role in ('admin','super_admin').
--
-- NOT: Backend writeDb() service-role ile yazar ve RLS'i bypass eder; meşru
-- yazmalar bundan etkilenmez. Bu politikalar DOĞRUDAN istemci yazımına karşı
-- savunma katmanıdır (defense-in-depth). Pattern 0002/0003 ile aynıdır.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Yardımcı koşul (her politikada tekrar): istek sahibi admin mi?
--   exists (select 1 from public.admins a
--           where a.auth_id = auth.uid()
--             and a.access_role in ('admin','super_admin'))
-- ---------------------------------------------------------------------

-- ===================== errors =====================
alter table public.errors enable row level security;

drop policy if exists errors_select_all  on public.errors;
create policy errors_select_all on public.errors
    for select to public
    using (true);

drop policy if exists errors_admin_write on public.errors;
create policy errors_admin_write on public.errors
    for all to authenticated
    using (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    )
    with check (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    );

-- ===================== guides =====================
alter table public.guides enable row level security;

drop policy if exists guides_select_all  on public.guides;
create policy guides_select_all on public.guides
    for select to public
    using (true);

drop policy if exists guides_admin_write on public.guides;
create policy guides_admin_write on public.guides
    for all to authenticated
    using (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    )
    with check (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    );

-- ===================== people =====================
alter table public.people enable row level security;

drop policy if exists people_select_all  on public.people;
create policy people_select_all on public.people
    for select to public
    using (true);

drop policy if exists people_admin_write on public.people;
create policy people_admin_write on public.people
    for all to authenticated
    using (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    )
    with check (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    );

-- ===================== error_assignees (join) =====================
alter table public.error_assignees enable row level security;

drop policy if exists error_assignees_select_all  on public.error_assignees;
create policy error_assignees_select_all on public.error_assignees
    for select to public
    using (true);

drop policy if exists error_assignees_admin_write on public.error_assignees;
create policy error_assignees_admin_write on public.error_assignees
    for all to authenticated
    using (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    )
    with check (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    );

-- ===================== guide_assignees (join) =====================
alter table public.guide_assignees enable row level security;

drop policy if exists guide_assignees_select_all  on public.guide_assignees;
create policy guide_assignees_select_all on public.guide_assignees
    for select to public
    using (true);

drop policy if exists guide_assignees_admin_write on public.guide_assignees;
create policy guide_assignees_admin_write on public.guide_assignees
    for all to authenticated
    using (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    )
    with check (
        exists (select 1 from public.admins a
                where a.auth_id = auth.uid()
                  and a.access_role in ('admin', 'super_admin'))
    );

commit;

-- ---------------------------------------------------------------------
-- Doğrulama:
--   select tablename, rowsecurity from pg_tables
--     where schemaname='public'
--       and tablename in ('errors','guides','people','error_assignees','guide_assignees');
--   -- rowsecurity = true bekleniyor.
--
--   select tablename, policyname, cmd from pg_policies
--     where schemaname='public'
--       and tablename in ('errors','guides','people','error_assignees','guide_assignees')
--     order by tablename, policyname;
--   -- Her tablo için *_select_all (SELECT) + *_admin_write (ALL) bekleniyor.
--
-- Manuel test (admin OLMAYAN bir oturumun anon key'i ile):
--   insert into public.errors (title) values ('x');  -- RLS ihlali (0 satır / hata) beklenir.
-- ---------------------------------------------------------------------
