import { Router } from 'express';
import axios from 'axios';
import prisma from '../config/prisma';
import { InstagramService } from '../services/instagram.service';
import { InstagramGraphService } from '../services/instagramGraph.service';
import { InstagramMediaService } from '../services/instagramMedia.service';
import { InstagramInsightsService } from '../services/instagramInsights.service';
import { TikTokService } from '../services/tiktokService';
import { tokenManager } from '../services/tokenManager';

const router = Router();
const instagramService = new InstagramService();
const instagramGraphService = new InstagramGraphService();
const instagramMediaService = new InstagramMediaService();
const instagramInsightsService = new InstagramInsightsService();
const tiktokService = new TikTokService();

// Valid platform values
const VALID_PLATFORMS = ['instagram', 'instagram-graph', 'tiktok'];

// Constants (shared with InstagramInsightsService)
const DEFAULT_DAYS_30 = 30;

// Helper: Parse timeframe to date range
function parseTimeframe(timeframe: string): { startDate: Date; endDate: Date; days: number } {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();

    let days = 7;
    if (timeframe === '7d') days = 7;
    else if (timeframe === '14d') days = 14;
    else if (timeframe === '30d') days = 30;

    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate, days };
}

/**
 * Get account activity from live Meta API (last 30 days only - NOT stored in DB)
 * Note: Some metrics may not be available for all account types
 */
async function getAccountActivity(accessToken: string, igAccountId: string) {
    if (!igAccountId) {
        console.warn('[Analytics] getAccountActivity: missing igAccountId');
        return null;
    }

    try {
        const until = Math.floor(Date.now() / 1000);
        const since = until - (DEFAULT_DAYS_30 * 24 * 60 * 60); // Last 30 days

        // Fetch reach (most commonly available)
        let reach = 0;
        try {
            const reachRes = await axios.get(`https://graph.facebook.com/v25.0/${igAccountId}/insights`, {
                params: { metric: 'reach', period: 'day', since, until, access_token: accessToken }
            });

            const data = reachRes.data?.data?.[0];
            reach = data?.total_value?.value !== undefined
                ? data.total_value.value
                : (data?.values?.[data.values.length - 1]?.value || 0);
        } catch (e) {
            console.warn('[Analytics] Failed to fetch reach:', e);
        }

        // Try to get other metrics - if they fail, just use 0
        let profileViews = 0;
        let websiteClicks = 0;

        try {
            const [pvRes, wcRes] = await Promise.all([
                axios.get(`https://graph.facebook.com/v25.0/${igAccountId}/insights`, {
                    params: { metric: 'profile_views', metric_type: 'total_value', period: 'day', since, until, access_token: accessToken }
                }),
                axios.get(`https://graph.facebook.com/v25.0/${igAccountId}/insights`, {
                    params: { metric: 'website_clicks', metric_type: 'total_value', period: 'day', since, until, access_token: accessToken }
                })
            ]);
            profileViews = pvRes.data?.data?.[0]?.total_value?.value || 0;
            websiteClicks = wcRes.data?.data?.[0]?.total_value?.value || 0;
        } catch (e) {
            // Metrics not available for this account type - that's ok
            console.warn('[Analytics] Some account activity metrics not available:', e);
        }

        return {
            reach,
            profileViews,
            websiteClicks,
            period: 'Last 30 Days'
        };
    } catch (error) {
        console.error('[Analytics] getAccountActivity error:', error);
        return null;
    }
}

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
 * GET /api/analytics/history
 * Returns daily analytics snapshots for all connected accounts, grouped by platform
 */
