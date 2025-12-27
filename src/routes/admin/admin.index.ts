import { createRouter } from "../../lib/create-app";
import cacheRouter from "./cache/cache.index";
import policiesRouter from "./policies/policies.index";
import rbacRouter from "./rbac/rbac.index";
import usersRouter from "./users/users.index";

const admin = createRouter();

admin.route("/", policiesRouter);
admin.route("/", rbacRouter);
admin.route("/", usersRouter);
admin.route("/", cacheRouter);

export default admin;
