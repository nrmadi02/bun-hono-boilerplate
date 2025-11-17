import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

const QUEUE = {
  email: 'email',
};

const connection = new IORedis({
  port: Number.parseInt(env.REDIS_PORT),
  host: env.REDIS_HOST,
  maxRetriesPerRequest: null,
});

const emailQueue = new Queue(QUEUE.email, {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600,
    },
    removeOnFail: {
      age: 24 * 3600,
    },
  },
});

export { connection, emailQueue, QUEUE };