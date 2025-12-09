import type { AppRouteHandler } from "../../../lib/types";
import type {
  GetAllPoliciesRoute,
  AddPolicyRoute,
  RemovePolicyRoute,
  ReloadPoliciesRoute,
} from "./policies.routes";
import {
  getAllPolicies,
  addPolicy,
  removePolicy,
  reloadPolicy,
} from "../../../lib/casbin";
import { catchError, errorResponse } from "../../../utils/response";

// Get all policies
export const getAllPoliciesHandler: AppRouteHandler<GetAllPoliciesRoute> = async (c) => {
  try {
    const result = await getAllPolicies();
    
    return c.json({
      success: true,
      message: "Policies retrieved successfully",
      data: result,
    });
  } catch (error) {
    return catchError(error);
  }
};

// Add new policy
export const addPolicyHandler: AppRouteHandler<AddPolicyRoute> = async (c) => {
  try {
    const { role, object, action } = await c.req.json();
    
    const added = await addPolicy(role, object, action);
    
    if (!added) {
      return errorResponse(c, "Policy already exists", ["Policy already exists"], 400);
    }
    
    return c.json({
      success: true,
      message: "Policy added successfully",
      data: { added: true },
    });
  } catch (error) {
    return catchError(error);
  }
};

// Remove policy
export const removePolicyHandler: AppRouteHandler<RemovePolicyRoute> = async (c) => {
  try {
    const { role, object, action } = await c.req.json();
    
    const removed = await removePolicy(role, object, action);
    
    if (!removed) {
      return errorResponse(c, "Policy not found", ["Policy not found"], 404);
    }
    
    return c.json({
      success: true,
      message: "Policy removed successfully",
      data: { removed: true },
    });
  } catch (error) {
    return catchError(error);
  }
};

// Reload policies
export const reloadPoliciesHandler: AppRouteHandler<ReloadPoliciesRoute> = async (c) => {
  try {
    await reloadPolicy();
    
    return c.json({
      success: true,
      message: "Policies reloaded successfully",
      data: { reloaded: true },
    });
  } catch (error: any) {
    return catchError(error);
  }
};

