import { createApp } from './app';
import { connectToWhatsApp, whatsappEvents } from './whatsapp/connection';
import { ImageDownloaderService } from './services/imageDownloader';
import { imageQueue } from './queues/imageQueue';
import { startImageWorker } from './workers/imageWorker';
import { startAdminServer } from './admin/server';
import { startHeartbeat } from './services/heartbeat';
import { getSettings } from './services/settingsClient';
import { logger } from './logger';
import { config } from './config/env';

const startServer = async () => {
  try {
    // 1. Public health Express
    const app = createApp();
    app.listen(config.port, () => {
      logger.info(`Express health server running on :${config.port} (${config.nodeEnv})`);
    });

    // 2. Bot admin HTTP (token-protected, used by the main site)
    startAdminServer();

    // 3. Filesystem prep
    await ImageDownloaderService.init();

    // 4. Pull initial settings (don't fail boot if site is unreachable)
    await getSettings(true).catch(() => logger.warn('Initial settings fetch failed; using defaults.'));

    // 5. Start WhatsApp
    await connectToWhatsApp();

    // 6. Wire incoming images to the queue
    whatsappEvents.on('image-received', async ({ msg, remoteJid, imageMessage }) => {
      try {
        logger.info(`Received image from ${remoteJid}. Queueing pipeline job.`);
        await imageQueue.add('process-image-pipeline', { remoteJid, msg, imageMessage });
      } catch (error: any) {
        logger.error(`Error adding image to queue for ${remoteJid}:`, error);
      }
    });

    // 7. Worker
    startImageWorker();

    // 8. Periodic heartbeat to the main site
    startHeartbeat();
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
