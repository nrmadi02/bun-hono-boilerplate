import { createRouter } from "../../../lib/create-app";
import * as handlers from "./policies.handlers";
import * as routes from "./policies.routes";

const policies = createRouter();

policies.openapi(routes.getAllPoliciesRoute, handlers.getAllPoliciesHandler);
policies.openapi(routes.addPolicyRoute, handlers.addPolicyHandler);
policies.openapi(routes.removePolicyRoute, handlers.removePolicyHandler);
policies.openapi(routes.reloadPoliciesRoute, handlers.reloadPoliciesHandler);

export default policies;
