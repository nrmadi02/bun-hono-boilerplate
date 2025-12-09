import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { baseResponseSchema } from "../../../schemas/base.schema";
import { errorResponseOpenAPIObjectConfig } from "../../../lib/open-api";
import { validateToken } from "../../../middlewares/auth.middleware";
import { casbinMiddleware } from "../../../middlewares/casbin.middleware";

// Clear all cache
export const clearCacheRoute = createRoute({
  path: "/admin/cache/clear",
  method: "post",
  tags: ["Admin - Cache"],
  description: "Clear all cache (user cache, etc)",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "Cache cleared successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(
            z.object({
              cleared: z.boolean(),
              message: z.string(),
            })
          ),
        },
      },
    },
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("cache", "clear")],
});

// Clear specific user cache
export const clearUserCacheRoute = createRoute({
  path: "/admin/cache/users/{userId}",
  method: "delete",
  tags: ["Admin - Cache"],
  description: "Clear cache for specific user",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: z.string().uuid("Invalid user ID"),
    }),
  },
  responses: {
    200: {
      description: "User cache cleared successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(
            z.object({
              cleared: z.boolean(),
              userId: z.string(),
            })
          ),
        },
      },
    },
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("cache", "clear")],
});

// Get cache stats
export const getCacheStatsRoute = createRoute({
  path: "/admin/cache/stats",
  method: "get",
  tags: ["Admin - Cache"],
  description: "Get cache statistics",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "Cache stats retrieved successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(
            z.object({
              size: z.number(),
              keys: z.array(z.string()),
            })
          ),
        },
      },
    },
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("cache", "read")],
});

export type ClearCacheRoute = typeof clearCacheRoute;
export type ClearUserCacheRoute = typeof clearUserCacheRoute;
export type GetCacheStatsRoute = typeof getCacheStatsRoute;

