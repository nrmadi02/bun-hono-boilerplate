import z from "zod";

export const policySchema = z.object({
  role: z.string().min(1, "Role is required"),
  object: z.string().min(1, "Object is required"),
  action: z.string().min(1, "Action is required"),
});

export const policyResponseSchema = z.object({
  policies: z.array(z.array(z.string())),
  groupingPolicies: z.array(z.array(z.string())),
});