import type { AppRouteHandler } from "../../../lib/types";
import type {
  ClearCacheRoute,
  ClearUserCacheRoute,
  GetCacheStatsRoute,
} from "./cache.routes";
import { cache, CacheKeys } from "../../../lib/cache";
import { reloadPolicy } from "../../../lib/casbin";
import { catchError } from "../../../utils/response";

// Clear all cache
export const clearCacheHandler: AppRouteHandler<ClearCacheRoute> = async (c) => {
  try {
    cache.clear();
    
    // Also reload Casbin policy
    await reloadPolicy();
    
    return c.json({
      success: true,
      message: "All cache cleared and policies reloaded",
      data: {
        cleared: true,
        message: "Cache and policies cleared successfully",
      },
    });
  } catch (error) {
    return catchError(error);
  }
};

// Clear specific user cache
export const clearUserCacheHandler: AppRouteHandler<ClearUserCacheRoute> = async (c) => {
  try {
    const { userId } = c.req.param();
    
    // Delete user cache
    cache.delete(CacheKeys.user(userId));
    cache.delete(CacheKeys.userRoles(userId));

    // Reload policies
    await reloadPolicy();
    
    return c.json({
      success: true,
      message: "User cache cleared successfully",
      data: {
        cleared: true,
        userId,
      },
    });
  } catch (error) {
    return catchError(error);
  }
};

// Get cache stats
export const getCacheStatsHandler: AppRouteHandler<GetCacheStatsRoute> = async (c) => {
  try {
    const stats = cache.stats();
    
    return c.json({
      success: true,
      message: "Cache stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    return catchError(error);
  }
};

