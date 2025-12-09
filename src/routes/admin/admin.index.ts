import { createRouter } from "../../lib/create-app";
import policiesRouter from "./policies/policies.index";
import rbacRouter from "./rbac/rbac.index";
import usersRouter from "./users/users.index";
import cacheRouter from "./cache/cache.index";

const admin = createRouter();

// Policies routes
admin.route("/", policiesRouter);

// RBAC routes
admin.route("/", rbacRouter);

// Users routes
admin.route("/", usersRouter);

// Cache management routes
admin.route("/", cacheRouter);

export default admin;

