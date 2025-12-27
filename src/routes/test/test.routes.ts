import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { errorResponseOpenAPIObjectConfig } from "../../lib/open-api";
import { validateToken } from "../../middlewares/auth.middleware";
import { casbinMiddleware } from "../../middlewares/casbin.middleware";
import { baseResponseSchema } from "../../schemas/base.schema";

export const test = createRoute({
	path: "/test",
	method: "get",
	tags: ["Test"],
	responses: {
		200: {
			description: "Test route",
			content: {
				"application/json": {
					schema: baseResponseSchema(
						z.object({
							data: z.string(),
						}),
					),
				},
			},
		},
		404: errorResponseOpenAPIObjectConfig("User not found"),
		422: errorResponseOpenAPIObjectConfig("The validation error(s)"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateToken, casbinMiddleware("users", "update")],
});

export type TestRoute = typeof test;
