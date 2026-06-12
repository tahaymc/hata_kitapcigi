-- Duyurulara departman bağlantısı ekle
-- ---------------------------------------------------------------------------
-- Supabase > SQL Editor'da bir kez çalıştırın.
-- department_id, departments.id'ye işaret eder (departman silinirse NULL olur).

alter table public.announcements
    add column if not exists department_id bigint references public.departments(id) on delete set null;

create index if not exists announcements_department_idx
    on public.announcements (department_id);
