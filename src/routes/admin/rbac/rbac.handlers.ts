import type { AppRouteHandler } from "../../../lib/types";
import type {
  AssignRoleRoute,
  RemoveRoleRoute,
  GetRoleUsersRoute,
} from "./rbac.routes";
import {
  addRoleForUser,
  removeRoleForUser,
  getUsersForRole,
} from "../../../lib/casbin";
import { catchError, errorResponse } from "../../../utils/response";
import { authService } from "../../../services/auth";

// Assign role to user
export const assignRoleHandler: AppRouteHandler<AssignRoleRoute> = async (c) => {
  try {
    const { userId, role } = await c.req.json();
    
    // Verify user exists
    const user = await authService.findUserById(userId);
    if (!user) {
      return errorResponse(c, "User not found", ["User not found"], 404);
    }
    
    const assigned = await addRoleForUser(userId, role);
    
    if (!assigned) {
      return errorResponse(c, "Role already assigned", ["Role already assigned to this user"], 400);
    }
    
    return c.json({
      success: true,
      message: "Role assigned successfully",
      data: { assigned: true },
    });
  } catch (error) {
    return catchError(error);
  }
};

// Remove role from user
export const removeRoleHandler: AppRouteHandler<RemoveRoleRoute> = async (c) => {
  try {
    const { userId, role } = await c.req.json();
    
    const removed = await removeRoleForUser(userId, role);
    
    if (!removed) {
      return errorResponse(c, "Role assignment not found", ["Role assignment not found"], 404);
    }
    
    return c.json({
      success: true,
      message: "Role removed successfully",
      data: { removed: true },
    });
  } catch (error) {
      return catchError(error);
  }
};

// Get users with specific role
export const getRoleUsersHandler: AppRouteHandler<GetRoleUsersRoute> = async (c) => {
  try {
    const { role } = c.req.param();
    
    const users = await getUsersForRole(role);
    
    return c.json({
      success: true,
      message: "Role users retrieved successfully",
      data: { users },
    });
  } catch (error) {
    return catchError(error);
  }
};

