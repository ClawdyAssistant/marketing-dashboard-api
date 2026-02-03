import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const reportsRouter = router({
  // List user reports
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('Unauthorized');
    
    return await ctx.prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }),
  
  // Get report by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');
      
      return await ctx.prisma.report.findFirst({
        where: {
          id: input.id,
          userId,
        }
      });
    }),
  
  // Generate new report with AI insights
  generate: protectedProcedure
    .input(z.object({
      name: z.string(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');
      
      // TODO: Fetch campaign data and call AI service for insights
      // For now, create report without insights
      
      const report = await ctx.prisma.report.create({
        data: {
          userId,
          name: input.name,
          dateRange: input.dateRange,
        }
      });
      
      return report;
    }),
});
