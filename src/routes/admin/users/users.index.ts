import { createRouter } from "../../../lib/create-app";
import * as routes from "./users.routes";
import * as handlers from "./users.handlers";

const users = createRouter();

users.openapi(routes.getUserRolesRoute, handlers.getUserRolesHandler);
users.openapi(routes.updateUserRoleRoute, handlers.updateUserRoleHandler);

export default users;

