import type { AppRouteHandler } from "../../lib/types";
import type { TestRoute } from "./test.routes";

export const test: AppRouteHandler<TestRoute> = async (c) => {	
	return c.json({
		message: "Hello World, TEST UPDATED",
		success: true,
		data: "Hello World, TEST UPDATED",
	});
};
