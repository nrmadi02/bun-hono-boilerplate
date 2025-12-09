import { createRouter } from "../../../lib/create-app";
import * as routes from "./cache.routes";
import * as handlers from "./cache.handlers";

const cache = createRouter();

cache.openapi(routes.clearCacheRoute, handlers.clearCacheHandler);
cache.openapi(routes.clearUserCacheRoute, handlers.clearUserCacheHandler);
cache.openapi(routes.getCacheStatsRoute, handlers.getCacheStatsHandler);

export default cache;

