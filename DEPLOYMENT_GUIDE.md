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
