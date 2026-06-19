import { createWorker, createScheduler, Scheduler } from 'tesseract.js';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs/promises';
import { config } from '../config/env';
import { redis } from '../config/redis';
import { logger } from '../logger';

export interface OcrResult {
  text: string;
  confidence: number;
  // Tesseract icin birden fazla on-isleme varyantinin metni; eslesme her
  // adayi ayri ayri deneyip en iyi skoru secer (tek bir global ayar job1'i
  // kazandirip job5'i kaybettiriyor; varyantlari birlestirmek ikisini de tutar).
  candidates?: string[];
}

const normalize = (raw: string): string =>
  (raw || '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ---------------------------------------------------------------------------
// Google Cloud Vision (DOCUMENT_TEXT_DETECTION)
// Fotograflanmis ekranlari yerel Tesseract'tan cok daha iyi okur. API anahtari
// yoksa veya cagri basarisiz olursa Tesseract'a dusulur (asagida).
// ---------------------------------------------------------------------------
const googleVisionOcr = async (imagePath: string): Promise<OcrResult> => {
  const content = (await fs.readFile(imagePath)).toString('base64');
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${config.ocr.googleApiKey}`;
  const body = {
    requests: [
      {
        image: { content },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: { languageHints: ['tr', 'en'] },
      },
    ],
  };

  const { data } = await axios.post(url, body, { timeout: 20_000 });
  const resp = data?.responses?.[0];
  if (resp?.error) {
    throw new Error(`Vision API error: ${resp.error.message || JSON.stringify(resp.error)}`);
  }

  const fta = resp?.fullTextAnnotation;
  const text = normalize(fta?.text || resp?.textAnnotations?.[0]?.description || '');

  // Kelime bazli guven ortalamasi (yoksa makul bir varsayilan)
  const confs: number[] = [];
  fta?.pages?.forEach((p: any) =>
    p.blocks?.forEach((b: any) =>
      b.paragraphs?.forEach((par: any) =>
        par.words?.forEach((w: any) => {
          if (typeof w.confidence === 'number') confs.push(w.confidence);
        }),
      ),
    ),
  );
  const confidence = confs.length
    ? Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100)
    : 90;

  return { text, confidence, candidates: [text] };
};

// ---------------------------------------------------------------------------
// Yerel EasyOCR mikroservisi (bkz. ocr-service/). Metin bolgelerini tespit edip
// okudugu icin fotograflanmis/gurultulu ekranlarda Tesseract'tan cok daha iyi.
// Ulasilamazsa cagiran taraf Tesseract'a duser.
// ---------------------------------------------------------------------------
const easyOcr = async (imagePath: string): Promise<OcrResult> => {
  const image_base64 = (await fs.readFile(imagePath)).toString('base64');
  const { data } = await axios.post(
    `${config.ocr.localUrl}/ocr`,
    { image_base64 },
    { timeout: 45_000 },
  );
  const text = normalize(data?.text || '');
  const confidence = typeof data?.confidence === 'number' ? data.confidence : 0;
  // Servis on-isleme varyantlarinin metinlerini 'candidates' olarak doner;
  // eslesme her adayi ayri deneyip en iyi skoru secer. Eski surumlerle uyum
  // icin yoksa tek metne dus.
  const rawCandidates: string[] = Array.isArray(data?.candidates) ? data.candidates : [text];
  const candidates = Array.from(
    new Set(rawCandidates.map((c) => normalize(c)).filter((c) => c.length > 0)),
  );
  return { text, confidence, candidates: candidates.length ? candidates : [text] };
};

// ---------------------------------------------------------------------------
// Tesseract (yerel, fallback). Dil basina kalici worker havuzu.
// ---------------------------------------------------------------------------
const POOL_SIZE = 2;
const schedulers = new Map<string, Promise<Scheduler>>();

const getScheduler = (languages: string): Promise<Scheduler> => {
  let existing = schedulers.get(languages);
  if (!existing) {
    existing = (async () => {
      const scheduler = createScheduler();
      for (let i = 0; i < POOL_SIZE; i++) {
        const worker = await createWorker(languages);
        scheduler.addWorker(worker);
      }
      logger.info(`OCR worker pool ready (${POOL_SIZE} workers, langs=${languages})`);
      return scheduler;
    })();
    schedulers.set(languages, existing);
  }
  return existing;
};

// On-isleme varyantlari. Tek bir global ayar yok: olculdu ki sade grayscale
// dogrudan/temiz fotograflari (job1: "...connected party did not respond")
// daha iyi okurken, ~2000px'e buyutup hafif sharpen kucuk/dusuk cozunurluklu
// ekranlardaki yaziyi ve sayisal kodlari (job5: "82517") kurtariyor. Ikisini
// de uretip eslesme adayi olarak veriyoruz; en iyi skoru eslesme secer.
type Preprocess = (img: sharp.Sharp) => sharp.Sharp;
const PREPROCESS_VARIANTS: { name: string; fn: Preprocess }[] = [
  { name: 'plain', fn: (img) => img.rotate().grayscale().normalize() },
  {
    name: 'upscale',
    fn: (img) => img.rotate().resize({ width: 2000, withoutEnlargement: false }).grayscale().normalize().sharpen(),
  },
];

const runTesseractVariant = async (
  imagePath: string,
  languages: string,
  name: string,
  fn: Preprocess,
): Promise<OcrResult> => {
  const processedImagePath = `${imagePath}_${name}.png`;
  try {
    await fn(sharp(imagePath)).toFile(processedImagePath);
    const scheduler = await getScheduler(languages);
    const result: any = await scheduler.addJob('recognize', processedImagePath);
    return { text: normalize(result.data.text), confidence: result.data.confidence };
  } finally {
    try {
      await fs.unlink(processedImagePath);
    } catch {
      // ignore
    }
  }
};

const tesseractOcr = async (imagePath: string, languages: string): Promise<OcrResult> => {
  const settled = await Promise.all(
    PREPROCESS_VARIANTS.map((v) =>
      runTesseractVariant(imagePath, languages, v.name, v.fn).catch((err) => {
        logger.warn(`Tesseract variant '${v.name}' failed: ${err?.message || err}`);
        return null;
      }),
    ),
  );

  const ok = settled.filter((r): r is OcrResult => r !== null);
  if (ok.length === 0) {
    throw new Error('All Tesseract preprocessing variants failed');
  }

  // Birincil metin/guven: en yuksek guvenli varyant (confidence esigi bunun
  // uzerinden gecer). candidates: tum benzersiz varyant metinleri.
  ok.sort((a, b) => b.confidence - a.confidence);
  const candidates = Array.from(new Set(ok.map((r) => r.text).filter((t) => t.length > 0)));
  return { text: ok[0].text, confidence: ok[0].confidence, candidates };
};

// ---------------------------------------------------------------------------
// Google Vision aylik kota sayaci (Redis). Ucretsiz katman feature basina ayda
// 1000 birim; bunu astiktan sonra Google ucret yazar. Sayaci kendimiz tutup
// limite gelince Google'i HIC cagirmadan EasyOCR'a duseriz: boylece ne surpriz
// ucret olur, ne de her goruntude bosa giden basarisiz Google cagrisi. Anahtar
// aylik (ocr:google:count:YYYY-MM), ~62 gun TTL ile (yeni ayda temizlenir).
// ---------------------------------------------------------------------------
const googleQuotaKey = (): string => {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `ocr:google:count:${ym}`;
};

const googleQuotaAvailable = async (): Promise<boolean> => {
  if (config.ocr.googleMonthlyLimit <= 0) return false;
  try {
    const used = parseInt((await redis.get(googleQuotaKey())) || '0', 10);
    return used < config.ocr.googleMonthlyLimit;
  } catch (err: any) {
    // Sayac okunamazsa ucret riskine girmemek icin Google'i atla (fail-closed).
    logger.warn(`Google quota check failed (${err?.message || err}); skipping Google this call.`);
    return false;
  }
};

const incrGoogleQuota = async (): Promise<number> => {
  const key = googleQuotaKey();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 24 * 62);
  return count;
};

export class OcrService {
  static async extractText(imagePath: string, languages: string = 'eng+tur'): Promise<OcrResult> {
    logger.info(`Starting OCR process for image: ${imagePath}`);

    // Saglayici zinciri: birincil saglayici (OCR_PROVIDER / anahtar varligi)
    // basta denenir, basarisiz olursa sonraki mevcut saglayiciya duser.
    //   google   -> Google Vision -> EasyOCR -> Tesseract
    //   easyocr  -> EasyOCR -> Tesseract
    //   tesseract-> Tesseract
    // Google yalnizca aylik kota dolmamissa zincire eklenir; dolunca otomatik
    // olarak EasyOCR devralir (ay sonuna kadar). Tesseract her zaman son care.
    type Step = { name: string; run: () => Promise<OcrResult>; onSuccess?: () => Promise<void> };
    const steps: Step[] = [];

    const useGoogle = config.ocr.provider === 'google';
    const useEasy = config.ocr.provider === 'google' || config.ocr.provider === 'easyocr';

    if (useGoogle && config.ocr.googleApiKey && (await googleQuotaAvailable())) {
      steps.push({
        name: 'Google Vision',
        run: () => googleVisionOcr(imagePath),
        onSuccess: async () => {
          const count = await incrGoogleQuota();
          if (count >= config.ocr.googleMonthlyLimit) {
            logger.warn(
              `Google Vision monthly quota reached (${count}/${config.ocr.googleMonthlyLimit}); switching to EasyOCR until next month.`,
            );
          }
        },
      });
    }
    if (useEasy && config.ocr.localUrl) {
      steps.push({ name: 'EasyOCR', run: () => easyOcr(imagePath) });
    }
    steps.push({ name: 'Tesseract', run: () => tesseractOcr(imagePath, languages) });

    let lastError: unknown;
    for (const step of steps) {
      try {
        const res = await step.run();
        if (step.onSuccess) {
          await step.onSuccess().catch((e) => logger.warn(`OCR quota update failed: ${e?.message || e}`));
        }
        logger.info(`OCR (${step.name}): ${res.text.length} chars, ${res.confidence}% confidence.`);
        logger.debug(`Normalized OCR Text: \n${res.text}`);
        return res;
      } catch (err: any) {
        lastError = err;
        logger.warn(`${step.name} OCR failed (${err?.message || err}); trying next provider.`);
      }
    }

    logger.error(`OCR processing failed for ${imagePath}:`, lastError);
    throw lastError instanceof Error ? lastError : new Error('All OCR providers failed');
  }
}
