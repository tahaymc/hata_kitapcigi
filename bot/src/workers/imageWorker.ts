import { Worker, Job } from 'bullmq';
import { config } from '../config/env';
import { logger } from '../logger';
import { QUEUE_NAME } from '../queues/imageQueue';
import { PipelineService } from '../services/pipelineService';

export const startImageWorker = () => {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      logger.info(`[Worker] Started processing job ${job.id}`);
      return await PipelineService.execute(job);
    },
    {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        tls: config.redis.tls,
      },
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`[Worker] Job ${job.id} has completed successfully!`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job?.id} has failed with ${err.message}`);
  });

  worker.on('progress', (job, progress) => {
    logger.debug(`[Worker] Job ${job.id} is ${progress}% complete`);
  });

  logger.info('[Worker] Image processing pipeline worker started');
  return worker;
};
