import express from 'express';
import { prisma } from '../app';
import { TikTokService } from '../services/tiktokService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const tiktokService = new TikTokService();

// Get TikTok authorization URL
router.get('/tiktok/auth-url', authenticateToken, (req, res) => {
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

// Handle TikTok OAuth callback
router.get('/tiktok/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=${error}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=missing_code`);
  }

  try {
    // Exchange code for token
    const tokenData = await tiktokService.exchangeCodeForToken(code as string);
    
    // Get user info
    const userInfo = await tiktokService.getUserInfo(tokenData.access_token);
    
    // We need the user ID from the state parameter or a session
    // For now, let's use a temporary approach - in production, store this in a session
    res.redirect(`${process.env.FRONTEND_URL}/auth/tiktok/callback?` +
      `access_token=${tokenData.access_token}` +
      `&refresh_token=${tokenData.refresh_token || ''}` +
      `&expires_in=${tokenData.expires_in}` +
      `&user_id=${userInfo.open_id}` +
      `&display_name=${userInfo.display_name}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=token_exchange_failed`);
  }
});

// Connect TikTok account (after OAuth callback)
router.post('/tiktok/connect', authenticateToken, async (req: AuthenticatedRequest, res) => {
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

    const user = req.user!;

    // Calculate token expiry date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(expires_in));

    // Get additional user info
    const userInfo = await tiktokService.getUserInfo(access_token);
    const videos = await tiktokService.getVideos(access_token);
    const analytics = await tiktokService.calculateAnalytics(userInfo, videos.videos);

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform: 'tiktok',
        accountId: user_id
      }
    });

    let socialAccount;
    if (existingAccount) {
      // Update existing account
      socialAccount = await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          displayName: display_name,
          username: username || userInfo.display_name,
          avatar: avatar_url || userInfo.avatar_url,
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true
        }
      });
    } else {
      // Create new account
      socialAccount = await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform: 'tiktok',
          accountId: user_id,
          displayName: display_name,
          username: username || userInfo.display_name,
          avatar: avatar_url || userInfo.avatar_url,
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true
        }
      });
    }

    // Store initial analytics data
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

    // Store content data
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
          postedAt: new Date(video.create_time * 1000)
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
          postedAt: new Date(video.create_time * 1000)
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
router.delete('/:accountId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { accountId } = req.params;
    const user = req.user!;

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
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;

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