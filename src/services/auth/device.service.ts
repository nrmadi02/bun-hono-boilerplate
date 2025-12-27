import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { UAParser } from "ua-parser-js";

export interface DeviceInfo {
	deviceName: string;
	ipAddress: string;
	userAgent: string;
}

export const getDeviceInfo = (c: Context): DeviceInfo => {
	const userAgent = c.req.header("user-agent") || "Unknown";

	let ipAddress = "Unknown";
	try {
		const connInfo = getConnInfo(c);
		ipAddress = connInfo.remote.address ?? "Unknown";
	} catch (error) {
		console.error("Failed to get connection info:", error);
		ipAddress = "127.0.0.1";
	}

	const parser = new UAParser(userAgent);
	const result = parser.getResult();

	return {
		deviceName: result.os.name ?? "Unknown",
		ipAddress,
		userAgent,
	};
};
