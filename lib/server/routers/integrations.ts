import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const integrationsRouter = router({
  // List user integrations
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('Unauthorized');
    
    return await ctx.prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }),
  
  // Get integration by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');
      
      return await ctx.prisma.integration.findFirst({
        where: {
          id: input.id,
          userId,
        }
      });
    }),
  
  // Disconnect integration
  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');
      
      await ctx.prisma.integration.update({
        where: { id: input.id },
        data: { isActive: false },
      });
      
      return { success: true };
    }),

  // Trigger manual sync
  sync: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');
      
      // Update sync status
      await ctx.prisma.integration.update({
        where: { id: input.id },
        data: {
          syncStatus: 'syncing',
          lastSync: new Date(),
        },
      });
      
      // TODO: Trigger background job for actual sync
      
      return { success: true, message: 'Sync started' };
    }),
});
