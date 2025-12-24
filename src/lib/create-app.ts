import { OpenAPIHono } from "@hono/zod-openapi";

import { config } from "dotenv";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { errorResponse } from "../utils/response";

config();

export type AuthVariables = {
  Variables: {
    userId?: string
    token?: string
    refreshToken?: string
  }
}

export function createRouter() {
	return new OpenAPIHono<AuthVariables>({
		strict: false,
		defaultHook: (result, c) => {
			if (!result.success) {
				return errorResponse(c, 'The validation error(s)', result.error.issues.map((err) => err.message), 422);
			}
		},
	});
}

export default function createApp() {
	const app = new OpenAPIHono<AuthVariables>({
		strict: false,
		defaultHook: (result, c) => {
			if (!result.success) {
				return errorResponse(c, 'The validation error(s)', result.error.issues.map((err) => err.message), 422);
			}
		},
	});

	app.notFound((c) => {
		return errorResponse(c, 'Not found', ['Not found'], 404);
	});

	app.onError((err, c) => {
		const currentStatus =
			"status" in err ? err.status : c.newResponse(null).status;
		const statusCode =
			currentStatus !== "OK" ? (currentStatus as ContentfulStatusCode) : 500;

		console.error(err);
		const env = process.env.NODE_ENV;
		return c.json(
			{
				message: err.message,
				success: false,
				errors: [err.message],
				stack: env === "production" ? undefined : err.stack,
			},
			statusCode,
		);
	});

	return app;
}
