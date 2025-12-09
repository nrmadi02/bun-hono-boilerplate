import { createRouter } from "../../../lib/create-app";
import * as routes from "./rbac.routes";
import * as handlers from "./rbac.handlers";

const rbac = createRouter();

rbac.openapi(routes.assignRoleRoute, handlers.assignRoleHandler);
rbac.openapi(routes.removeRoleRoute, handlers.removeRoleHandler);
rbac.openapi(routes.getRoleUsersRoute, handlers.getRoleUsersHandler);

export default rbac;

