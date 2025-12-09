import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { baseResponseSchema } from "../../../schemas/base.schema";
import { errorResponseOpenAPIObjectConfig } from "../../../lib/open-api";
import { validateToken } from "../../../middlewares/auth.middleware";
import { casbinMiddleware } from "../../../middlewares/casbin.middleware";

// Schema definitions
const roleAssignmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.string().min(1, "Role is required"),
});

// Assign role to user
export const assignRoleRoute = createRoute({
  path: "/admin/roles/assign",
  method: "post",
  tags: ["Admin - RBAC"],
  description: "Assign a role to user",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: roleAssignmentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Role assigned successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ assigned: z.boolean() })),
        },
      },
    },
    404: errorResponseOpenAPIObjectConfig("User not found"),
    400: errorResponseOpenAPIObjectConfig("Role already assigned"),
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    422: errorResponseOpenAPIObjectConfig("Validation error"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("roles", "assign")],
});

// Remove role from user
export const removeRoleRoute = createRoute({
  path: "/admin/roles/remove",
  method: "post",
  tags: ["Admin - RBAC"],
  description: "Remove a role from user",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: roleAssignmentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Role removed successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ removed: z.boolean() })),
        },
      },
    },
    404: errorResponseOpenAPIObjectConfig("Role assignment not found"),
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    422: errorResponseOpenAPIObjectConfig("Validation error"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("roles", "remove")],
});

// Get users with specific role
export const getRoleUsersRoute = createRoute({
  path: "/admin/roles/{role}/users",
  method: "get",
  tags: ["Admin - RBAC"],
  description: "Get all users with specific role",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      role: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Role users retrieved successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ users: z.array(z.string()) })),
        },
      },
    },
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("roles", "read")],
});

export type AssignRoleRoute = typeof assignRoleRoute;
export type RemoveRoleRoute = typeof removeRoleRoute;
export type GetRoleUsersRoute = typeof getRoleUsersRoute;

