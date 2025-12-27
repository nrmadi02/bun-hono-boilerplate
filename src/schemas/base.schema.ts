import z from "zod";
import type { ZodSchema } from "../lib/types";

export const idParamsSchema = z.object({
	id: z.string().min(3),
});

export const createMessageObjectSchema = () => {
	return z.object({
		message: z.string(),
		success: z.boolean(),
		errors: z.array(z.string()).optional(),
	});
};

export const baseResponseSchema = (data: ZodSchema) => {
	return z.object({
		message: z.string(),
		success: z.boolean(),
		data: data,
	});
};

export const basePaginationResponseSchema = (data: ZodSchema) => {
	return z.object({
		message: z.string(),
		success: z.boolean(),
		data: z.object({
			list: data,
			meta: z.object({
				currentPage: z.number(),
				isFirstPage: z.boolean(),
				isLastPage: z.boolean(),
				previousPage: z.number().nullable(),
				nextPage: z.number().nullable(),
				pageCount: z.number(),
				totalCount: z.number(),
			}),
		}),
	});
};

export const createErrorSchema = () => {
	return z.object({
		message: z.string(),
		success: z.boolean(),
		errors: z.array(z.string()).optional(),
	});
};
