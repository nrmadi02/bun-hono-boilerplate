import type { AppRouteHandler } from "../../../lib/types";
import type {
  GetUserRolesRoute,
  UpdateUserRoleRoute,
} from "./users.routes";
import { getRolesForUser } from "../../../lib/casbin";
import { catchError, errorResponse } from "../../../utils/response";
import { authService } from "../../../services/auth";
import { cache, CacheKeys } from "../../../lib/cache";
import { reloadPolicy } from "../../../lib/casbin";
import prisma from "prisma";

// Get user roles
export const getUserRolesHandler: AppRouteHandler<GetUserRolesRoute> = async (c) => {
  try {
    const { userId } = c.req.param();
    
    // Verify user exists
    const user = await authService.findUserById(userId);
    if (!user) {
      return errorResponse(c, "User not found", ["User not found"], 404);
    }
    
    const roles = await getRolesForUser(userId);
    
    return c.json({
      success: true,
      message: "User roles retrieved successfully",
      data: { roles },
    });
  } catch (error) {
    return catchError(error);
  }
};

// Update user role with auto cache invalidation
export const updateUserRoleHandler: AppRouteHandler<UpdateUserRoleRoute> = async (c) => {
  try {
    const { userId } = c.req.param();
    const { role } = await c.req.json();
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return errorResponse(c, "User not found", ["User not found"], 404);
    }
    
    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    
    // Clear user cache (important!)
    cache.delete(CacheKeys.user(userId));
    cache.delete(CacheKeys.userRoles(userId));

    // Reload policies
    await reloadPolicy();
    
    console.log(`✅ User ${user.email} role updated: ${user.role} → ${role} (cache cleared)`);
    
    return c.json({
      success: true,
      message: "User role updated successfully. Cache cleared, changes will take effect immediately.",
      data: {
        updated: true,
        userId,
        newRole: role,
        cacheCleared: true,
      },
    });
  } catch (error) {
    return catchError(error);
  }
};

