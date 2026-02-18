import cron from 'node-cron';
import prisma from '../config/prisma';
import { InstagramService } from '../services/instagram.service';
import { InstagramGraphService } from '../services/instagramGraph.service';
import { TikTokService } from '../services/tiktokService';
import { tokenManager } from '../services/tokenManager';

const instagramService = new InstagramService();
const instagramGraphService = new InstagramGraphService();
const tiktokService = new TikTokService();

async function refreshTokens() {
  console.log('[Token Refresh] Starting token refresh job...');

  try {
    const accounts = await prisma.socialAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: { lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
          { expiresAt: null }
        ]
      }
    });

    console.log(`[Token Refresh] Found ${accounts.length} accounts to check`);

    for (const account of accounts) {
      try {
        // Get decrypted refresh token using tokenManager
        const refreshToken = await tokenManager.getRefreshToken(account.id);

        if (!refreshToken) {
          console.log(`[Token Refresh] Skipping ${account.platform} account ${account.id} - no refresh token`);
          continue;
        }

        let newAccessToken: string;
        let newRefreshToken: string | undefined;
        let newExpiresAt: Date | null;

        if (account.platform === 'instagram') {
          console.log(`[Token Refresh] Refreshing Instagram token for account ${account.id}`);
          const result = await instagramService.refreshToken(refreshToken);
          newAccessToken = result.accessToken;
          newRefreshToken = result.refreshToken;
          newExpiresAt = result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null;
        } else if (account.platform === 'instagram-graph') {
          console.log(`[Token Refresh] Refreshing Instagram Graph token for account ${account.id}`);
          const result = await instagramGraphService.refreshToken(refreshToken);
          newAccessToken = result.accessToken;
          newRefreshToken = result.refreshToken;
          newExpiresAt = result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null;
        } else if (account.platform === 'tiktok') {
          console.log(`[Token Refresh] Refreshing TikTok token for account ${account.id}`);
          const tokenData = await tiktokService.refreshToken(refreshToken);
          newAccessToken = tokenData.accessToken;
          newRefreshToken = tokenData.refreshToken;
          newExpiresAt = tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : null;
        } else {
          console.log(`[Token Refresh] Skipping ${account.platform} account ${account.id} - unsupported platform`);
          continue;
        }

        // Store encrypted tokens
        await tokenManager.updateTokens(account.id, newAccessToken, newRefreshToken);

        // Update expiresAt in database (not sensitive, no encryption needed)
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: {
            expiresAt: newExpiresAt
          }
        });

        console.log(`[Token Refresh] Successfully refreshed ${account.platform} account ${account.id}`);
      } catch (error) {
        console.error(`[Token Refresh] Failed to refresh ${account.platform} account ${account.id}:`, error);

        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { isActive: false }
        });
      }
    }

    console.log('[Token Refresh] Token refresh job completed');
  } catch (error) {
    console.error('[Token Refresh] Job failed:', error);
  }
}

export function startTokenRefreshCron() {
  cron.schedule('0 */6 * * *', refreshTokens, {
    timezone: 'UTC'
  });

  console.log('[Token Refresh] Cron job scheduled to run every 6 hours');

  // Don't run on startup if DB is unavailable - will run on cron schedule
  refreshTokens().catch(err => {
    console.log('[Token Refresh] Startup refresh skipped (DB unavailable):', err.message);
  });
}

export { refreshTokens };
