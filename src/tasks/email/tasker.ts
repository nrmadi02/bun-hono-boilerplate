import { connection, emailQueue } from "../../lib/queue";
import { createWorkerManager } from "../worker-factory";
import { emailWorkerProcessor } from "./processor";

const { register, shutdown } = createWorkerManager({
	queueName: emailQueue.name,
	processor: emailWorkerProcessor,
	connection,
	label: "email",
	concurrency: 1,
	limiter: {
		max: 2,
		duration: 1000,
	},
});

export const registerWorkerEmail = register;
export const shutdownWorkerEmail = shutdown;
