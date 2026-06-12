-- Duyurular (announcements) tablosu
-- ---------------------------------------------------------------------------
-- Supabase > SQL Editor'da bir kez çalıştırın.
-- Okuma anonim (anon) ile yapılır; yazma backend'in service-role'ü ile
-- (writeDb) yapıldığından RLS'i bypass eder. Bu yüzden yalnızca SELECT
-- politikası açılır.

create table if not exists public.announcements (
    id          bigint generated always as identity primary key,
    title       text        not null,
    body        text        not null default '',
    is_urgent   boolean     not null default false,
    created_at  timestamptz not null default now()
);

-- En yeni / acil sorgularını hızlandır
create index if not exists announcements_urgent_created_idx
    on public.announcements (is_urgent desc, created_at desc);

-- RLS: herkes okuyabilir; yazma service-role ile (RLS bypass)
alter table public.announcements enable row level security;

drop policy if exists "announcements_read" on public.announcements;
create policy "announcements_read"
    on public.announcements
    for select
    using (true);
