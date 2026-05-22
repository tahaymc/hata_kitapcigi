import { Job } from 'bullmq';
import fs from 'fs/promises';
import { getSocket } from '../whatsapp/connection';
import { ImageDownloaderService } from './imageDownloader';
import { DuplicateDetectionService } from './duplicateDetection';
import { OcrService } from './ocrService';
import { MatchingService } from './matchingService';
import { MessageFormatterService } from './messageFormatter';
import { apiClient } from './apiClient';
import { getSettings } from './settingsClient';
import { incStat } from '../state';
import { logger } from '../logger';

export class PipelineService {
  static async execute(job: Job) {
    const { remoteJid, msg, imageMessage } = job.data;
    const socket = getSocket();
    let localPath: string | null = null;

    const settings = await getSettings();

    try {
      if (!socket) throw new Error('WhatsApp socket is not connected');

      if (!settings.enabled) {
        logger.info(`[Job ${job.id}] Bot disabled in settings, skipping.`);
        return { status: 'ignored', reason: 'bot_disabled' };
      }

      // Allow/Block list (number prefix match — "905..." style remoteJids)
      const number = (remoteJid || '').split('@')[0];
      if (settings.blocklist.length > 0 && settings.blocklist.some((p) => number.startsWith(p))) {
        logger.info(`[Job ${job.id}] Blocked sender ${number}`);
        return { status: 'ignored', reason: 'blocked' };
      }
      if (settings.allowlist.length > 0 && !settings.allowlist.some((p) => number.startsWith(p))) {
        logger.info(`[Job ${job.id}] Sender ${number} not on allowlist`);
        return { status: 'ignored', reason: 'not_in_allowlist' };
      }

      // 1. Image Download
      await job.updateProgress(10);
      logger.info(`[Job ${job.id}] Step 1: Downloading image for ${remoteJid}`);
      localPath = await ImageDownloaderService.downloadImage(msg, imageMessage, socket);

      // 2. Duplicate Hash Check
      await job.updateProgress(30);
      logger.info(`[Job ${job.id}] Step 2: Checking duplicate hash`);
      const isDuplicate = await DuplicateDetectionService.checkDuplicate(localPath, remoteJid);
      if (isDuplicate) {
        incStat('duplicates');
        await job.updateProgress(100);
        return { status: 'ignored', reason: 'duplicate' };
      }

      // 3. OCR
      await job.updateProgress(50);
      logger.info(`[Job ${job.id}] Step 3: Running OCR (${settings.ocr_languages})`);
      const ocrResult = await OcrService.extractText(localPath, settings.ocr_languages);

      if (ocrResult.confidence < settings.confidence_threshold) {
        logger.warn(`[Job ${job.id}] OCR confidence too low (${ocrResult.confidence}%). Sending fallback.`);
        await socket.sendMessage(remoteJid, { text: MessageFormatterService.formatFallbackMessage(settings) }, { quoted: msg });
        incStat('unmatched');
        await job.updateProgress(100);
        return { status: 'failed', reason: 'low_ocr_confidence' };
      }

      // 4. Match
      await job.updateProgress(70);
      logger.info(`[Job ${job.id}] Step 4: Matching against site /api/errors`);
      const matchResult = await MatchingService.findBestMatch(ocrResult.text);

      // 5. Reply
      await job.updateProgress(90);

      if (matchResult) {
        const responseText = MessageFormatterService.formatSuccessMessage(matchResult.record, matchResult.score);
        try {
          await socket.sendMessage(remoteJid, { text: responseText }, { quoted: msg });
        } catch (sendErr) {
          logger.error(`[Job ${job.id}] Failed to send main reply:`, sendErr);
        }

        if (matchResult.record.id != null) {
          apiClient.incrementViewCount(matchResult.record.id).catch(() => {});
        }

        incStat('matched');
      } else {
        const fallbackText = MessageFormatterService.formatFallbackMessage(settings);
        try {
          await socket.sendMessage(remoteJid, { text: fallbackText }, { quoted: msg });
        } catch (sendErr) {
          logger.error(`[Job ${job.id}] Failed to send fallback reply:`, sendErr);
        }
        incStat('unmatched');
      }

      incStat('imagesProcessed');
      await job.updateProgress(100);
      logger.info(`[Job ${job.id}] Pipeline execution completed successfully for ${remoteJid}`);
      return { status: 'completed', matched: !!matchResult };
    } catch (error: any) {
      logger.error(`[Job ${job.id}] Pipeline failed at processing stage:`, error);
      incStat('failed');

      if (error.message === 'FILE_TOO_LARGE' || error.message === 'INVALID_MEDIA_TYPE') {
        return { status: 'ignored', reason: 'invalid_media' };
      }

      if (socket) {
        try {
          await socket.sendMessage(remoteJid, { text: MessageFormatterService.formatErrorMessage(settings) }, { quoted: msg });
        } catch (replyErr) {
          logger.error(`[Job ${job.id}] Failed to send error fallback message:`, replyErr);
        }
      }

      throw error;
    } finally {
      if (localPath) {
        try {
          await fs.unlink(localPath);
        } catch (cleanupErr) {
          logger.error(`[Job ${job.id}] Failed to clean up temp file ${localPath}:`, cleanupErr);
        }
      }
    }
  }
}
