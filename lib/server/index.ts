import { router } from './trpc';
import { authRouter } from './routers/auth';
import { integrationsRouter } from './routers/integrations';
import { dashboardRouter } from './routers/dashboard';

export const appRouter = router({
  auth: authRouter,
  integrations: integrationsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
