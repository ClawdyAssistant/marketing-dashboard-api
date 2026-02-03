import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { aiService } from '../../lib/ai-service';

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
      
      const startDate = new Date(input.dateRange.start);
      const endDate = new Date(input.dateRange.end);
      
      // Fetch campaign data for AI analysis
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
        }
      });
      
      // Aggregate metrics for each campaign
      const campaignData = campaigns.map(campaign => {
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
          campaignName: campaign.name,
          platform: campaign.integration.platform,
          dateRange: input.dateRange,
          metrics: {
            spend: totalSpend,
            revenue: totalRevenue,
            impressions: totalImpressions,
            clicks: totalClicks,
            conversions: totalConversions,
            roas,
            ctr,
            cpc,
          }
        };
      });
      
      let insights = null;
      
      // Only call AI service if we have campaign data
      if (campaignData.length > 0) {
        try {
          insights = await aiService.getInsights({
            campaigns: campaignData,
            dateRange: input.dateRange,
          });
        } catch (error) {
          console.error('Failed to get AI insights:', error);
          // Continue without insights - don't fail the report generation
        }
      }
      
      // Create report with insights
      const report = await ctx.prisma.report.create({
        data: {
          userId,
          name: input.name,
          dateRange: input.dateRange,
          insights: insights ? JSON.stringify(insights) : null,
        }
      });
      
      return report;
    }),
});
