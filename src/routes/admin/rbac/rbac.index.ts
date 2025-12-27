import { createRouter } from "../../../lib/create-app";
import * as handlers from "./rbac.handlers";
import * as routes from "./rbac.routes";

const rbac = createRouter();

rbac.openapi(routes.assignRoleRoute, handlers.assignRoleHandler);
rbac.openapi(routes.removeRoleRoute, handlers.removeRoleHandler);
rbac.openapi(routes.getRoleUsersRoute, handlers.getRoleUsersHandler);

export default rbac;
