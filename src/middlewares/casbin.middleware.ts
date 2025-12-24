import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { errorResponse } from "../utils/response";
import { authService } from "../services/auth";
import { getEnforcer } from "../lib/casbin";
import { cache, CacheKeys } from "../lib/cache";
import type { User } from "../../prisma/generated/client";

export const casbinMiddleware = (object: string, action: string) => createMiddleware<{
  Variables: {
    userId: string
  }
}> (async (
	c: Context,
  next: Next
) => {
	try {
		const userId = c.var.userId;
	if (!userId) {
		return errorResponse(c, "Unauthorized", ["Unauthorized"], 401);
	}

	let user = await cache.get<User>(CacheKeys.user(userId));

	if (!user) {
		user = await authService.findUserById(userId);

		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		await cache.set(CacheKeys.user(userId), user, 300);
	}

  const e = await getEnforcer(); 
  const isAllowed = await e.enforce(user.role, object, action);

  if (!isAllowed) {
    console.warn(`Access denied: User ${user.email} (${user.role}) tried to ${action} on ${object}`);
    return errorResponse(c, "Forbidden", ["You don't have permission to access this resource"], 403);
  }

  await next();
	} catch  {
		return errorResponse(c, "Internal server error", ["Authorization failed"], 500);
	}
});
