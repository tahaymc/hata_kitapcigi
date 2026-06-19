# Yerel OCR servisi (EasyOCR)

Bot (Node) ile aynı VPS'te çalışan küçük bir HTTP servisi. Fotoğraflanmış /
gürültülü ekran görüntülerini Tesseract'tan belirgin biçimde daha iyi okur.
Tamamen ücretsiz ve yereldir (bulut yok).

## Kurulum

```bash
cd bot/ocr-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/VPS:
source .venv/bin/activate

pip install -r requirements.txt
```

İlk çalıştırmada EasyOCR model dosyalarını indirir (~100–200 MB), sonra önbelleğe alır.

## Çalıştırma

```bash
uvicorn app:app --host 127.0.0.1 --port 8089
```

Sağlık kontrolü: `GET http://127.0.0.1:8089/health`

### Yerel geliştirme (Windows)

Kök dizindeki `npm run dev:all` artık bu servisi de başlatır (api + web + bot + **ocr**),
böylece tek komutla tam yığın ayağa kalkar. Bu script venv'in Windows yolunu
(`bot\ocr-service\.venv\Scripts\python.exe`) kullanır; önce yukarıdaki kurulumu
yaptığınızdan emin olun. Yalnızca OCR servisini başlatmak için: `npm run ocr`.

### VPS / production

dev:all yerine servisi systemd / pm2 / Docker ile kalıcı çalıştırın (24/7 ayakta
kalsın); Linux'ta venv yolu `bot/ocr-service/.venv/bin/uvicorn` olur.

## Botu bağlama

`bot/.env` içine:

```
OCR_LOCAL_URL=http://127.0.0.1:8089
```

Bot otomatik olarak `easyocr` sağlayıcısına geçer. Servis ulaşılamazsa veya hata
verirse bot kendiliğinden yerel Tesseract'a düşer (kesintisiz çalışır).

## API

`POST /ocr` — gövde: `{ "image_base64": "<base64>" }`
Yanıt: `{ "text": "...", "confidence": 0-100 }`

Diller `OCR_LANGS` ortam değişkeniyle ayarlanır (varsayılan `tr,en`).
