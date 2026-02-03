import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const integrationsRouter = router({
  // List user integrations
  list: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Implement when auth is ready
    return [];
  }),
  
  // Get integration by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // TODO: Implement
      return null;
    }),
  
  // Disconnect integration
  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement
      return { success: true };
    }),
});
