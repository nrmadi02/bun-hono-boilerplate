import { pagination } from "prisma-extension-pagination";
import { PrismaClient } from "./generated/client";

const prismaWithPagination = new PrismaClient({
	log: ["query", "info", "warn", "error"],
}).$extends(pagination());

type ExtendedPrismaClient = typeof prismaWithPagination;

const globalForPrisma = globalThis as unknown as {
	prisma?: ExtendedPrismaClient;
};

export const prisma = globalForPrisma.prisma ?? prismaWithPagination;
if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export default prisma;
