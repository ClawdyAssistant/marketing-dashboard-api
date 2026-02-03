import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, getGoogleAdsAccounts } from '@/lib/integrations/google-ads';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=missing_params`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens');
    }

    // Get Google Ads accounts
    const accountsData = await getGoogleAdsAccounts(tokens.access_token);
    const primaryAccount = accountsData.accounts[0];

    // Save integration to database
    await prisma.integration.create({
      data: {
        userId: state,
        platform: 'google-ads',
        accountId: primaryAccount.id,
        accountName: primaryAccount.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true,
        syncStatus: 'idle',
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?success=google-ads`
    );
  } catch (error) {
    console.error('Google Ads OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=oauth_failed`
    );
  }
}
