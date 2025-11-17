import type { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { createErrorSchema } from "../schemas/base.schema";
import type { AuthVariables } from "./create-app";

export const openAPIObjectConfig = {
	openapi: "3.1.0",
	externalDocs: {
		description: "Find out more about Hono API",
		url: "https://www.hono.dev",
	},
	info: {
		version: "1.0.0",
		title: "Hono API",
	},
	tags: [
		{
			name: "Test",
			description: "Test routes",
		},
		{
			name: "Auth",
			description: "Auth routes",
		},
	],
};

export const errorResponseOpenAPIObjectConfig = (description: string) => {
	return {
		description,
		content: {
			"application/json": {
				schema: createErrorSchema(),
			},
		},
	};
};

export default function configureOpenAPI(app: OpenAPIHono<AuthVariables>) {
	app.doc31("/doc", openAPIObjectConfig);
	app.get(
		"/ui",
		Scalar({
			url: "/doc",
		}),
	);
}
