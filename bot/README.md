# Hata Kitapçığı – WhatsApp Bot

WhatsApp üzerinden gelen ekran görüntülerini OCR ile okur, ana sitenin
`/api/errors` endpoint'i üzerinden hata kayıtlarıyla eşler ve cevap döner.

## Mimari

```
WhatsApp -> Baileys -> BullMQ (Redis) -> Pipeline
                                              |-- OCR (Tesseract)
                                              |-- Match (site /api/errors)
                                              |-- Reply (WhatsApp)
                                              `-- Heartbeat / stats -> site /api/bot/*

Site Admin Panel  ---->  api/index.js  ---HTTP--->  Bot Admin Server (port 3002)
                                                       (token-protected)
```

Bot **Supabase'e doğrudan bağlanmaz**; tüm hata verisi ve ayarlar
ana sitenin REST API'si üzerinden gelir.

## Geliştirme

```powershell
# Önce ana proje API'sini çalıştır (kök dizin):
cd ..
npm run dev   # vite + api/index.js

# Bot dizininde:
cd bot
cp .env.example .env   # değerleri doldur
npm install
.\start.ps1
```

## Sanal sunucuda (Linux) çalıştırma

```bash
sudo apt install -y redis-server
cd bot
cp .env.example .env
nano .env   # SITE_API_URL ve BOT_SHARED_TOKEN'ı doldur
npm install
npm run build
# PM2 ile:
npm i -g pm2
pm2 start dist/index.js --name hata-kitapcigi-bot
pm2 save
```

QR kodu admin panelinden görüntüleyebilir veya `auth_info_baileys/qr.png`
dosyasından okuyabilirsiniz.

## Önemli env değişkenleri

| Değişken            | Açıklama                                              |
|---------------------|-------------------------------------------------------|
| `SITE_API_URL`      | Ana sitenin URL'i (`https://siteniz.com`)             |
| `BOT_SHARED_TOKEN`  | Site ↔ bot arası HTTP'yi koruyan ortak gizli token     |
| `ADMIN_PORT`        | Bot'un admin HTTP sunucu portu (default 3002)         |
| `REDIS_HOST/PORT`   | Redis bağlantısı                                       |
| `SESSION_DIR`       | WhatsApp oturum klasörü                                |
