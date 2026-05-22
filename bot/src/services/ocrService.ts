import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import { logger } from '../logger';

export interface OcrResult {
  text: string;
  confidence: number;
}

export class OcrService {
  static async extractText(imagePath: string, languages: string = 'eng+tur'): Promise<OcrResult> {
    const processedImagePath = `${imagePath}_processed.png`;

    try {
      logger.info(`Starting OCR process for image: ${imagePath}`);

      await sharp(imagePath)
        .grayscale()
        .normalize()
        .toFile(processedImagePath);

      logger.debug(`Image preprocessed successfully: ${processedImagePath}`);

      const result = await Tesseract.recognize(processedImagePath, languages, {
        logger: (m) => logger.debug(`OCR Progress: ${m.status} ${Math.round(m.progress * 100)}%`),
      });

      const rawText = result.data.text;
      const confidence = result.data.confidence;

      const normalizedText = rawText
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      logger.info(`OCR successfully extracted ${normalizedText.length} characters with ${confidence}% confidence.`);
      logger.debug(`Normalized OCR Text: \n${normalizedText}`);

      return { text: normalizedText, confidence };
    } catch (error) {
      logger.error(`OCR processing failed for ${imagePath}:`, error);
      throw error;
    } finally {
      try {
        await fs.unlink(processedImagePath);
        logger.debug(`Cleaned up processed temp file: ${processedImagePath}`);
      } catch (err) {
        // ignore
      }
    }
  }
}
