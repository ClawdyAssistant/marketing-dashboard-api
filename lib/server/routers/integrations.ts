import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { addSyncJob } from '../../lib/queue';
import { getAuthUrl as getGoogleAdsAuthUrl } from '../../lib/integrations/google-ads';
import { getAuthUrl as getMetaAuthUrl } from '../../lib/integrations/meta';
import { getAuthUrl as getShopifyAuthUrl } from '../../lib/integrations/shopify';

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

  // Initiate OAuth flow
  initiateOAuth: protectedProcedure
    .input(z.object({
      platform: z.enum(['google-ads', 'meta', 'shopify']),
      shopDomain: z.string().optional(), // Required for Shopify
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');

      let authUrl: string;

      switch (input.platform) {
        case 'google-ads':
          authUrl = getGoogleAdsAuthUrl(userId);
          break;
        
        case 'meta':
          authUrl = getMetaAuthUrl(userId);
          break;
        
        case 'shopify':
          if (!input.shopDomain) {
            throw new Error('Shop domain is required for Shopify');
          }
          authUrl = getShopifyAuthUrl(userId, input.shopDomain);
          break;
        
        default:
          throw new Error('Invalid platform');
      }

      return { authUrl };
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

  // Trigger manual sync (uses job queue)
  sync: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error('Unauthorized');
      
      // Get integration details
      const integration = await ctx.prisma.integration.findFirst({
        where: {
          id: input.id,
          userId,
        }
      });
      
      if (!integration) {
        throw new Error('Integration not found');
      }
      
      // Update sync status
      await ctx.prisma.integration.update({
        where: { id: input.id },
        data: {
          syncStatus: 'syncing',
        },
      });
      
      // Add job to queue
      await addSyncJob({
        integrationId: integration.id,
        userId: userId,
        platform: integration.platform as 'google-ads' | 'meta' | 'shopify',
      });
      
      return { success: true, message: 'Sync started' };
    }),
});
