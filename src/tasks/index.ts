import { connection } from "../lib/queue";
import { registerWorkerEmail, shutdownWorkerEmail } from "./email/tasker";

const registerFns = [registerWorkerEmail];

const shutdownFns = [shutdownWorkerEmail];

export const registerAllWorkers = async () => {
	if (process.env.NODE_ENV === "test") {
		console.log("🧪 Test environment: Workers not started");
		return;
	}

	await Promise.all(registerFns.map((fn) => fn()));
};

export const shutdownAllWorkers = async () => {
	for (const shutdownFn of shutdownFns) {
		try {
			await shutdownFn();
		} catch (error) {
			console.error("[worker] Failed to shutdown worker:", error);
		}
	}
	await connection.quit();
};
