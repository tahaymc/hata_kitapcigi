import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Serve Static Frontend (Production)
app.use(express.static(path.join(__dirname, 'dist')));


// Default Data (from mockData.js)
const DEFAULT_DATA = {
    errors: [
        {
            id: 1,
            title: 'Fiş Yazıcı Bağlantı Hatası',
            code: 'SYS-101',
            category: 'sistem',
            summary: 'Yazıcıdan çıktı alınamıyor, kırmızı ışık yanıp sönüyor.',
            solution: "1. Yazıcının güç kablosunu kontrol edin.\n2. USB bağlantısının tam oturduğundan emin olun.\n3. Kağıt rulosunun doğru takıldığını kontrol edin.\n4. Yazıcıyı kapatıp 10 saniye bekledikten sonra tekrar açın.\n5. Sorun devam ederse IT departmanına [Ticket Açın].",
            date: '2023-10-25',
            viewCount: 124,
            imageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 2,
            title: 'Kasa Programı Kilitlendi',
            code: 'KAS-204',
            category: 'kasa',
            summary: 'Satış ekranı dondu, işlem yapılamıyor.',
            solution: "1. CTRL+ALT+DEL tuşlarına basın.\n2. Görev Yöneticisi'ni açın.\n3. Kasa uygulamasını seçip \"Görevi Sonlandır\" deyin.\n4. Uygulamayı masaüstünden tekrar başlatın.",
            date: '2023-10-26',
            imageUrl: 'https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 3,
            title: 'Etiket Yazıcı Kalibrasyonu',
            code: 'REY-305',
            category: 'reyon',
            summary: 'Etiketler kaymış basılıyor, hizalama sorunu var.',
            solution: "1. Yazıcının üzerindeki 'Feed' tuşuna basılı tutun.\n2. Işık yanıp sönmeye başlayınca bırakın.\n3. Yazıcı birkaç boş etiket verip duracaktır.\n4. Tekrar deneme baskısı alın.",
            date: '2023-10-27',
            imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 4,
            title: 'Barkod Okuyucu Okumuyor',
            code: 'KAS-205',
            category: 'kasa',
            summary: 'Lazer ışığı yanıyor ancak barkodu sisteme aktarmıyor.',
            solution: "1. Okuyucunun kablosunu çıkarıp takın.\n2. Başka bir USB portuna takarak deneyin.\n3. Kabloda kırık veya ezilme var mı kontrol edin.\n4. Sorun devam ederse yedek okuyucu ile değiştirin.",
            date: '2023-10-28',
            imageUrl: 'https://images.unsplash.com/photo-1591485112902-5b328ac585ee?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 5,
            title: 'El Terminali Şarj Almıyor',
            code: 'DEP-301',
            category: 'depo',
            summary: 'Terminali kızağa koyunca şarj ışığı yanmıyor.',
            solution: "1. Şarj kızağının fişini kontrol edin.\n2. Terminalin ve kızağın metal temas noktalarını kuru bir bezle temizleyin.\n3. Bataryanın tam oturduğundan emin olun.",
            date: '2023-10-28',
            imageUrl: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 6,
            title: 'İnternet Bağlantısı Yok',
            code: 'SYS-102',
            category: 'sistem',
            summary: 'Tüm bilgisayarlarda ağ bağlantısı koptu.',
            solution: "1. Modemin ışıklarını kontrol edin (DSL/PON ışığı yanıyor mu?).\n2. Switch dolabındaki sigortaları kontrol edin.\n3. Kablolarda yerinden çıkan var mı bakın.\n4. Bilgi işlem departmanına acil durum bildirin.",
            date: '2023-10-29',
            imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 7,
            title: 'Raf Etiketi Basılmıyor',
            code: 'REY-306',
            category: 'reyon',
            summary: 'El terminalinden gönderilen etiketler yazıcıdan çıkmıyor.',
            solution: "1. Yazıcının \"Ready\" konumunda olduğundan emin olun.\n2. El terminalinde Wi-Fi bağlantısını kontrol edin.\n3. Yazıcı kuyruğunda bekleyen işleri temizleyin.",
            date: '2023-10-29',
            imageUrl: 'https://images.unsplash.com/photo-1588611910609-847253d71973?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 8,
            title: 'Klima Arızası',
            code: 'GEN-001',
            category: 'diger',
            summary: 'Mağaza içi klima sistemi soğutmuyor/ısıtmıyor.',
            solution: "1. Termostat ayarlarını kontrol edin.\n2. Sigorta panelinden klima şalterini kontrol edin.\n3. Dış ünitenin önünde engel var mı bakın.\n4. Teknik servis kaydı oluşturun.",
            date: '2023-10-30',
            imageUrl: 'https://images.unsplash.com/photo-1574966739987-65e38db0f7ce?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 9,
            title: 'Yazar Kasa Çekmecesi Açılmıyor',
            code: 'KAS-206',
            category: 'kasa',
            summary: 'Satış sonrası veya manuel tetiklemeyle çekmece açılmıyor.',
            solution: "1. Çekmecenin anahtarla kilitli olup olmadığını kontrol edin.\n2. Yazıcı ile çekmece arasındaki kabloyu kontrol edin (genelde yazıcı tetikler).\n3. Çekmecenin altında bir nesne sıkışmış olabilir.",
            date: '2023-10-30',
            imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 10,
            title: 'ERP Giriş Hatası',
            code: 'SYS-103',
            category: 'sistem',
            summary: '"Kullanıcı adı veya şifre hatalı" veya sunucuya erişilemiyor.',
            solution: "1. Caps Lock tuşunun açık olup olmadığını kontrol edin.\n2. Şifrenizin süresi dolmuş olabilir, portal üzerinden sıfırlayın.\n3. VPN bağlantısı gerekiyorsa bağlı olduğunuzdan emin olun.",
            date: '2023-10-31',
            imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 11,
            title: 'Stok Sayım Hatası',
            code: 'DEP-302',
            category: 'depo',
            summary: 'Sayılan ürünler sisteme eksik aktarılıyor.',
            solution: "1. El terminalinde bekleyen aktarım dosyası var mı kontrol edin.\n2. Sayım yapılan lokasyon kodunun doğruluğunu teyit edin.\n3. Wi-Fi çekim gücünün düşük olduğu \"kör nokta\"ları kontrol edin.",
            date: '2023-11-01',
            imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 12,
            title: 'Terazi Kalibrasyonu',
            code: 'REY-307',
            category: 'reyon',
            summary: 'Terazi tartım sonuçları hatalı çıkıyor.',
            solution: "1. Terazinin ayaklarının yere tam bastığını ve dengede olduğunu (su terazisi ile) kontrol edin.\n2. Terazi kefesinin altına bir şey sıkışıp sıkışmadığını kontrol edin.\n3. Cihazı kapatıp açın, açılırken kefe üzerinde yük olmamalıdır.",
            date: '2023-11-01',
            imageUrl: 'https://images.unsplash.com/photo-1579705295015-688849b380db?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 13,
            title: 'Z Raporu Alınamıyor',
            code: 'KAS-207',
            category: 'kasa',
            summary: 'Gün sonu işlemi hata veriyor, rapor çıkmıyor.',
            solution: "1. Gün içinde bekleyen (askıda) fiş olup olmadığını kontrol edin.\n2. Mali hafıza doluluk oranını kontrol edin.\n3. Kasa ile ödeme kaydedici cihaz arasındaki bağlantıyı kontrol edin.",
            date: '2023-11-02',
            imageUrl: 'https://plus.unsplash.com/premium_photo-1661331911417-3475ca332c69?w=800&auto=format&fit=crop&q=60'
        }
    ],
    categories: [
        { id: 'kasa', name: 'Kasa', color: 'blue' },
        { id: 'reyon', name: 'Reyon', color: 'emerald' },
        { id: 'depo', name: 'Depo', color: 'orange' },
        { id: 'sistem', name: 'Sistem', color: 'purple' },
        { id: 'diger', name: 'Diğer', color: 'slate' },
    ]
};

