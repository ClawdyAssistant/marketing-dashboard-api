import { router } from './trpc';
import { authRouter } from './routers/auth';
import { integrationsRouter } from './routers/integrations';
import { dashboardRouter } from './routers/dashboard';
import { reportsRouter } from './routers/reports';

export const appRouter = router({
  auth: authRouter,
  integrations: integrationsRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
