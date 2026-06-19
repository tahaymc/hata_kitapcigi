"""
Yerel OCR mikroservisi (EasyOCR, Turkce + Ingilizce).

Bot (Node) bu servise base64 gorsel POST'lar; servis metni ve guven oranini
JSON doner. EasyOCR once metin BOLGELERINI tespit edip sonra okudugu icin
fotograflanmis/gurultulu ekranlarda Tesseract'tan belirgin sekilde daha iyi.

Calistirma:
    pip install -r requirements.txt
    uvicorn app:app --host 127.0.0.1 --port 8089
"""
import base64
import io
import os

import cv2
import numpy as np
from fastapi import FastAPI
from PIL import Image, ImageOps
from pydantic import BaseModel

import easyocr

# GPU yok; CPU modunda calisir. Reader model dosyalarini ilk calistirmada
# indirir (~100-200 MB) ve bellekte tutar; sonraki istekler hizlidir.
_LANGS = os.environ.get("OCR_LANGS", "tr,en").split(",")
reader = easyocr.Reader([l.strip() for l in _LANGS if l.strip()], gpu=False, verbose=False)

app = FastAPI(title="hata-kitapcigi OCR")


class OcrRequest(BaseModel):
    image_base64: str


@app.get("/health")
def health():
    return {"status": "ok", "engine": "easyocr", "langs": _LANGS}


def _variants(arr: np.ndarray):
    """On-isleme varyantlari. Tek bir global ayar yok ('candidates' mantigi):
    fotograflanmis cihaz ekranlarinda ekran piksel deseni/gurultu EasyOCR'i
    bozuyor. Olculen sonuclara gore (bkz. debug/ test seti) en cok yardim
    edenler 'denoise' (NlMeans gri) ve 'bilateral' — gurultuyu kenarlari
    koruyarak temizleyip okunabilir parcalari kurtariyorlar. Temiz ekran
    goruntulerinde ham renk daha iyi okundugu icin onu da tutuyoruz; her
    varyanti ayri okuyup en iyisini secip tum metinleri aday veriyoruz.
    NOT: CLAHE denendi ve net zarar verdi (temiz goruntulerde guveni
    dusurdu), bu yuzden kullanilmiyor."""
    out = [("color", arr)]
    try:
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        den = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        out.append(("denoise", cv2.cvtColor(den, cv2.COLOR_GRAY2RGB)))
    except Exception:
        pass
    try:
        out.append(("bilateral", cv2.bilateralFilter(arr, 9, 75, 75)))
    except Exception:
        pass
    return out


def _run(arr: np.ndarray):
    """Tek bir gorsel uzerinde EasyOCR; (metin, guven%) doner."""
    # detail=1 -> (bbox, text, confidence); paragraph=False -> satir/kelime bazli.
    results = reader.readtext(arr, detail=1, paragraph=False)
    texts = [r[1] for r in results if r[1] and r[1].strip()]
    confs = [float(r[2]) for r in results if len(r) > 2]
    text = " ".join(texts)
    confidence = round((sum(confs) / len(confs)) * 100) if confs else 0
    return text, confidence


@app.post("/ocr")
def ocr(req: OcrRequest):
    raw = base64.b64decode(req.image_base64)
    img = Image.open(io.BytesIO(raw))
    # EXIF yonelimini duzelt, RGB'ye cevir.
    img = ImageOps.exif_transpose(img).convert("RGB")

    # Cok kucuk gorselleri buyut; kucuk hata kutularinda tespiti iyilestirir.
    w, h = img.size
    if max(w, h) < 1600:
        scale = 1600 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)))

    arr = np.array(img)

    # Her varyanti ayri ayri oku; en yuksek guvenli olani birincil metin/guven
    # yap (esik bunun uzerinden gecer), tum benzersiz metinleri ise eslesmenin
    # ayri ayri deneyebilmesi icin 'candidates' olarak don.
    runs = []
    for name, variant in _variants(arr):
        try:
            text, confidence = _run(variant)
            if text:
                runs.append((confidence, text))
        except Exception:
            continue

    if not runs:
        return {"text": "", "confidence": 0, "candidates": []}

    runs.sort(key=lambda r: r[0], reverse=True)
    candidates = list(dict.fromkeys(t for _, t in runs))  # sirayi koruyarak benzersizlestir
    return {"text": runs[0][1], "confidence": runs[0][0], "candidates": candidates}
