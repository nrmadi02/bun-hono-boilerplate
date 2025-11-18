import type { Job, Processor } from "bullmq";
import { Worker } from "bullmq";
import type IORedis from "ioredis";

type WorkerManagerOptions = {
	queueName: string;
	processor: Processor<Job>;
	connection: IORedis;
	label?: string;
};

export const createWorkerManager = ({
	queueName,
	processor,
	connection,
	label = queueName,
}: WorkerManagerOptions) => {
	let workerInstance: Worker | null = null;
	let workerInitPromise: Promise<Worker> | null = null;

	const setupWorker = async () => {
		const worker = new Worker(queueName, processor, { connection });

		worker.on("completed", (job: Job) => {
			console.info(`[${label}] Job ${job.id} completed (${job.name})`);
		});

		worker.on("failed", (job: Job | undefined, error: Error) => {
			if (job) {
				console.error(
					`[${label}] Job ${job.id} failed (${job.name}): ${error.message}`,
				);
			} else {
				console.error(`[${label}] Job failed: ${error.message}`);
			}
		});

		worker.on("error", (err) => {
			console.error(`[${label}] Worker error:`, err);
		});

		return worker;
	};

	const register = async () => {
		if (workerInstance?.isRunning()) {
			return workerInstance;
		}

		if (!workerInitPromise) {
			workerInitPromise = setupWorker()
				.then((worker) => {
					workerInstance = worker;
					console.info(`[${label}] Worker is running`);
					return worker;
				})
				.catch((error) => {
					workerInitPromise = null;
					console.error(`[${label}] Failed to initialize worker:`, error);
					throw error;
				});
		}

		const worker = await workerInitPromise;
		workerInitPromise = null;
		return worker;
	};

	const shutdown = async () => {
		if (workerInstance) {
			await workerInstance.close();
			workerInstance = null;
			console.info(`[${label}] Worker closed`);
		}
	};

	return {
		register,
		shutdown,
	};
};
