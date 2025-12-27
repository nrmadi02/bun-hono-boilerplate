/**
 * Script to sync policies from CSV to Database
 * Run: bun run src/scripts/sync-policies.ts
 */

import prisma from "prisma";
import { syncCsvToDatabase } from "../lib/casbin";

async function main() {
	try {
		console.log("🚀 Starting policy sync...\n");

		// Show current database state
		const beforeCount = await prisma.casbinRule.count();
		console.log(`📊 Current policies in database: ${beforeCount}`);

		// Sync CSV to database
		await syncCsvToDatabase();

		// Show result
		const afterCount = await prisma.casbinRule.count();
		console.log(`📊 Policies after sync: ${afterCount}\n`);

		// Display all policies
		const allPolicies = await prisma.casbinRule.findMany({
			orderBy: { id: "asc" },
		});

		console.log("📋 All policies in database:");
		console.table(allPolicies);

		console.log("\n✅ Sync completed successfully!");
	} catch (error) {
		console.error("❌ Error syncing policies:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
