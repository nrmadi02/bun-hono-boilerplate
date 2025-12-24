import type { AppRouteHandler } from "../../lib/types";
import { errorResponse, successResponse } from "../../utils/response";
import type { TestRoute } from "./test.routes";

export const test: AppRouteHandler<TestRoute> = async (c) => {	
	try {
		return successResponse(c, "Hello World, TEST UPDATED", 200);
	} catch (error: any) {
		return errorResponse(c, "Internal server error", [error.message], 500);
	}
};
