import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create subscription
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      plan: 'pro',
      status: 'active',
    },
  });

  console.log('✅ Created subscription');

  // Create Google Ads integration
  const googleAdsIntegration = await prisma.integration.upsert({
    where: { 
      userId_platform_accountId: {
        userId: user.id,
        platform: 'google-ads',
        accountId: 'test-google-account',
      }
    },
    update: {},
    create: {
      userId: user.id,
      platform: 'google-ads',
      accountId: 'test-google-account',
      accountName: 'Demo Google Ads Account',
      accessToken: 'test-token',
      isActive: true,
      syncStatus: 'completed',
      lastSync: new Date(),
    },
  });

  console.log('✅ Created Google Ads integration');

  // Create Meta Ads integration
  const metaIntegration = await prisma.integration.upsert({
    where: { 
      userId_platform_accountId: {
        userId: user.id,
        platform: 'meta',
        accountId: 'test-meta-account',
      }
    },
    update: {},
    create: {
      userId: user.id,
      platform: 'meta',
      accountId: 'test-meta-account',
      accountName: 'Demo Meta Ads Account',
      accessToken: 'test-token',
      isActive: true,
      syncStatus: 'completed',
      lastSync: new Date(),
    },
  });

  console.log('✅ Created Meta Ads integration');

  // Create campaigns
  const campaign1 = await prisma.campaign.create({
    data: {
      integrationId: googleAdsIntegration.id,
      externalId: 'camp-google-1',
      name: 'Winter Sale Campaign',
      platform: 'google-ads',
      status: 'active',
      dailyBudget: 100,
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      integrationId: metaIntegration.id,
      externalId: 'camp-meta-1',
      name: 'Product Launch',
      platform: 'meta',
      status: 'active',
      dailyBudget: 75,
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      integrationId: googleAdsIntegration.id,
      externalId: 'camp-google-2',
      name: 'Brand Awareness',
      platform: 'google-ads',
      status: 'active',
      dailyBudget: 150,
    },
  });

  const campaign4 = await prisma.campaign.create({
    data: {
      integrationId: metaIntegration.id,
      externalId: 'camp-meta-2',
      name: 'Retargeting Campaign',
      platform: 'meta',
      status: 'active',
      dailyBudget: 50,
    },
  });

  console.log('✅ Created 4 campaigns');

  // Create metrics for last 30 days
  const today = new Date();
  const campaigns = [campaign1, campaign2, campaign3, campaign4];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    for (const campaign of campaigns) {
      const baseSpend = campaign.dailyBudget! * (0.8 + Math.random() * 0.4);
      const roas = 2 + Math.random() * 2; // 2-4x ROAS
      const revenue = baseSpend * roas;
      const impressions = Math.floor(baseSpend * 100 * (1 + Math.random()));
      const ctr = 0.02 + Math.random() * 0.03; // 2-5% CTR
      const clicks = Math.floor(impressions * ctr);
      const conversionRate = 0.02 + Math.random() * 0.03; // 2-5% conversion
      const conversions = Math.floor(clicks * conversionRate);

      await prisma.metric.create({
        data: {
          campaignId: campaign.id,
          date,
          spend: baseSpend,
          revenue,
          impressions,
          clicks,
          conversions,
          ctr: ctr * 100,
          cpc: clicks > 0 ? baseSpend / clicks : 0,
          cpa: conversions > 0 ? baseSpend / conversions : 0,
          roas,
        },
      });
    }
  }

  console.log('✅ Created metrics for 30 days × 4 campaigns');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
