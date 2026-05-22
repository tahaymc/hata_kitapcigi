// Admin kullanıcısı kurulum/onarım script'i.
//
// Ne yapar:
//   1. Verilen e-posta için Supabase Auth'ta kullanıcı oluşturur
//      (kullanıcı zaten varsa şifresini günceller).
//   2. 'admins' tablosundaki ilgili satırı bu Auth kullanıcısına bağlar
//      (auth_id), access_role/role = 'admin' yapar. Satır yoksa oluşturur.
//
// Kullanım (proje kök dizininden):
//   node scripts/bootstrap-admin.mjs <email> <password>
//
// Not: SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env dosyasından okunur.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const [, , emailArg, passwordArg] = process.argv;

if (!emailArg || !passwordArg) {
    console.error('Kullanım: node scripts/bootstrap-admin.mjs <email> <password>');
    process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg;

if (password.length < 6) {
    console.error('HATA: Supabase şifresi en az 6 karakter olmalıdır.');
    process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ADMIN_KEY;

if (!url || !serviceKey) {
    console.error('HATA: SUPABASE_URL veya servis anahtarı .env içinde eksik.');
    process.exit(1);
}

const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(targetEmail) {
    let page = 1;
    // Küçük projeler için sayfa sayfa tarama yeterli.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        const found = data.users.find((u) => (u.email || '').toLowerCase() === targetEmail);
        if (found) return found;
        if (data.users.length < 1000) return null;
        page++;
    }
}

(async () => {
    try {
        // 1. Auth kullanıcısı
        let user = await findAuthUserByEmail(email);
        if (user) {
            const { data, error } = await admin.auth.admin.updateUserById(user.id, {
                password,
                email_confirm: true,
            });
            if (error) throw error;
            user = data.user;
            console.log(`Mevcut Auth kullanıcısının şifresi güncellendi: ${email}`);
            console.log(`  auth_id: ${user.id}`);
        } else {
            const { data, error } = await admin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });
            if (error) throw error;
            user = data.user;
            console.log(`Yeni Auth kullanıcısı oluşturuldu: ${email}`);
            console.log(`  auth_id: ${user.id}`);
        }

        // 2. admins tablosu satırı
        const { data: existing, error: selErr } = await admin
            .from('admins')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        if (selErr) throw selErr;

        if (existing) {
            const { error: updErr } = await admin
                .from('admins')
                .update({ auth_id: user.id, access_role: 'admin', role: 'admin' })
                .eq('id', existing.id);
            if (updErr) throw updErr;
            console.log(`admins satırı güncellendi (auth_id bağlandı, access_role=admin). id: ${existing.id}`);
        } else {
            const { error: insErr } = await admin.from('admins').insert([
                {
                    auth_id: user.id,
                    email,
                    name: email.split('@')[0],
                    role: 'admin',
                    access_role: 'admin',
                },
            ]);
            if (insErr) throw insErr;
            console.log('admins satırı oluşturuldu (access_role=admin).');
        }

        console.log('\n✅ Tamam. Artık bu e-posta ve belirlediğiniz şifre ile giriş yapabilirsiniz.');
    } catch (e) {
        console.error('HATA:', e.message);
        process.exit(1);
    }
})();
