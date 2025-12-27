import { CacheKeys, cache } from "../../../lib/cache";
import { reloadPolicy } from "../../../lib/casbin";
import type { AppRouteHandler } from "../../../lib/types";
import { catchError, successResponse } from "../../../utils/response";
import type {
	ClearCacheRoute,
	ClearUserCacheRoute,
	GetCacheStatsRoute,
} from "./cache.routes";

export const clearCacheHandler: AppRouteHandler<ClearCacheRoute> = async (
	c,
) => {
	try {
		await cache.clear();
		await reloadPolicy();

		return successResponse(c, "All cache cleared and policies reloaded", {
			cleared: true,
			message: "Cache and policies cleared successfully",
		});
	} catch (error) {
		return catchError(error);
	}
};

export const clearUserCacheHandler: AppRouteHandler<
	ClearUserCacheRoute
> = async (c) => {
	try {
		const { userId } = c.req.param();

		await cache.delete(CacheKeys.user(userId));
		await cache.delete(CacheKeys.userRoles(userId));

		return successResponse(c, "User cache cleared successfully", {
			cleared: true,
			userId,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const getCacheStatsHandler: AppRouteHandler<GetCacheStatsRoute> = async (
	c,
) => {
	try {
		const stats = await cache.stats();

		return successResponse(c, "Cache stats retrieved successfully", stats);
	} catch (error) {
		return catchError(error);
	}
};
