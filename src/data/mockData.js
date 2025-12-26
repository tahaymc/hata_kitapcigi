export const CATEGORIES = [
    { id: 'kasa', name: 'Kasa', color: 'blue' },
    { id: 'reyon', name: 'Reyon', color: 'emerald' },
    { id: 'depo', name: 'Depo', color: 'orange' },
    { id: 'sistem', name: 'Sistem', color: 'purple' },
    { id: 'diger', name: 'Diğer', color: 'slate' },
];

let ERRORS = [
    {
        id: 1,
        title: 'Fiş Yazıcı Bağlantı Hatası',
        code: 'SYS-101',
        category: 'sistem',
        summary: 'Yazıcıdan çıktı alınamıyor, kırmızı ışık yanıp sönüyor.',
        solution: `1. Yazıcının güç kablosunu kontrol edin.
2. USB bağlantısının tam oturduğundan emin olun.
3. Kağıt rulosunun doğru takıldığını kontrol edin.
4. Yazıcıyı kapatıp 10 saniye bekledikten sonra tekrar açın.
5. Sorun devam ederse IT departmanına [Ticket Açın].`,
        date: '2023-10-25',
        imageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&auto=format&fit=crop&q=60'
    },
    {
        id: 2,
        title: 'Kasa Programı Kilitlendi',
        code: 'KAS-204',
        category: 'kasa',
        summary: 'Satış ekranı dondu, işlem yapılamıyor.',
        solution: `1. CTRL+ALT+DEL tuşlarına basın.
2. Görev Yöneticisi'ni açın.
3. Kasa uygulamasını seçip "Görevi Sonlandır" deyin.
4. Uygulamayı masaüstünden tekrar başlatın.`,
        date: '2023-10-26',
        imageUrl: 'https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800&auto=format&fit=crop&q=60'
    },
    {
        id: 3,
        title: 'Etiket Yazıcı Kalibrasyonu',
        code: 'REY-305',
        category: 'reyon',
        summary: 'Etiketler kaymış basılıyor, hizalama sorunu var.',
        solution: `1. Yazıcının üzerindeki 'Feed' tuşuna basılı tutun.
2. Işık yanıp sönmeye başlayınca bırakın.
3. Yazıcı birkaç boş etiket verip duracaktır.
4. Tekrar deneme baskısı alın.`,
        date: '2023-10-27'
    },
    {
        id: 4,
        title: 'Barkod Okuyucu Okumuyor',
        code: 'KAS-205',
        category: 'kasa',
        summary: 'Lazer ışığı yanıyor ancak barkodu sisteme aktarmıyor.',
        solution: `1. Okuyucunun kablosunu çıkarıp takın.
2. Başka bir USB portuna takarak deneyin.
3. Kabloda kırık veya ezilme var mı kontrol edin.
4. Sorun devam ederse yedek okuyucu ile değiştirin.`,
        date: '2023-10-28'
    },
    {
        id: 5,
        title: 'El Terminali Şarj Almıyor',
        code: 'DEP-301',
        category: 'depo',
        summary: 'Terminali kızağa koyunca şarj ışığı yanmıyor.',
        solution: `1. Şarj kızağının fişini kontrol edin.
2. Terminalin ve kızağın metal temas noktalarını kuru bir bezle temizleyin.
3. Bataryanın tam oturduğundan emin olun.`,
        date: '2023-10-28'
    },
    {
        id: 6,
        title: 'İnternet Bağlantısı Yok',
        code: 'SYS-102',
        category: 'sistem',
        summary: 'Tüm bilgisayarlarda ağ bağlantısı koptu.',
        solution: `1. Modemin ışıklarını kontrol edin (DSL/PON ışığı yanıyor mu?).
2. Switch dolabındaki sigortaları kontrol edin.
3. Kablolarda yerinden çıkan var mı bakın.
4. Bilgi işlem departmanına acil durum bildirin.`,
        date: '2023-10-29'
    },
    {
        id: 7,
        title: 'Raf Etiketi Basılmıyor',
        code: 'REY-306',
        category: 'reyon',
        summary: 'El terminalinden gönderilen etiketler yazıcıdan çıkmıyor.',
        solution: `1. Yazıcının "Ready" konumunda olduğundan emin olun.
2. El terminalinin Wi-Fi bağlantısını kontrol edin.
3. Yazıcı kuyruğunda bekleyen işleri temizleyin.`,
        date: '2023-10-29'
    },
    {
        id: 8,
        title: 'Klima Arızası',
        code: 'GEN-001',
        category: 'diger',
        summary: 'Mağaza içi klima sistemi soğutmuyor/ısıtmıyor.',
        solution: `1. Termostat ayarlarını kontrol edin.
2. Sigorta panelinden klima şalterini kontrol edin.
3. Dış ünitenin önünde engel var mı bakın.
4. Teknik servis kaydı oluşturun.`,
        date: '2023-10-30'
    },
    {
        id: 9,
        title: 'Yazar Kasa Çekmecesi Açılmıyor',
        code: 'KAS-206',
        category: 'kasa',
        summary: 'Satış sonrası veya manuel tetiklemeyle çekmece açılmıyor.',
        solution: `1. Çekmecenin anahtarla kilitli olup olmadığını kontrol edin.
2. Yazıcı ile çekmece arasındaki kabloyu kontrol edin (genelde yazıcı tetikler).
3. Çekmecenin altında bir nesne sıkışmış olabilir.`,
        date: '2023-10-30'
    },
    {
        id: 10,
        title: 'ERP Giriş Hatası',
        code: 'SYS-103',
        category: 'sistem',
        summary: '"Kullanıcı adı veya şifre hatalı" veya sunucuya erişilemiyor.',
        solution: `1. Caps Lock tuşunun açık olup olmadığını kontrol edin.
2. Şifrenizin süresi dolmuş olabilir, portal üzerinden sıfırlayın.
3. VPN bağlantısı gerekiyorsa bağlı olduğunuzdan emin olun.`,
        date: '2023-10-31'
    },
    {
        id: 11,
        title: 'Stok Sayım Hatası',
        code: 'DEP-302',
        category: 'depo',
        summary: 'Sayılan ürünler sisteme eksik aktarılıyor.',
        solution: `1. El terminalinde bekleyen aktarım dosyası var mı kontrol edin.
2. Sayım yapılan lokasyon kodunun doğruluğunu teyit edin.
3. Wi-Fi çekim gücünün düşük olduğu "kör nokta"ları kontrol edin.`,
        date: '2023-11-01'
    },
    {
        id: 12,
        title: 'Terazi Kalibrasyonu',
        code: 'REY-307',
        category: 'reyon',
        summary: 'Terazi tartım sonuçları hatalı çıkıyor.',
        solution: `1. Terazinin ayaklarının yere tam bastığını ve dengede olduğunu (su terazisi ile) kontrol edin.
2. Terazi kefesinin altına bir şey sıkışıp sıkışmadığını kontrol edin.
3. Cihazı kapatıp açın, açılırken kefe üzerinde yük olmamalıdır.`,
        date: '2023-11-01'
    },
    {
        id: 13,
        title: 'Z Raporu Alınamıyor',
        code: 'KAS-207',
        category: 'kasa',
        summary: 'Gün sonu işlemi hata veriyor, rapor çıkmıyor.',
        solution: `1. Gün içinde bekleyen (askıda) fiş olup olmadığını kontrol edin.
2. Mali hafıza doluluk oranını kontrol edin.
3. Kasa ile ödeme kaydedici cihaz arasındaki bağlantıyı kontrol edin.`,
        date: '2023-11-02'
    }
];

// Helper functions (Simulating async API)
export const getCategories = async () => {
    return Promise.resolve(CATEGORIES);
};

export const getAllErrors = async () => {
    return Promise.resolve([...ERRORS]);
};

export const getErrorById = async (id) => {
    const error = ERRORS.find(e => e.id == id);
    return Promise.resolve(error);
};

export const searchErrors = async (query, categoryId) => {
    let filtered = ERRORS;

    if (categoryId) {
        filtered = filtered.filter(e => e.category === categoryId);
    }

    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.summary.toLowerCase().includes(q)
        );
    }

    return Promise.resolve(filtered);
};

// Admin Functions
export const addError = async (newError) => {
    const id = ERRORS.length > 0 ? Math.max(...ERRORS.map(e => e.id)) + 1 : 1;
    const error = { ...newError, id, date: new Date().toISOString().split('T')[0] };
    ERRORS = [error, ...ERRORS];
    return Promise.resolve(error);
};

export const updateError = async (id, updatedData) => {
    ERRORS = ERRORS.map(e => (e.id === id ? { ...e, ...updatedData } : e));
    return Promise.resolve(true);
};

export const deleteError = async (id) => {
    ERRORS = ERRORS.filter(e => e.id !== id);
    return Promise.resolve(true);
};
