import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { baseResponseSchema } from "../../../schemas/base.schema";
import { errorResponseOpenAPIObjectConfig } from "../../../lib/open-api";
import { validateToken } from "../../../middlewares/auth.middleware";
import { casbinMiddleware } from "../../../middlewares/casbin.middleware";

// Schema definitions
const policySchema = z.object({
  role: z.string().min(1, "Role is required"),
  object: z.string().min(1, "Object is required"),
  action: z.string().min(1, "Action is required"),
});

const policyResponseSchema = z.object({
  policies: z.array(z.array(z.string())),
  groupingPolicies: z.array(z.array(z.string())),
});

// Get all policies
export const getAllPoliciesRoute = createRoute({
  path: "/admin/policies",
  method: "get",
  tags: ["Admin - Policies"],
  description: "Get all policies and role assignments",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "Policies retrieved successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(policyResponseSchema),
        },
      },
    },
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("policies", "read")],
});

// Add new policy
export const addPolicyRoute = createRoute({
  path: "/admin/policies",
  method: "post",
  tags: ["Admin - Policies"],
  description: "Add a new policy",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: policySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Policy added successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ added: z.boolean() })),
        },
      },
    },
    400: errorResponseOpenAPIObjectConfig("Policy already exists"),
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    422: errorResponseOpenAPIObjectConfig("Validation error"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("policies", "create")],
});

// Remove policy
export const removePolicyRoute = createRoute({
  path: "/admin/policies",
  method: "delete",
  tags: ["Admin - Policies"],
  description: "Remove a policy",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: policySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Policy removed successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ removed: z.boolean() })),
        },
      },
    },
    404: errorResponseOpenAPIObjectConfig("Policy not found"),
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    422: errorResponseOpenAPIObjectConfig("Validation error"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("policies", "delete")],
});

// Reload policies
export const reloadPoliciesRoute = createRoute({
  path: "/admin/policies/reload",
  method: "post",
  tags: ["Admin - Policies"],
  description: "Reload policies from source",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "Policies reloaded successfully",
      content: {
        "application/json": {
          schema: baseResponseSchema(z.object({ reloaded: z.boolean() })),
        },
      },
    },
    401: errorResponseOpenAPIObjectConfig("Unauthorized"),
    403: errorResponseOpenAPIObjectConfig("Forbidden"),
    500: errorResponseOpenAPIObjectConfig("Internal server error"),
  },
  middleware: [validateToken, casbinMiddleware("policies", "reload")],
});

export type GetAllPoliciesRoute = typeof getAllPoliciesRoute;
export type AddPolicyRoute = typeof addPolicyRoute;
export type RemovePolicyRoute = typeof removePolicyRoute;
export type ReloadPoliciesRoute = typeof reloadPoliciesRoute;

