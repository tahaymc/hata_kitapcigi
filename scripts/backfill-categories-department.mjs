// Backfill: department_id'si boş olan tüm kategorileri varsayılan
// "Bilgi İşlem" departmanına bağlar.
//
// Ön koşul: 0001_departments_categories_two_layer.sql migration'ı çalıştırılmış
// olmalı (categories.department_id kolonu mevcut olmalı).
//
// Kullanım (proje kök dizininden):
//   node scripts/backfill-categories-department.mjs
//
// Service-role anahtarı kullanır (RLS'i bypass eder). SUPABASE_URL ve servis
// anahtarı .env'den okunur.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_DEPT_NAME = 'Bilgi İşlem';

const url = process.env.SUPABASE_URL;
const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ADMIN_KEY;

if (!url || !serviceKey) {
    console.error('HATA: SUPABASE_URL veya servis anahtarı .env içinde eksik.');
    process.exit(1);
}

const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

(async () => {
    try {
        // 1) Varsayılan departmanı bul (önce isimle, sonra id=1).
        let { data: dept, error: deptErr } = await db
            .from('departments')
            .select('id, name')
            .eq('name', DEFAULT_DEPT_NAME)
            .maybeSingle();
        if (deptErr) throw deptErr;

        if (!dept) {
            const byId = await db
                .from('departments')
                .select('id, name')
                .eq('id', 1)
                .maybeSingle();
            if (byId.error) throw byId.error;
            dept = byId.data;
        }

        // 2) Hiç yoksa oluştur (güvenlik için; normalde id=1 zaten var).
        if (!dept) {
            const created = await db
                .from('departments')
                .insert([{ name: DEFAULT_DEPT_NAME, color: 'blue', icon: 'monitor', sort_order: 0 }])
                .select('id, name')
                .single();
            if (created.error) throw created.error;
            dept = created.data;
            console.log(`Varsayılan departman oluşturuldu: ${dept.name} (id=${dept.id})`);
        } else {
            console.log(`Varsayılan departman bulundu: ${dept.name} (id=${dept.id})`);
        }

        // 3) department_id'si boş kategorileri bağla.
        const { data: orphans, error: orphErr } = await db
            .from('categories')
            .select('id, name')
            .is('department_id', null);
        if (orphErr) throw orphErr;

        if (!orphans || orphans.length === 0) {
            console.log('Bağlanacak (department_id boş) kategori yok. İşlem tamam.');
            process.exit(0);
        }

        const { error: updErr } = await db
            .from('categories')
            .update({ department_id: dept.id })
            .is('department_id', null);
        if (updErr) throw updErr;

        console.log(`${orphans.length} kategori "${dept.name}" departmanına bağlandı:`);
        orphans.forEach((c) => console.log(`  - ${c.id} (${c.name})`));
        console.log('\n✅ Backfill tamamlandı.');
        process.exit(0);
    } catch (e) {
        console.error('HATA:', e.message);
        process.exit(1);
    }
})();
