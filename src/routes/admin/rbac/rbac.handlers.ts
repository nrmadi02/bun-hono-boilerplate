import {
	addRoleForUser,
	getUsersForRole,
	removeRoleForUser,
} from "../../../lib/casbin";
import type { AppRouteHandler } from "../../../lib/types";
import { userService } from "../../../services/users";
import {
	catchError,
	errorResponse,
	successResponse,
} from "../../../utils/response";
import type {
	AssignRoleRoute,
	GetRoleUsersRoute,
	RemoveRoleRoute,
} from "./rbac.routes";

export const assignRoleHandler: AppRouteHandler<AssignRoleRoute> = async (
	c,
) => {
	try {
		const { userId, role } = await c.req.json();

		const user = await userService.findUserById(userId);
		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		const assigned = await addRoleForUser(userId, role);

		if (!assigned) {
			return errorResponse(
				c,
				"Role already assigned",
				["Role already assigned to this user"],
				400,
			);
		}

		return successResponse(c, "Role assigned successfully", {
			assigned: true,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const removeRoleHandler: AppRouteHandler<RemoveRoleRoute> = async (
	c,
) => {
	try {
		const { userId, role } = await c.req.json();

		const removed = await removeRoleForUser(userId, role);

		if (!removed) {
			return errorResponse(
				c,
				"Role assignment not found",
				["Role assignment not found"],
				404,
			);
		}

		return successResponse(c, "Role removed successfully", {
			removed: true,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const getRoleUsersHandler: AppRouteHandler<GetRoleUsersRoute> = async (
	c,
) => {
	try {
		const { role } = c.req.param();

		const users = await getUsersForRole(role);

		return successResponse(c, "Role users retrieved successfully", {
			users,
		});
	} catch (error) {
		return catchError(error);
	}
};
