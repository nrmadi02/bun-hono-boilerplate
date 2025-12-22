import z from "zod";

export const roleAssignmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.string().min(1, "Role is required"),
});