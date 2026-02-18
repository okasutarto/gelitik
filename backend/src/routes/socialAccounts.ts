import express from 'express';
import prisma from '../config/prisma';
import { TikTokService } from '../services/tiktokService';
import { tokenManager } from '../services/tokenManager';
import { authenticateJwt } from '../middleware/auth.middleware';
import { FRONTEND_URL } from '../config/env';

const router = express.Router();
const tiktokService = new TikTokService();

// Get TikTok authorization URL
router.get('/tiktok/auth-url', authenticateJwt, (req, res) => {
  try {
    const authUrl = tiktokService.getAuthUrl();
    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate auth URL'
    });
  }
});

// Handle TikTok OAuth callback - DEPRECATED
// SECURITY: This endpoint is deprecated. Use /auth/tiktok/callback instead
// which stores tokens securely in the database without exposing them in the URL.
// This endpoint now redirects to the secure callback.
router.get('/tiktok/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/auth/error?error=${error}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/auth/error?error=missing_code`);
  }

  // Redirect to the secure callback endpoint that stores tokens in DB
  // The frontend should use /auth/:platform/connect -> /auth/:platform/callback instead
  res.redirect(`${FRONTEND_URL}/auth/tiktok/callback?code=${code}&state=${state || ''}`);
});

// Connect TikTok account (after OAuth callback)
router.post('/tiktok/connect', authenticateJwt, async (req, res) => {
  try {
    const {
      access_token,
      refresh_token,
      expires_in,
      user_id,
      display_name,
      username,
      avatar_url
    } = req.body;

    const user = (req as any).user;

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(expires_in));

    const userInfo = await tiktokService.getUserInfo(access_token);
    const videos = await tiktokService.getVideos(access_token);
    const analytics = await tiktokService.calculateAnalytics(userInfo, videos.videos);

    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform: 'tiktok',
        accountId: user_id
      }
    });

    let socialAccount;
    if (existingAccount) {
      socialAccount = await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          displayName: display_name,
          username: username || userInfo.display_name,
          avatar: avatar_url || userInfo.avatar_url,
          expiresAt,
          isActive: true
        }
      });
    } else {
      socialAccount = await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform: 'tiktok',
          accountId: user_id,
          displayName: display_name,
          username: username || userInfo.display_name,
          avatar: avatar_url || userInfo.avatar_url,
          accessToken: access_token, // Legacy field - will be migrated
          refreshToken: refresh_token, // Legacy field - will be migrated
          expiresAt,
          isActive: true
        }
      });
    }

    // Store tokens with encryption
    await tokenManager.storeTokens(socialAccount.id, access_token, refresh_token);

    await prisma.analytics.create({
      data: {
        accountId: socialAccount.id,
        followers: analytics.followers,
        following: analytics.following,
        totalLikes: analytics.totalLikes,
        totalComments: analytics.totalComments,
        totalShares: analytics.totalShares,
        totalViews: analytics.totalViews,
        engagementRate: analytics.engagementRate
      }
    });

    for (const video of videos.videos) {
      await prisma.content.upsert({
        where: {
          accountId_contentId: {
            accountId: socialAccount.id,
            contentId: video.id
          }
        },
        update: {
          title: video.title,
          description: video.video_description,
          thumbnail: video.cover_image_url,
          url: video.embed_link,
          likes: video.like_count,
          comments: video.comment_count,
          shares: video.share_count,
          views: video.view_count,
          duration: video.duration,
          postedAt: new Date(video.create_time * 1000),
          type: 'video'
        },
        create: {
          accountId: socialAccount.id,
          contentId: video.id,
          title: video.title,
          description: video.video_description,
          thumbnail: video.cover_image_url,
          url: video.embed_link,
          likes: video.like_count,
          comments: video.comment_count,
          shares: video.share_count,
          views: video.view_count,
          duration: video.duration,
          postedAt: new Date(video.create_time * 1000),
          type: 'video'
        }
      });
    }

    res.json({
      success: true,
      data: socialAccount
    });
  } catch (error) {
    console.error('TikTok connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect TikTok account'
    });
  }
});

// Disconnect social account
router.delete('/:accountId', authenticateJwt, async (req, res) => {
  try {
    const { accountId } = req.params;
    const user = (req as any).user;

    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect account'
    });
  }
});

// Get all connected accounts
router.get('/', authenticateJwt, async (req, res) => {
  try {
    const user = (req as any).user;

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        analytics: {
          orderBy: { date: 'desc' },
          take: 1
        },
        _count: {
          select: { content: true }
        }
      }
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts'
    });
  }
});

export default router;
