import { router } from './trpc';
import { authRouter } from './routers/auth';
import { integrationsRouter } from './routers/integrations';
import { dashboardRouter } from './routers/dashboard';
import { reportsRouter } from './routers/reports';
import { billingRouter } from './routers/billing';

export const appRouter = router({
  auth: authRouter,
  integrations: integrationsRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
