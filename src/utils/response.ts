import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const catchError = (error: unknown) => {
	if (error instanceof HTTPException) {
		throw error;
	}
	throw new HTTPException(500, error as Error);
};

export const successResponse = <T, S extends ContentfulStatusCode = 200>(
	c: Context,
	message: string,
	data: T,
	status?: S,
) => {
	const resolvedStatus = (status ?? 200) as S;
	return c.json(
		{
			message,
			success: true,
			data,
		},
		resolvedStatus,
	);
};

export const errorResponse = <S extends ContentfulStatusCode = 400>(
	c: Context,
	message: string,
	errors: string[],
	status?: S,
) => {
	const resolvedStatus = (status ?? 400) as S;
	return c.json(
		{
			message,
			success: false,
			errors,
		},
		resolvedStatus,
	);
};
