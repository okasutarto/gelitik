import { Router } from 'express';
import prisma from '../config/prisma';
import { InstagramService } from '../services/instagram.service';
import { InstagramGraphService } from '../services/instagramGraph.service';
import { TikTokService } from '../services/tiktokService';
import { tokenManager } from '../services/tokenManager';

const router = Router();
const instagramService = new InstagramService();
const instagramGraphService = new InstagramGraphService();
const tiktokService = new TikTokService();

// Valid platform values
const VALID_PLATFORMS = ['instagram', 'instagram-graph', 'tiktok'];

// Middleware to validate platform parameter
const validatePlatform = (req: any, res: any, next: any) => {
    const { platform } = req.params;
    if (!VALID_PLATFORMS.includes(platform)) {
        return res.status(400).json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` });
    }
    next();
};

/**
 * GET /api/analytics/overview
 * Aggregated stats across all connected platforms
 */
router.get('/overview', async (req, res) => {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const accounts = await prisma.socialAccount.findMany({
            where: { userId, isActive: true },
            include: {
                analytics: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        });

        const stats = accounts.reduce((acc, account) => {
            const latest = account.analytics[0] || {};
            return {
                totalFollowers: acc.totalFollowers + (latest.followers || 0),
                totalLikes: acc.totalLikes + (latest.totalLikes || 0),
                totalViews: acc.totalViews + (latest.totalViews || 0),
                platformCount: acc.platformCount + 1
            };
        }, { totalFollowers: 0, totalLikes: 0, totalViews: 0, platformCount: 0 });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});

/**
 * GET /api/analytics/:platform
 * Platform-specific deep dive
 */
router.get('/:platform', validatePlatform, async (req, res) => {
    const { platform } = req.params;
    const userId = (req.user as any)?.id;

    try {
        const account = await prisma.socialAccount.findFirst({
            where: { userId, platform, isActive: true }
        });

        if (!account) return res.status(404).json({ error: 'Account not connected' });

        // Get decrypted access token
        const accessToken = await tokenManager.getAccessToken(account.id);

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token not available. Please reconnect your account.' });
        }

        // Determine startDate based on timeframe
        const timeframe = (req.query.timeframe as string) || 'this_week';
        const endDate = new Date();
        const startDate = new Date();
        if (timeframe === 'this_week') startDate.setDate(endDate.getDate() - 7);
        else if (timeframe === 'last_14_days') startDate.setDate(endDate.getDate() - 14);
        else if (timeframe === 'last_30_days') startDate.setDate(endDate.getDate() - 30);
        else if (timeframe === 'last_90_days') startDate.setDate(endDate.getDate() - 90);

        let data;
        if (platform === 'instagram') {
            // Use Basic Display API
            data = await instagramService.getAnalytics(accessToken, account.accountId, startDate, endDate);
        } else if (platform === 'instagram-graph') {
            // Use Graph API for full insights
            const analyticsData = await instagramGraphService.getAnalytics(accessToken, account.accountId, startDate, endDate, timeframe);
            data = {
                profile: analyticsData.profile,
                insights: analyticsData.insights,
                media: analyticsData.media
            };
        } else if (platform === 'tiktok') {
            const videosData = await tiktokService.getAnalytics(accessToken, account.accountId, startDate, endDate);
            data = {
                userInfo: videosData.userInfo,
                videos: videosData.videos,
                analytics: videosData.analytics
            };
        }

        const sanitizedAccount = {
            id: account.id,
            platform: account.platform,
            accountId: account.accountId,
            displayName: account.displayName,
            username: account.username,
            avatar: account.avatar,
            isActive: account.isActive,
            expiresAt: account.expiresAt,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt
        };

        res.json({ account: sanitizedAccount, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Failed to fetch ${platform} analytics` });
    }
});

/**
 * GET /api/analytics/:platform/video/:videoId
 * Detailed analytics for a specific video (fetched from platform API)
 */
router.get('/:platform/video/:videoId', validatePlatform, async (req, res) => {
    const { platform, videoId } = req.params;
    const userId = (req.user as any)?.id;

    try {
        const account = await prisma.socialAccount.findFirst({
            where: { userId, platform, isActive: true }
        });

        if (!account) {
            return res.status(404).json({ error: 'Account not found for this platform' });
        }

        // Get decrypted access token
        const accessToken = await tokenManager.getAccessToken(account.id);

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token not available. Please reconnect your account.' });
        }

        if (platform === 'tiktok') {
            // Fetch video details from TikTok API
            const videoDetails = await tiktokService.getVideoDetails(accessToken, videoId);

            // Calculate engagement rate
            const engagementRate = videoDetails.view_count > 0
                ? ((videoDetails.like_count + videoDetails.comment_count + videoDetails.share_count) / videoDetails.view_count) * 100
                : 0;

            res.json({
                id: videoDetails.id,
                title: videoDetails.video_description || 'Untitled Video',
                description: videoDetails.video_description || '',
                thumbnail: videoDetails.cover_image_url || '',
                cover_image_url: videoDetails.cover_image_url || '',
                create_time: videoDetails.create_time || 0,
                duration: videoDetails.duration || 0,
                views: videoDetails.view_count || 0,
                likes: videoDetails.like_count || 0,
                comments: videoDetails.comment_count || 0,
                shares: videoDetails.share_count || 0,
                engagement_rate: Math.round(engagementRate * 10) / 10
            });
        } else if (platform === 'instagram' || platform === 'instagram-graph') {
            // Instagram Graph API can get media details
            if (platform === 'instagram-graph') {
                const mediaInsights = await instagramGraphService.getMediaInsights(accessToken, videoId);
                res.json(mediaInsights);
            } else {
                res.status(501).json({ error: 'Instagram video details not implemented yet' });
            }
        } else {
            res.status(400).json({ error: 'Unsupported platform' });
        }
    } catch (error) {
        console.error('Video detail fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch video analytics' });
    }
});

export default router;
