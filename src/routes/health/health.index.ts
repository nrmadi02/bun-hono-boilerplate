import { createRouter } from "../../lib/create-app";
import * as handlers from "./health.handlers";
import * as routes from "./health.routes";

const router = createRouter()
	.openapi(routes.healthRoute, handlers.healthHandler)
	.openapi(routes.readinessRoute, handlers.readinessHandler)
	.openapi(routes.livenessRoute, handlers.livenessHandler)
	.openapi(routes.metricsRoute, handlers.metricsHandler);

export default router;

