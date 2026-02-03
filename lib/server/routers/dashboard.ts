import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const dashboardRouter = router({
  // Get overview metrics
  overview: protectedProcedure
    .input(z.object({
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
    }))
    .query(async ({ input, ctx }) => {
      // TODO: Aggregate metrics from database
      return {
        totalSpend: 0,
        totalRevenue: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageRoas: 0,
        averageCtr: 0,
        averageCpc: 0,
      };
    }),
  
  // Get campaigns list
  campaigns: protectedProcedure
    .input(z.object({
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
      limit: z.number().default(10),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      // TODO: Fetch campaigns with metrics
      return {
        campaigns: [],
        total: 0,
      };
    }),
});