router.get('/history', async (req, res) => {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const days = parseInt(req.query.days as string) || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        const accounts = await prisma.socialAccount.findMany({
            where: { userId, isActive: true },
            include: {
                analytics: {
                    where: { date: { gte: since } },
                    orderBy: { date: 'asc' }
                }
            }
        });

        const history: Record<string, { date: string; followers: number; totalViews: number; totalLikes: number; totalComments: number; totalShares: number; engagementRate: number }[]> = {};

        for (const account of accounts) {
            const platform = account.platform;
            history[platform] = account.analytics.map(a => ({
                date: a.date.toISOString().split('T')[0],
                followers: a.followers,
                totalViews: a.totalViews,
                totalLikes: a.totalLikes,
                totalComments: a.totalComments,
                totalShares: a.totalShares,
                totalSaves: a.totalSaves,
                engagementRate: a.engagementRate
            }));
        }

        res.json(history);
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics history' });
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

        // For instagram-graph, we don't use timeframe - it always fetches live data
        // For instagram (Basic API) and tiktok, timeframe determines the date range
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (platform !== 'instagram-graph') {
            // Support both old format (this_week, last_14_days) and new format (7d, 14d, 30d)
            let timeframe = (req.query.timeframe as string) || '7d';

            // Map old format to new format for backward compatibility
            if (timeframe === 'this_week') timeframe = '7d';
            else if (timeframe === 'last_14_days') timeframe = '14d';
            else if (timeframe === 'last_30_days') timeframe = '30d';
            else if (timeframe === 'last_90_days') timeframe = '30d'; // DB only stores up to 30 days

            const parsed = parseTimeframe(timeframe);
            startDate = parsed.startDate;
            endDate = parsed.endDate;
        }

        let data;
        if (platform === 'instagram') {
            // Use Basic Display API - startDate/endDate are always defined here
            data = await instagramService.getAnalytics(accessToken, account.accountId, startDate!, endDate!);
        } else if (platform === 'instagram-graph') {
            // Get Instagram Business account ID first
            const igAccount = await instagramGraphService.getInstagramAccount(accessToken);

            if (!igAccount?.id) {
                return res.status(400).json({ error: 'Unable to get Instagram account. Please reconnect your account.' });
            }

            const igAccountId = igAccount.id;

            // Fetch data from multiple sources in parallel
            const [mediaData, accountActivity, profile, insights] = await Promise.all([
                // 1. Live Meta API for media (for ContentTable)
                instagramMediaService.getMedia(accessToken, igAccountId, 50),
                // 2. Live Meta API - simpler call for account activity only (3 calls vs 8)
                getAccountActivity(accessToken, igAccountId),
                // 3. Get profile from live API
                instagramGraphService.getProfile(accessToken, igAccount),
                // 4. Get insights for demographics (cached after first call)
                instagramInsightsService.getInsights(accessToken, igAccountId, 'last_30_days')
            ]);

            data = {
                profile,
                insights: {
                    // Account Activity from live API (Last 30 Days) - simpler call
                    accountActivity: accountActivity || {
                        reach: 0,
                        profileViews: 0,
                        websiteClicks: 0,
                        period: 'Last 30 Days'
                    },
                    // Demographics from live API (Current Audience)
                    demographics: insights.demographics,
                    // Media for ContentTable
                    media: mediaData.data || []
                }
            };
        } else if (platform === 'tiktok') {
            // TikTok API - startDate/endDate are always defined here
            const videosData = await tiktokService.getAnalytics(accessToken, account.accountId, startDate!, endDate!);
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

        // Record daily analytics snapshot (one per account per day)
        // Always use lifetime/cumulative data for snapshot storage (like TikTok)
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let snapshotFollowers = 0;
            let snapshotFollowing = 0;
            let snapshotLikes = 0;
            let snapshotComments = 0;
            let snapshotShares = 0;
            let snapshotSaves = 0;
            let snapshotViews = 0;
            let snapshotEngagement = 0;

            if (platform === 'tiktok' && data?.analytics) {
                // TikTok already has cumulative values from userInfo
                snapshotFollowers = data.analytics.followers || 0;
                snapshotFollowing = data.analytics.following || 0;
                snapshotLikes = data.analytics.totalLikes || 0;
                snapshotComments = data.analytics.totalComments || 0;
                snapshotShares = data.analytics.totalShares || 0;
                snapshotSaves = 0; // TikTok doesn't have saves
                snapshotViews = data.analytics.totalViews || 0;
                snapshotEngagement = data.analytics.engagementRate || 0;
            } else if (platform === 'instagram-graph') {
                // Fetch ALL media and sum metrics (like TikTok)
                const mediaData = await instagramMediaService.getMedia(accessToken, account.accountId, 50);
                const allMedia = mediaData?.data || [];

                // Sum all metrics from all posts (cumulative, like TikTok)
                const mediaTotals = allMedia.reduce((acc, media) => {
                    acc.likes += media.like_count || 0;
                    acc.comments += media.comments_count || 0;
                    acc.shares += media.share_count || 0;
                    acc.saves += media.save_count || 0;
                    acc.views += media.views || 0;
                    return acc;
                }, { likes: 0, comments: 0, shares: 0, saves: 0, views: 0 });

                const profile = data?.profile || {};
                snapshotFollowers = profile.followers_count || 0;
                snapshotFollowing = profile.follows_count || 0;
                snapshotLikes = mediaTotals.likes;
                snapshotComments = mediaTotals.comments;
                snapshotShares = mediaTotals.shares;
                snapshotSaves = mediaTotals.saves;
                snapshotViews = mediaTotals.views;
                const totalEngagement = snapshotLikes + snapshotComments + snapshotShares + snapshotSaves;
                snapshotEngagement = snapshotViews > 0 ? (totalEngagement / snapshotViews) * 100 : 0;
            } else if (platform === 'instagram' && data?.insights) {
                // Basic Display API - use current values (already cumulative from total_value)
                snapshotFollowers = data.insights.followers || data.profile?.followers_count || 0;
                snapshotFollowing = data.insights.following || data.profile?.follows_count || 0;
                snapshotLikes = data.insights.likes || 0;
                snapshotComments = data.insights.comments || 0;
                snapshotShares = data.insights.shares || 0;
                snapshotSaves = data.insights.saves || 0;
                snapshotViews = data.insights.views || data.insights.reach || 0;
                snapshotEngagement = data.insights.reach > 0
                    ? (data.insights.totalInteractions / data.insights.reach) * 100 : 0;
            }

            await prisma.analytics.upsert({
                where: {
                    accountId_date: {
                        accountId: account.id,
                        date: today
                    }
                },
                update: {
                    followers: snapshotFollowers,
                    following: snapshotFollowing,
                    totalLikes: snapshotLikes,
                    totalComments: snapshotComments,
                    totalShares: snapshotShares,
                    totalSaves: snapshotSaves,
                    totalViews: snapshotViews,
                    engagementRate: snapshotEngagement
                },
                create: {
                    accountId: account.id,
                    date: today,
                    followers: snapshotFollowers,
                    following: snapshotFollowing,
                    totalLikes: snapshotLikes,
                    totalComments: snapshotComments,
                    totalShares: snapshotShares,
                    totalSaves: snapshotSaves,
                    totalViews: snapshotViews,
                    engagementRate: snapshotEngagement
                }
            });
        } catch (snapshotError) {
            // Don't fail the request if snapshot recording fails
            console.error('[Analytics] Snapshot upsert error:', snapshotError);
        }

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
