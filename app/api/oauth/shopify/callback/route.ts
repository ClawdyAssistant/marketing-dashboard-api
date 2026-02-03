import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getShopInfo } from '@/lib/integrations/shopify';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=${error}`
    );
  }

  if (!code || !shop || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=missing_params`
    );
  }

  try {
    // Exchange code for access token
    const tokenData = await getAccessToken({ shop, code });
    
    // Get shop info
    const shopInfo = await getShopInfo({
      shop,
      accessToken: tokenData.access_token,
    });

    // Save integration to database
    await prisma.integration.create({
      data: {
        userId: state,
        platform: 'shopify',
        accountId: shop,
        accountName: shopInfo.name,
        accessToken: tokenData.access_token,
        isActive: true,
        syncStatus: 'idle',
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?success=shopify`
    );
  } catch (error) {
    console.error('Shopify OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=oauth_failed`
    );
  }
}
