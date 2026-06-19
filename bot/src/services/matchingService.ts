import { logger } from '../logger';
import { apiClient, ErrorRecord } from './apiClient';
import { getSettings } from './settingsClient';

export class MatchingService {
  private static normalizeTextForSearch(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Summary/solution alanlari zengin metin (HTML) icerebilir. Etiketleri ve
   * etiket niteliklerini ("data-path-to-node", "font", "color", "8b5cf6"...)
   * tamamen atmazsak bunlar "kelime" sayilip eslesme oranini sulandiriyor.
   */
  private static stripHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ');
  }

  /**
   * Bir kayit kelimesinin OCR metninde gecip gecmedigini OCR hatalarina
   * toleransli sekilde kontrol eder. Birebir gecmiyorsa, uzun kelimelerde
   * (>=5 harf) 1 karakter sapmayi (orn. "baglanti" <-> "baglantt") kabul eder.
   */
  private static fuzzyContains(word: string, ocrWords: Set<string>, normalizedOcr: string): boolean {
    if (ocrWords.has(word) || normalizedOcr.includes(word)) return true;
    if (word.length >= 5) {
      for (const ow of ocrWords) {
        if (Math.abs(ow.length - word.length) <= 1 && MatchingService.levenshtein(ow, word) <= 1) {
          return true;
        }
      }
    }
    return false;
  }

  /** Alan metnini OCR kelime kumesiyle karsilastirip 0..weight arasi puan uretir. */
  private static scoreField(
    fieldText: string,
    weight: number,
    ocrWords: Set<string>,
    normalizedOcr: string,
    minLen = 3,
  ): number {
    const words = this.normalizeTextForSearch(this.stripHtml(fieldText))
      .split(' ')
      .filter((w) => w.length > minLen);
    if (words.length === 0) return 0;
    let matched = 0;
    for (const word of words) {
      if (this.fuzzyContains(word, ocrWords, normalizedOcr)) matched++;
    }
    return (matched / words.length) * weight;
  }

  /** Levenshtein edit distance — small strings only (numeric error codes). */
  private static levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let curr = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      [prev, curr] = [curr, prev];
    }
    return prev[n];
  }

  /** Tek bir OCR metnini tum kayitlara karsi puanlar; en iyi kayit + skoru doner. */
  private static scoreText(ocrText: string, errors: ErrorRecord[]): { record: ErrorRecord | null; score: number } {
    const rawOcrUpper = ocrText.toUpperCase();
    const normalizedOcr = this.normalizeTextForSearch(ocrText);
    const ocrWords = new Set(normalizedOcr.split(' ').filter((w) => w.length > 2));

    let bestMatch: ErrorRecord | null = null;
    let highestScore = 0;

    for (const error of errors) {
      let currentScore = 0;

      if (error.code && error.code.length > 2) {
        const codeUpper = error.code.toUpperCase();
        if (rawOcrUpper.includes(codeUpper)) {
          currentScore += 100;
        } else if (/^\d{4,}$/.test(error.code)) {
          // OCR sik sik sayisal kodun basindaki/sonundaki bir rakami dusurur
          // veya yanlis okur (orn. "82517" -> "2517"). Kodu, OCR metnindeki
          // rakam dizileriyle benzer uzunlukta ve edit distance <= 1 olacak
          // sekilde karsilastirip yakin eslesmeye guclu puan veriyoruz.
          const ocrNumbers = rawOcrUpper.match(/\d{3,}/g) || [];
          const near = ocrNumbers.some(
            (n) =>
              Math.abs(n.length - error.code!.length) <= 1 &&
              MatchingService.levenshtein(n, error.code!) <= 1,
          );
          if (near) currentScore += 80;
        }
      }

      if (error.title) {
        currentScore += this.scoreField(error.title, 50, ocrWords, normalizedOcr, 2);
      }

      if (error.summary) {
        currentScore += this.scoreField(error.summary, 30, ocrWords, normalizedOcr);
      }

      // Cozum metni cogu zaman ekranda gecen kelimeleri (hata aciklamasi,
      // buton adlari vb.) icerir; dusuk agirlikla skora katiyoruz.
      if (error.solution) {
        currentScore += this.scoreField(error.solution, 25, ocrWords, normalizedOcr);
      }

      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestMatch = error;
      }
    }

    return { record: bestMatch, score: highestScore };
  }

  /**
   * Pulls all errors from the site API and scores them against the OCR text.
   * Birden fazla aday metin verilirse (Tesseract on-isleme varyantlari) her
   * birini ayri puanlar ve en yuksek skorlu eslesmeyi doner.
   */
  static async findBestMatch(ocrText: string | string[]): Promise<{ record: ErrorRecord; score: number } | null> {
    try {
      const texts = (Array.isArray(ocrText) ? ocrText : [ocrText]).filter((t) => t && t.length >= 5);
      if (texts.length === 0) {
        logger.warn('OCR text is too short to perform a meaningful search.');
        return null;
      }

      const settings = await getSettings();
      const errors = await apiClient.getAllErrors();

      if (!errors || errors.length === 0) {
        logger.warn('No records returned from /api/errors to match against.');
        return null;
      }

      let bestMatch: ErrorRecord | null = null;
      let highestScore = 0;

      for (const text of texts) {
        const { record, score } = this.scoreText(text, errors);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = record;
        }
      }

      logger.info(
        `Best match evaluation (${texts.length} candidate text(s)): ID ${bestMatch?.id} with score ${highestScore.toFixed(2)}/205`,
      );

      const threshold = settings.match_score_threshold;
      if (highestScore < threshold || !bestMatch) {
        logger.warn(`Highest score (${highestScore.toFixed(2)}) is below the required threshold of ${threshold}. Discarding match.`);
        return null;
      }

      const simulatedDistance = Math.max(0, 1 - highestScore / 100);
      return { record: bestMatch, score: simulatedDistance };
    } catch (err) {
      logger.error('Error during matching process:', err);
      return null;
    }
  }
}
