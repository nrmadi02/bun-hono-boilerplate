import { cors } from "hono/cors";
import { logger } from "hono/logger";
import createApp from "./lib/create-app";
import configureOpenAPI from "./lib/open-api";
import auth from "./routes/auth/auth.index";
import test from "./routes/test/test.index";
import "./config/env";
import { prettyJSON } from "hono/pretty-json";

const app = createApp();
app.use(logger());
app.use(prettyJSON());
app.use("/api/*", cors());

configureOpenAPI(app);

const routes = [test, auth] as const;

routes.forEach((route) => {
	app.route("/api/v1", route);
});

export default app;