// Helper to read DB
const readDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
        return DEFAULT_DATA;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

// Helper to write DB
const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Initialize DB if needed
readDb();

// Routes
// GET All Errors
app.get('/api/errors', (req, res) => {
    const data = readDb();
    res.json(data.errors);
});

// GET All Categories
app.get('/api/categories', (req, res) => {
    const data = readDb();
    res.json(data.categories);
});

// POST New Error
app.post('/api/errors', (req, res) => {
    const data = readDb();
    const newError = {
        ...req.body,
        id: data.errors.length > 0 ? Math.max(...data.errors.map(e => e.id)) + 1 : 1,
        viewCount: 0,
        date: new Date().toISOString().split('T')[0]
    };
    data.errors.unshift(newError);
    writeDb(data);
    res.status(201).json(newError);
});

// PUT Update Error
app.put('/api/errors/:id', (req, res) => {
    const data = readDb();
    const id = parseInt(req.params.id);
    const index = data.errors.findIndex(e => e.id === id);

    if (index !== -1) {
        data.errors[index] = { ...data.errors[index], ...req.body };
        writeDb(data);
        res.json(data.errors[index]);
    } else {
        res.status(404).json({ error: 'Error not found' });
    }
});

// DELETE Error
app.delete('/api/errors/:id', (req, res) => {
    const data = readDb();
    const id = parseInt(req.params.id);
    const filteredErrors = data.errors.filter(e => e.id !== id);

    if (data.errors.length !== filteredErrors.length) {
        data.errors = filteredErrors;
        writeDb(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Error not found' });
    }
});

// Incremenet View Count (Special Endpoint)
app.post('/api/errors/:id/view', (req, res) => {
    const data = readDb();
    const id = parseInt(req.params.id);
    const index = data.errors.findIndex(e => e.id === id);

    if (index !== -1) {
        data.errors[index].viewCount = (data.errors[index].viewCount || 0) + 1;
        writeDb(data);
        res.json(data.errors[index]);
    } else {
        res.status(404).json({ error: 'Error not found' });
    }
});

// Serve index.html for any other requests (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
