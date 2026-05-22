import { redis } from '../config/redis';
import { logger } from '../logger';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const hash = require('imghash');

const DUPLICATE_TTL_SECONDS = 30 * 60;

export class DuplicateDetectionService {
  /**
   * Generates a perceptual hash and checks if it exists in Redis.
   * Returns true if duplicate (already processed in the last 30 minutes).
   * No DB writes — duplicate state lives only in Redis.
   */
  static async checkDuplicate(imagePath: string, remoteJid: string): Promise<boolean> {
    try {
      const perceptualHash = await hash.hash(imagePath, 16);
      logger.debug(`Generated perceptual hash: ${perceptualHash}`);

      const redisKey = `image_hash:${perceptualHash}`;
      const existingHash = await redis.get(redisKey);

      if (existingHash) {
        logger.info(`Duplicate image detected for hash: ${perceptualHash}`);
        return true;
      }

      await redis.set(redisKey, remoteJid || 'processed', 'EX', DUPLICATE_TTL_SECONDS);
      return false;
    } catch (error) {
      logger.error('Error during duplicate detection:', error);
      return false;
    }
  }
}
