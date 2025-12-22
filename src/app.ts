import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import createApp from "./lib/create-app";
import configureOpenAPI from "./lib/open-api";
import auth from "./routes/auth/auth.index";
import authPage from "./routes/auth/auth.page";
import test from "./routes/test/test.index";
import admin from "./routes/admin/admin.index";
import health from "./routes/health/health.index";
import "./config/env";
import { prettyJSON } from "hono/pretty-json";
import { setupBullBoard } from "./lib/bull-board";
import { registerWorkerEmail } from "./tasks/email/tasker";
import { apiLimiter, adminLimiter } from "./middlewares/rate-limit.middleware";
import { secureHeaders } from 'hono/secure-headers'

const app = createApp();
app.use(logger());
app.use(prettyJSON());
app.use(secureHeaders())

app.use("/api/*", cors());

app.use("/api/*", apiLimiter);
app.use("/api/v1/admin/*", adminLimiter);

app.use("/static/*", serveStatic({ root: "./", onFound: (path, c) => {
	c.header("Cache-Control", "public, max-age=31536000, immutable");
} }));

configureOpenAPI(app);
setupBullBoard(app);

registerWorkerEmail();

const routes = [test, auth, admin, health] as const;
const pages = [authPage] as const;

routes.forEach((route) => {
	app.route("/api/v1", route);
});

pages.forEach((page) => {
	app.route("/", page);
});

export default app;
