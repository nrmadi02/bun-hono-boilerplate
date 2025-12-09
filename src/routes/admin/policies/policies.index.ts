import { createRouter } from "../../../lib/create-app";
import * as routes from "./policies.routes";
import * as handlers from "./policies.handlers";

const policies = createRouter();

policies.openapi(routes.getAllPoliciesRoute, handlers.getAllPoliciesHandler);
policies.openapi(routes.addPolicyRoute, handlers.addPolicyHandler);
policies.openapi(routes.removePolicyRoute, handlers.removePolicyHandler);
policies.openapi(routes.reloadPoliciesRoute, handlers.reloadPoliciesHandler);

export default policies;

