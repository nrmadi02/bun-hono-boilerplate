import {
	addPolicy,
	getAllPolicies,
	reloadPolicy,
	removePolicy,
} from "../../../lib/casbin";
import type { AppRouteHandler } from "../../../lib/types";
import {
	catchError,
	errorResponse,
	successResponse,
} from "../../../utils/response";
import type {
	AddPolicyRoute,
	GetAllPoliciesRoute,
	ReloadPoliciesRoute,
	RemovePolicyRoute,
} from "./policies.routes";

export const getAllPoliciesHandler: AppRouteHandler<
	GetAllPoliciesRoute
> = async (c) => {
	try {
		const result = await getAllPolicies();

		return successResponse(c, "Policies retrieved successfully", {
			policies: result,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const addPolicyHandler: AppRouteHandler<AddPolicyRoute> = async (c) => {
	try {
		const { role, object, action } = await c.req.json();

		const added = await addPolicy(role, object, action);

		if (!added) {
			return errorResponse(
				c,
				"Policy already exists",
				["Policy already exists"],
				400,
			);
		}

		return successResponse(c, "Policy added successfully", {
			added: true,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const removePolicyHandler: AppRouteHandler<RemovePolicyRoute> = async (
	c,
) => {
	try {
		const { role, object, action } = await c.req.json();

		const removed = await removePolicy(role, object, action);

		if (!removed) {
			return errorResponse(c, "Policy not found", ["Policy not found"], 404);
		}

		return successResponse(c, "Policy removed successfully", {
			success: true,
			removed: true,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const reloadPoliciesHandler: AppRouteHandler<
	ReloadPoliciesRoute
> = async (c) => {
	try {
		await reloadPolicy();

		return successResponse(c, "Policies reloaded successfully", {
			reloaded: true,
		});
	} catch (error) {
		return catchError(error);
	}
};
