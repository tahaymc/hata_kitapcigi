import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_DATA } from './defaultData.js';

const seed = async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ HATA: .env dosyasında SUPABASE_URL veya SUPABASE_KEY eksik.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('🔌 Supabase bağlantısı kuruldu...');

    // 1. Kategorileri Ekle
    console.log('📦 Kategoriler kontrol ediliyor...');
    const { count: catCount, error: catErr } = await supabase.from('categories').select('*', { count: 'exact', head: true });

    if (catErr) {
        console.error('❌ Kategori okuma hatası (Muhtemelen RLS izinleri kapalı):', catErr.message);
    } else if (catCount === 0) {
        console.log('📥 Kategoriler ekleniyor...');
        const { error: insertErr } = await supabase.from('categories').insert(DEFAULT_DATA.categories);
        if (insertErr) {
            console.error('❌ Kategori ekleme hatası:', insertErr.message);
        } else {
            console.log('✅ Kategoriler başarıyla eklendi.');
        }
    } else {
        console.log(`ℹ️ Zaten ${catCount} adet kategori var. Ekleme yapılmadı.`);
    }

    // 2. Hataları Ekle
    console.log('📦 Hatalar kontrol ediliyor...');
    const { count: errCount, error: errErr } = await supabase.from('errors').select('*', { count: 'exact', head: true });

    if (errErr) {
        console.error('❌ Hata okuma hatası:', errErr.message);
    } else if (errCount === 0) {
        console.log('📥 Hatalar ekleniyor...');

        // ID'leri kaldırarak eklemeyi dene (Otomatik ID için)
        // const errors = DEFAULT_DATA.errors.map(({ id, ...rest }) => rest);

        // Sistemdeki ID'leri korumak için direkt ekliyoruz:
        const { error: insertErr } = await supabase.from('errors').insert(DEFAULT_DATA.errors);

        if (insertErr) {
            console.error('❌ Hata ekleme hatası:', insertErr.message);
            console.log('💡 İPUCU: Supabase panelinde tablonuzda "Enable Row Level Security (RLS)" açık olabilir. Veri eklemek için Policy eklemeli veya RLS yi kapatmalısınız.');
        } else {
            console.log('✅ Hatalar başarıyla eklendi.');
        }
    } else {
        console.log(`ℹ️ Zaten ${errCount} adet kayıtlı hata var. Ekleme yapılmadı.`);
    }
};

seed();
