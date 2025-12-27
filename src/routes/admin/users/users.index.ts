import { createRouter } from "../../../lib/create-app";
import * as handlers from "./users.handlers";
import * as routes from "./users.routes";

const users = createRouter();

users.openapi(routes.getUserRolesRoute, handlers.getUserRolesHandler);
users.openapi(routes.updateUserRoleRoute, handlers.updateUserRoleHandler);
users.openapi(routes.getListUserRoute, handlers.getListUserHandler);

export default users;
