import { serve } from "bun";
import prisma from "../prisma";
import app from "./app";
import { registerAllWorkers, shutdownAllWorkers } from "./tasks";

const port = process.env.PORT || 3000;

console.log(`Server running on port ${port}`);

const handleShutdown = async (signal: NodeJS.Signals) => {
	console.info(`${signal} signal received`);
	console.info("🛑 Shutting down gracefully...");

	try {
		// shutdownAllWorkers() already closes Redis connection
		await shutdownAllWorkers();
		console.info("✅ Workers and Redis shut down successfully");

		await prisma.$disconnect();
		console.info("✅ Database disconnected");

		console.info("✅ Graceful shutdown complete");
	} catch (error) {
		console.error("❌ Error during shutdown:", error);
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
