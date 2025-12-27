import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import createApp from "./lib/create-app";
import configureOpenAPI from "./lib/open-api";
import admin from "./routes/admin/admin.index";
import auth from "./routes/auth/auth.index";
import authPage from "./routes/auth/auth.page";
import health from "./routes/health/health.index";
import test from "./routes/test/test.index";
import "./config/env";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { setupBullBoard } from "./lib/bull-board";

const app = createApp();
app.use(logger());
app.use(prettyJSON());
app.use(secureHeaders());

app.use("/api/*", cors());

app.use(
	"/static/*",
	serveStatic({
		root: "./",
		onFound: (_path, c) => {
			c.header("Cache-Control", "public, max-age=31536000, immutable");
		},
	}),
);

configureOpenAPI(app);
setupBullBoard(app);

const routes = [test, auth, admin, health] as const;
const pages = [authPage] as const;

routes.forEach((route) => {
	app.route("/api/v1", route);
});

pages.forEach((page) => {
	app.route("/", page);
});

export default app;
