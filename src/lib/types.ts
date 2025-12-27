import type { RouteConfig, RouteHandler, z } from "@hono/zod-openapi";
import type { AuthVariables } from "./create-app";

export type ZodSchema =
	| z.ZodUnion
	| z.ZodObject
	| z.ZodArray<z.ZodObject>
	| z.ZodBoolean
	| z.ZodString
	| z.ZodNumber
	| z.ZodDate
	| z.ZodNull
	| z.ZodUndefined
	| z.ZodAny;
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
	R,
	AuthVariables
>;
