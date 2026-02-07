import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktokService';

const router = Router();
const prisma = new PrismaClient();
const instagramService = new InstagramService();
const tiktokService = new TikTokService();

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
router.get('/:platform', async (req, res) => {
    const { platform } = req.params;
    const userId = (req.user as any)?.id;

    try {
        const account = await prisma.socialAccount.findFirst({
            where: { userId, platform, isActive: true }
        });

        if (!account) return res.status(404).json({ error: 'Account not connected' });

        let data;
        if (platform === 'instagram') {
            data = await instagramService.getAnalytics(account.accessToken, account.accountId, new Date(), new Date());
        }         else if (platform === 'tiktok') {
            const videosData = await tiktokService.getAnalytics(account.accessToken, account.accountId, new Date(), new Date());
            data = {
                userInfo: videosData.userInfo,
                videos: videosData.videos,
                analytics: videosData.analytics
            };
        }

        res.json({ account, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Failed to fetch ${platform} analytics` });
    }
});

export default router;
