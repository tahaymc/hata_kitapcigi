import { WAMessage, downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../logger';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const TEMP_DIR = path.resolve(process.cwd(), 'tmp');

export class ImageDownloaderService {
  static async init() {
    try {
      await fs.mkdir(TEMP_DIR, { recursive: true });
      logger.debug(`Temp directory ensured at: ${TEMP_DIR}`);
    } catch (error) {
      logger.error('Failed to create temp directory', error);
      throw error;
    }
  }

  static async downloadImage(msg: WAMessage, imageMessage: any, socket: any): Promise<string> {
    const size = Number(imageMessage.fileLength || 0);

    if (size > MAX_FILE_SIZE_BYTES) {
      logger.warn(`Media rejected: File size (${size} bytes) exceeds maximum limit (${MAX_FILE_SIZE_BYTES} bytes).`);
      throw new Error('FILE_TOO_LARGE');
    }

    const mimeType = imageMessage.mimetype || '';
    if (!mimeType.startsWith('image/')) {
      logger.warn(`Media rejected: Invalid mime type (${mimeType}). Expected image/*.`);
      throw new Error('INVALID_MEDIA_TYPE');
    }

    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        {
          logger: console as any,
          reuploadRequest: socket.updateMediaMessage,
        }
      );

      const ext = mimeType.split('/')[1]?.split(';')[0] || 'jpg';
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(TEMP_DIR, fileName);

      await fs.writeFile(filePath, buffer as Buffer);
      logger.info(`Image successfully saved to ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('Error downloading media message', error);
      throw error;
    }
  }
}
