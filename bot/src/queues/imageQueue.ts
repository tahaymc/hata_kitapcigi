import { Queue } from 'bullmq';
import { config } from '../config/env';

export const QUEUE_NAME = 'image-processing-queue';

export const imageQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    tls: config.redis.tls,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
