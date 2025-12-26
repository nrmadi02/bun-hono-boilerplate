import { createRouter } from "../../lib/create-app";
import * as handlers from "./auth.handlers";
import * as routes from "./auth.routes";

const router = createRouter();

router.openapi(routes.registerRoutes, handlers.registerHandler);
router.openapi(routes.loginRoutes, handlers.loginHandler);
router.openapi(routes.refreshTokenRoutes, handlers.refreshTokenHandler);

router.openapi(routes.forgotPasswordRoutes, handlers.forgotPasswordHandler);
router.openapi(routes.resetPasswordRoutes, handlers.resetPasswordHandler);

router.openapi(routes.resendEmailVerificationRoutes, handlers.resendEmailVerificationHandler);
router.openapi(routes.verifyEmailRoutes, handlers.verifyEmailHandler);

router.openapi(routes.logoutRoutes, handlers.logoutHandler);
router.openapi(routes.getSessionsRoutes, handlers.getSessionsHandler);
router.openapi(routes.getMeRoutes, handlers.getMeHandler);

export default router;
