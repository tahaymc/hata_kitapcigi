-- =====================================================================
-- bot_settings: singleton ayar satırı (id=1).
-- =====================================================================
create table if not exists public.bot_settings (
    id integer primary key default 1 check (id = 1),
    enabled boolean not null default true,
    listen_groups boolean not null default false,
    ocr_languages text not null default 'eng+tur',
    confidence_threshold integer not null default 40,
    match_score_threshold integer not null default 30,
    reply_with_steps boolean not null default true,
    reply_with_images boolean not null default true,
    reply_with_video boolean not null default true,
    fallback_message text not null default '❓ Gönderdiğiniz ekran görüntüsündeki hatayı veritabanımda bulamadım.

Daha net bir fotoğraf göndermeyi deneyin veya ilgili departmana başvurun.',
    error_message text not null default '⚠️ Görselinizi işlerken teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
    disabled_message text not null default '🤖 Bot şu anda devre dışı.',
    allowlist text[] not null default array[]::text[],
    blocklist text[] not null default array[]::text[],
    updated_at timestamptz not null default now()
);

-- Singleton satırı insert'le (zaten varsa pas geç)
insert into public.bot_settings (id) values (1)
on conflict (id) do nothing;

-- =====================================================================
-- bot_status: bot'un en son heartbeat'i (singleton).
-- =====================================================================
create table if not exists public.bot_status (
    id integer primary key default 1 check (id = 1),
    status text not null default 'unknown',
    started_at timestamptz,
    connected_at timestamptz,
    jid text,
    disconnect_reason integer,
    last_error text,
    stats jsonb not null default '{}'::jsonb,
    last_heartbeat_at timestamptz not null default now()
);

insert into public.bot_status (id) values (1)
on conflict (id) do nothing;

-- =====================================================================
-- RLS — site backend service role ile yazıyor, admin kontrolü API tarafında.
-- =====================================================================
alter table public.bot_settings enable row level security;
alter table public.bot_status enable row level security;

-- Service role her şeyi yapabilir (zaten RLS bypass eder, ama explicit policy de bırakalım)
-- Anon kullanıcı için: hiçbir erişim yok. Sadece API üzerinden okunabilir.
