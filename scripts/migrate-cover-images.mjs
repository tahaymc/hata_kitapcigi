// Mevcut base64 cover image'larını Supabase Storage 'cover-images' bucket'ına
// taşır. Tablolar: errors, guides.
//
// Kullanım:
//   node scripts/migrate-cover-images.mjs              # gerçek migration
//   node scripts/migrate-cover-images.mjs --dry-run    # sadece log, yazma yok
//
// Idempotent:
//   - row.cover_images zaten doluysa o satır atlanır
//   - mevcut http(s) URL'leri olduğu gibi yeni listeye geçer
//   - data URL'leri Buffer'a çevrilip storage'a yüklenir, public URL döner
//
// Yazma (idempotent değil, ilk koşuşta DESTRUCTIVE):
//   - cover_images = yeni URL listesi
//   - imageUrls    = aynı URL listesi (bot çoklu-görsel okumaya devam eder)
//   - imageUrl     = listenin ilki (bot tek-görsel okumaya devam eder)
//
// Önce SQL migration (0003) çalıştırılmış olmalı: cover_images kolonu ve
// cover-images bucket'ı var olmalı.
//
// Service-role anahtarı .env'den okunur, RLS'i bypass eder.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ADMIN_KEY;

if (!url || !serviceKey) {
    console.error('HATA: SUPABASE_URL veya servis anahtarı .env içinde eksik.');
    process.exit(1);
}

const BUCKET = 'cover-images';
const DRY = process.argv.includes('--dry-run');

const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const isUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const isDataUrl = (s) => typeof s === 'string' && s.startsWith('data:');

const parseDataUrl = (du) => {
    const m = du.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (!m) return null;
    return { mime: m[1], base64: m[2].replace(/\s+/g, '') };
};

// imageUrls jsonb/text/text[] olabilir — savunmacı normalize et.
const normalizeArrayLike = (val) => {
    if (Array.isArray(val)) return val.filter(x => typeof x === 'string' && x.length > 0);
    if (typeof val === 'string' && val.length > 0) {
        try {
            const p = JSON.parse(val);
            if (Array.isArray(p)) return p.filter(x => typeof x === 'string' && x.length > 0);
        } catch { /* tek string olabilir */ }
        return [val];
    }
    return [];
};

const extFromMime = (mime) => {
    const tail = (mime.split('/')[1] || 'png').replace(/\+.*$/, '').toLowerCase();
    // SVG, gif, png, jpeg, webp vs.
    if (tail === 'jpeg') return 'jpg';
    return tail;
};

const uploadOne = async (parsed, idHint, idx) => {
    const buf = Buffer.from(parsed.base64, 'base64');
    const ext = extFromMime(parsed.mime);
    const fileName = `${idHint}_${Date.now()}_${idx}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(fileName, buf, {
        contentType: parsed.mime,
        upsert: false
    });
    if (error) throw error;
    const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(fileName);
    return publicUrl;
};

// ---------------------------------------------------------------------
// Migration mantığı
// ---------------------------------------------------------------------
const migrateTable = async (table) => {
    console.log(`\n[${table}] sorgu çekiliyor...`);
    // Supabase'de camelCase kolonlar çift tırnak ister.
    const { data: rows, error } = await db
        .from(table)
        .select('id, "imageUrl", "imageUrls", cover_images');

    if (error) throw new Error(`[${table}] select fail: ${error.message}`);
    console.log(`[${table}] ${rows.length} satır taranıyor`);

    let migrated = 0, skipped = 0, failed = 0;

    for (const row of rows) {
        const rowLabel = `[${table}#${row.id}]`;

        // Zaten cover_images doluysa atla (idempotent).
        if (Array.isArray(row.cover_images) && row.cover_images.length > 0) {
            console.log(`  ${rowLabel} cover_images zaten dolu (${row.cover_images.length}), atlanıyor`);
            skipped++;
            continue;
        }

        // Mevcut kaynaklar: imageUrls önce, yoksa imageUrl tek değer.
        const sources = [
            ...normalizeArrayLike(row.imageUrls),
            ...(row.imageUrl && !normalizeArrayLike(row.imageUrls).includes(row.imageUrl)
                ? [row.imageUrl]
                : [])
        ];

        if (sources.length === 0) {
            console.log(`  ${rowLabel} kaynak görsel yok, atlanıyor`);
            skipped++;
            continue;
        }

        const newUrls = [];
        let rowFailed = false;

        for (let i = 0; i < sources.length; i++) {
            const s = sources[i];
            if (isUrl(s)) {
                newUrls.push(s);
                continue;
            }
            if (!isDataUrl(s)) {
                console.warn(`  ${rowLabel} index ${i}: tanınmayan format, atlanıyor (length=${s?.length})`);
                continue;
            }
            const parsed = parseDataUrl(s);
            if (!parsed) {
                console.warn(`  ${rowLabel} index ${i}: parse fail, atlanıyor`);
                continue;
            }
            if (DRY) {
                newUrls.push(`<DRY:${parsed.mime}:${parsed.base64.length}b>`);
                continue;
            }
            try {
                const publicUrl = await uploadOne(parsed, `${table}_${row.id}`, i);
                newUrls.push(publicUrl);
                console.log(`  ${rowLabel} ${i + 1}/${sources.length} yüklendi`);
            } catch (e) {
                rowFailed = true;
                console.error(`  ${rowLabel} index ${i}: upload fail —`, e.message);
            }
        }

        if (newUrls.length === 0) {
            console.log(`  ${rowLabel} migrate edilecek bir şey yok`);
            skipped++;
            continue;
        }

        if (DRY) {
            console.log(`  ${rowLabel} DRY: ${newUrls.length} URL yazılacak`);
            migrated++;
            continue;
        }

        // Gerçek yazma — imageUrls senkron, imageUrl ilk eleman.
        const payload = {
            cover_images: newUrls,
            imageUrls: newUrls,
            imageUrl: newUrls[0] ?? null
        };
        const { error: updErr } = await db.from(table).update(payload).eq('id', row.id);
        if (updErr) {
            console.error(`  ${rowLabel} update fail:`, updErr.message);
            failed++;
            continue;
        }
        console.log(`  ${rowLabel} ✅ cover_images yazıldı (${newUrls.length} url)`);
        if (rowFailed) {
            console.warn(`  ${rowLabel} not: bazı görsellerde upload hata verdi, satır yarı dolu olabilir`);
        }
        migrated++;
    }

    console.log(`[${table}] migrated=${migrated} skipped=${skipped} failed=${failed}`);
    return { migrated, skipped, failed };
};

// ---------------------------------------------------------------------
// Çalıştır
// ---------------------------------------------------------------------
(async () => {
    if (DRY) {
        console.log('🟡 DRY-RUN modu — hiçbir yazma yapılmayacak');
    } else {
        console.log('🔴 GERÇEK modu — DB ve Storage yazılacak. Devam için bekleniyor 3s...');
        await new Promise(r => setTimeout(r, 3000));
    }

    try {
        const e = await migrateTable('errors');
        const g = await migrateTable('guides');
        const total = {
            migrated: e.migrated + g.migrated,
            skipped: e.skipped + g.skipped,
            failed: e.failed + g.failed
        };
        console.log(`\n✅ Toplam: migrated=${total.migrated} skipped=${total.skipped} failed=${total.failed}`);
        process.exit(0);
    } catch (e) {
        console.error('HATA:', e.message);
        process.exit(1);
    }
})();
