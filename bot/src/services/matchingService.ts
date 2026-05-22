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
   * Pulls all errors from the site API and scores them against the OCR text.
   */
  static async findBestMatch(ocrText: string): Promise<{ record: ErrorRecord; score: number } | null> {
    try {
      if (!ocrText || ocrText.length < 5) {
        logger.warn('OCR text is too short to perform a meaningful search.');
        return null;
      }

      const settings = await getSettings();
      const errors = await apiClient.getAllErrors();

      if (!errors || errors.length === 0) {
        logger.warn('No records returned from /api/errors to match against.');
        return null;
      }

      const rawOcrUpper = ocrText.toUpperCase();
      const normalizedOcr = this.normalizeTextForSearch(ocrText);
      const ocrWords = new Set(normalizedOcr.split(' ').filter((w) => w.length > 2));

      let bestMatch: ErrorRecord | null = null;
      let highestScore = 0;

      for (const error of errors) {
        let currentScore = 0;

        if (error.code && error.code.length > 2) {
          if (rawOcrUpper.includes(error.code.toUpperCase())) {
            currentScore += 100;
          }
        }

        if (error.title) {
          const titleWords = this.normalizeTextForSearch(error.title).split(' ').filter((w) => w.length > 2);
          if (titleWords.length > 0) {
            let matchedWords = 0;
            for (const word of titleWords) {
              if (ocrWords.has(word) || normalizedOcr.includes(word)) matchedWords++;
            }
            currentScore += (matchedWords / titleWords.length) * 50;
          }
        }

        if (error.summary) {
          const summaryWords = this.normalizeTextForSearch(error.summary).split(' ').filter((w) => w.length > 3);
          if (summaryWords.length > 0) {
            let matchedWords = 0;
            for (const word of summaryWords) {
              if (ocrWords.has(word) || normalizedOcr.includes(word)) matchedWords++;
            }
            currentScore += (matchedWords / summaryWords.length) * 30;
          }
        }

        if (currentScore > highestScore) {
          highestScore = currentScore;
          bestMatch = error;
        }
      }

      logger.info(`Best match evaluation: ID ${bestMatch?.id} with score ${highestScore.toFixed(2)}/180`);

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
