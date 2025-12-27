import type { User } from "prisma/generated/client";
import z from "zod";

export const userResponseSchema = z.object({
	id: z.string(),
	username: z.string(),
	fullName: z.string(),
	email: z.string(),
	role: z.string(),
	emailVerified: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const toUserResponseSchema = (user?: User) => {
	return userResponseSchema.parse(user);
};
