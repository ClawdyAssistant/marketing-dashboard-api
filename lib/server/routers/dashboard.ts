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
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');

      const startDate = new Date(input.dateRange.start);
      const endDate = new Date(input.dateRange.end);

      // Get all user integrations
      const integrations = await ctx.prisma.integration.findMany({
        where: { userId },
        include: {
          campaigns: {
            include: {
              metrics: {
                where: {
                  date: {
                    gte: startDate,
                    lte: endDate,
                  }
                }
              }
            }
          }
        }
      });

      // Aggregate metrics
      let totalSpend = 0;
      let totalRevenue = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalConversions = 0;

      integrations.forEach(integration => {
        integration.campaigns.forEach(campaign => {
          campaign.metrics.forEach(metric => {
            totalSpend += metric.spend;
            totalRevenue += metric.revenue || 0;
            totalImpressions += metric.impressions;
            totalClicks += metric.clicks;
            totalConversions += metric.conversions;
          });
        });
      });

      const averageRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averageCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

      return {
        totalSpend,
        totalRevenue,
        totalImpressions,
        totalClicks,
        totalConversions,
        averageRoas,
        averageCtr,
        averageCpc,
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
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');

      const startDate = new Date(input.dateRange.start);
      const endDate = new Date(input.dateRange.end);

      // Get campaigns with aggregated metrics
      const campaigns = await ctx.prisma.campaign.findMany({
        where: {
          integration: {
            userId,
          }
        },
        include: {
          integration: {
            select: {
              platform: true,
            }
          },
          metrics: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              }
            }
          }
        },
        take: input.limit,
        skip: input.offset,
        orderBy: {
          createdAt: 'desc',
        }
      });

      // Aggregate metrics for each campaign
      const campaignsWithStats = campaigns.map(campaign => {
        let totalSpend = 0;
        let totalRevenue = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalConversions = 0;

        campaign.metrics.forEach(metric => {
          totalSpend += metric.spend;
          totalRevenue += metric.revenue || 0;
          totalImpressions += metric.impressions;
          totalClicks += metric.clicks;
          totalConversions += metric.conversions;
        });

        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          platform: campaign.integration.platform,
          status: campaign.status,
          totalSpend,
          totalRevenue,
          totalImpressions,
          totalClicks,
          totalConversions,
          roas,
          ctr,
          cpc,
        };
      });

      const total = await ctx.prisma.campaign.count({
        where: {
          integration: {
            userId,
          }
        }
      });

      return {
        campaigns: campaignsWithStats,
        total,
      };
    }),

  // Get daily performance metrics for charts
  dailyMetrics: protectedProcedure
    .input(z.object({
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');

      const startDate = new Date(input.dateRange.start);
      const endDate = new Date(input.dateRange.end);

      // Get all metrics grouped by date
      const metrics = await ctx.prisma.metric.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          campaign: {
            integration: {
              userId,
            }
          }
        },
        orderBy: {
          date: 'asc',
        },
        include: {
          campaign: true,
        }
      });

      // Group by date and aggregate
      const dailyData = new Map<string, { spend: number; revenue: number; impressions: number; clicks: number }>();

      metrics.forEach(metric => {
        const dateKey = metric.date.toISOString().split('T')[0];
        const existing = dailyData.get(dateKey) || { spend: 0, revenue: 0, impressions: 0, clicks: 0 };
        
        dailyData.set(dateKey, {
          spend: existing.spend + metric.spend,
          revenue: existing.revenue + (metric.revenue || 0),
          impressions: existing.impressions + metric.impressions,
          clicks: existing.clicks + metric.clicks,
        });
      });

      // Convert to array and calculate ROAS
      return Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          spend: data.spend,
          revenue: data.revenue,
          roas: data.spend > 0 ? data.revenue / data.spend : 0,
          impressions: data.impressions,
          clicks: data.clicks,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }),
});
