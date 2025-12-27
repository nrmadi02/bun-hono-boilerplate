import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { errorResponseOpenAPIObjectConfig } from "../../../lib/open-api";
import { validateToken } from "../../../middlewares/auth.middleware";
import { casbinMiddleware } from "../../../middlewares/casbin.middleware";
import {
	basePaginationResponseSchema,
	baseResponseSchema,
} from "../../../schemas/base.schema";
import { userResponseSchema } from "../../../schemas/user/user-response.schema";

export const getUserRolesRoute = createRoute({
	path: "/admin/users/{userId}/roles",
	method: "get",
	tags: ["Admin - Users"],
	description: "Get roles for a specific user",
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			userId: z.string().uuid(),
		}),
	},
	responses: {
		200: {
			description: "User roles retrieved successfully",
			content: {
				"application/json": {
					schema: baseResponseSchema(z.object({ roles: z.array(z.string()) })),
				},
			},
		},
		401: errorResponseOpenAPIObjectConfig("Unauthorized"),
		403: errorResponseOpenAPIObjectConfig("Forbidden"),
		404: errorResponseOpenAPIObjectConfig("User not found"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateToken, casbinMiddleware("users", "read")],
});

export const getListUserRoute = createRoute({
	path: "/admin/users",
	method: "get",
	tags: ["Admin - Users"],
	description: "Get list of users",
	security: [{ Bearer: [] }],
	request: {
		query: z.object({
			limit: z.number(),
			page: z.number(),
		}),
	},
	responses: {
		200: {
			description: "User list retrieved successfully",
			content: {
				"application/json": {
					schema: basePaginationResponseSchema(userResponseSchema),
				},
			},
		},
		401: errorResponseOpenAPIObjectConfig("Unauthorized"),
		403: errorResponseOpenAPIObjectConfig("Forbidden"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateToken, casbinMiddleware("users", "read")],
});

export const updateUserRoleRoute = createRoute({
	path: "/admin/users/{userId}/role",
	method: "put",
	tags: ["Admin - Users"],
	description: "Update user role and invalidate cache automatically",
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			userId: z.string().uuid("Invalid user ID"),
		}),
		body: {
			content: {
				"application/json": {
					schema: z.object({
						role: z.string().min(1, "Role is required"),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "User role updated successfully",
			content: {
				"application/json": {
					schema: baseResponseSchema(
						z.object({
							updated: z.boolean(),
							userId: z.string(),
							newRole: z.string(),
							cacheCleared: z.boolean(),
						}),
					),
				},
			},
		},
		404: errorResponseOpenAPIObjectConfig("User not found"),
		401: errorResponseOpenAPIObjectConfig("Unauthorized"),
		403: errorResponseOpenAPIObjectConfig("Forbidden"),
		422: errorResponseOpenAPIObjectConfig("Validation error"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateToken, casbinMiddleware("users", "update")],
});

export type GetUserRolesRoute = typeof getUserRolesRoute;
export type UpdateUserRoleRoute = typeof updateUserRoleRoute;
export type GetListUserRoute = typeof getListUserRoute;
