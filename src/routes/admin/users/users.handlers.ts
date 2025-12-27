import { CacheKeys, cache } from "../../../lib/cache";
import { getRolesForUser, reloadPolicy } from "../../../lib/casbin";
import type { AppRouteHandler } from "../../../lib/types";
import { userService } from "../../../services/users";
import {
	catchError,
	errorResponse,
	successResponse,
} from "../../../utils/response";
import type {
	GetListUserRoute,
	GetUserRolesRoute,
	UpdateUserRoleRoute,
} from "./users.routes";

export const getUserRolesHandler: AppRouteHandler<GetUserRolesRoute> = async (
	c,
) => {
	try {
		const { userId } = c.req.param();

		const user = await userService.findUserById(userId);
		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		const roles = await getRolesForUser(userId);

		return successResponse(c, "User roles retrieved successfully", {
			roles,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const updateUserRoleHandler: AppRouteHandler<
	UpdateUserRoleRoute
> = async (c) => {
	try {
		const { userId } = c.req.param();
		const { role } = await c.req.json();

		const user = await userService.findUserById(userId);

		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		await userService.updateUserRole(userId, role);

		await cache.delete(CacheKeys.user(userId));
		await cache.delete(CacheKeys.userRoles(userId));

		await reloadPolicy();

		return successResponse(c, "User role updated successfully", {
			updated: true,
			userId,
			newRole: role,
			cacheCleared: true,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const getListUserHandler: AppRouteHandler<GetListUserRoute> = async (
	c,
) => {
	try {
		const query = c.req.query();
		const limit = parseFloat(query.limit);
		const page = parseFloat(query.page);
		const [users, meta] = await userService.getListUser({ limit, page });
		return successResponse(c, "User list retrieved successfully", {
			list: users,
			meta,
		});
	} catch (error) {
		return catchError(error);
	}
};
