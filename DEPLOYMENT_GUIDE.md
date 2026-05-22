# Hata Kitapçığı - Sunucu Kurulum Rehberi

Bu rehber, geliştirdiğimiz uygulamayı (Hata Kitapçığı) Windows veya Linux bir sunucuya nasıl kuracağınızı anlatır.

## Sistem Gereksinimleri
- **Node.js**: (Version 18 veya üzeri) Sunucuda kurulu olmalıdır.

## 1. Uygulamanın Derlenmesi (Hazırlık)
Sunucuya atmadan önce, yerel bilgisayarınızda uygulamanın son halini "derlemeniz" (build etmeniz) gerekir.

1. Terminali açın ve şu komutu çalıştırın:
   ```bash
   npm run build
   ```
   Bu işlem, proje klasöründe `dist` adında yeni bir klasör oluşturacaktır. Bu klasör uygulamanızın son halini içerir.

## 2. Sunucuya Dosya Transferi
Sunucuda çalışacak uygulama için aşağıdaki dosya ve klasörleri sunucudaki hedef klasöre (örn: `C:\inetpub\wwwroot\hata-kitapcigi` veya `/var/www/hata-kitapcigi`) kopyalayın:

*   📂 `dist` (Az önce oluşturduğunuz klasör)
*   📄 `server.js` (Arka uç sunucu dosyamız)
*   📄 `defaultData.js` (Eğer veritabanı boşsa kullanılacak varsayılan veriler)
*   📄 `package.json` (Bağımlılık listesi)
*   📄 `.env` (Supabase bağlantı bilgileri - **Sunucuda bu dosyayı oluşturup içine bilgileri yapıştırmalısınız!**)

> **⚠️ Önemli:** `.env` dosyasını sunucuya kopyalayın veya sunucuda oluşturun. İçinde `SUPABASE_URL` ve `SUPABASE_KEY` olmalıdır.

## 3. Sunucuda Kurulum
Sunucuda dosyaları attığınız klasöre girin (Terminal veya CMD ile) ve gerekli kütüphaneleri indirin:

```bash
npm install --production
```
*(Bu komut internet gerektirir. Sadece çalışması için gereken (backend) paketlerini indirir).*

## 4. Uygulamayı Başlatma
Kurulum bittikten sonra uygulamayı başlatmak için:

```bash
npm start
```
Ekranda şöyle bir yazı göreceksiniz:
`Server running on http://0.0.0.0:3001`

Artık tarayıcıdan sunucunun IP adresi ve portu ile girebilirsiniz:
`http://SUNUCU-IP-ADRESI:3001`

## 5. İpucu: Arka Planda Sürekli Çalıştırma
Terminalli kapattığınızda uygulamanın kapanmaması için PM2 kullanabilirsiniz (Opsiyonel):

```bash
npm install -g pm2
pm2 start server.js --name "hata-kitapcigi"
pm2 save
pm2 startup
```
Böylece sunucu yeniden başlasa bile uygulama otomatik çalışır.

---

# 🤖 WhatsApp Bot Kurulumu (`bot/` klasörü)

WhatsApp botu, ana siteyle aynı sunucuda **çalıştırılamaz çünkü Vercel
serverless'tır ve bot kalıcı bir websocket bağlantısı tutar.** Bu yüzden bot
ayrı bir **sanal sunucuda (VPS / Railway / Render / EC2 vb.)** koşmalıdır.

## Mimari özet

```
[Tarayıcı / Admin Panel]  ──HTTPS──>  [Ana Site (Vercel)]
                                            │
                                            │  HTTP (BOT_INTERNAL_URL)
                                            │  Authorization: x-bot-token
                                            ▼
[WhatsApp]  ◄──Baileys──►  [Bot (VPS)] :3002 admin api  +  Redis
```

- Bot, ana sitenin `/api/errors` endpoint'inden hata listesini çeker (Supabase'e
  doğrudan **bağlanmaz**).
- Ana sitenin admin paneli, bot'un `:3002/admin` HTTP'sine proxy yaparak
  durumu okur, ayarları yenilet sinyali gönderir, restart/logout tetikler.

## 1. Veritabanı şeması

Supabase'de yeni iki tablo gerek. SQL editöründe çalıştırın:

```sql
-- bot/sql/bot_settings.sql içeriği
```

Dosyanın tamamı: `bot/sql/bot_settings.sql`

## 2. Sanal sunucuda bot kurulumu (Linux örneği)

```bash
# Sistem paketleri
sudo apt update
sudo apt install -y nodejs npm redis-server build-essential

# Repo'yu çek
git clone <repo-url> /opt/hata-kitapcigi
cd /opt/hata-kitapcigi/bot

# Bağımlılıklar
npm install

# .env oluştur
cp .env.example .env
nano .env
```

Doldurulması gereken değerler:

```env
SITE_API_URL=https://siteniz.vercel.app
BOT_SHARED_TOKEN=<rastgele-uzun-string>      # ana siteyle aynı olmalı
PORT=3000
ADMIN_PORT=3002
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_DIR=./auth_info_baileys
```

Build edip PM2 ile başlat:

```bash
npm run build
sudo npm install -g pm2
pm2 start dist/index.js --name hata-kitapcigi-bot
pm2 save
pm2 startup
```

Bot artık `:3002` üzerinde dinliyor. **Bu portu sadece ana site sunucusundan
erişilebilir kılın** (firewall / iptables / cloud security group).

## 3. Ana sitenin (Vercel) env'lerine ekleyin

Vercel dashboard → Settings → Environment Variables:

- `BOT_INTERNAL_URL` = `https://bot.sunucunuz.com:3002`  *(veya IP)*
- `BOT_SHARED_TOKEN` = bot'taki ile **aynı** değer

> Vercel sadece HTTPS desteklediği için, bot sunucusu için ya ters proxy
> (Caddy/Nginx) ile HTTPS sertifikası, ya da bot'u ana siteyle aynı VPN/network
> içine alın.

## 4. WhatsApp oturumu

İlk başlatmada bot QR kodu üretir. İki seçenek:

1. **Admin panelden:** Site'ye admin olarak girin → "Bot Yönetimi" →
   QR kart kutusunda görüntüleyip tarayın.
2. **Sunucudan:** `bot/qr.png` dosyasını SCP ile çekip tarayın.

Bağlantı kurulduktan sonra `auth_info_baileys/` klasörü oturumu kalıcı tutar;
bot yeniden başlasa da QR gerekmez.

## 5. Geliştirme (yerel)

Tek komutla üçünü birden başlatmak için:

```bash
npm install        # ana proje
npm run bot:install
npm run dev:all
```

Bu;
- Vite dev server (frontend)
- `api/index.js` (port 3001)
- Bot (`ts-node`, port 3000 + admin 3002)

hepsini eş zamanlı çalıştırır.

## 6. Sorun giderme

| Belirti                                 | Olası neden                                                |
|----------------------------------------|------------------------------------------------------------|
| Admin panelde "Canlı bot bağlantısı yok" | `BOT_INTERNAL_URL` yanlış veya bot çalışmıyor             |
| 401 Invalid bot token                  | İki tarafta `BOT_SHARED_TOKEN` farklı                       |
| Bot eşleşme bulamıyor                  | `confidence_threshold` veya `match_score_threshold` çok yüksek |
| QR sürekli yenileniyor                 | WhatsApp telefonunun internet/eşleşme sorunu               |
| `bot_settings/bot_status table missing`| `bot/sql/bot_settings.sql` Supabase'de henüz koşulmamış    |
