import { serve } from "bun";
import app from "./app";
import { registerAllWorkers, shutdownAllWorkers } from "./tasks";

const port = process.env.PORT || 3000;

console.log(`Server running on port ${port}`);

const handleShutdown = async (signal: NodeJS.Signals) => {
	console.info(`${signal} signal received`);
	try {
		await shutdownAllWorkers();
	} catch (error) {
		console.error("[shutdown] Failed to cleanup worker:", error);
	} finally {
		process.exit(0);
	}
};

process.once("SIGTERM", () => {
	void handleShutdown("SIGTERM");
});
process.once("SIGINT", () => {
	void handleShutdown("SIGINT");
});

void registerAllWorkers().catch((error) => {
	console.error("[worker] Failed to start worker on boot:", error);
});

serve({ fetch: app.fetch, port });
