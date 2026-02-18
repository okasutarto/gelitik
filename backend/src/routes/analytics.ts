import express from 'express';
import { prisma } from '../app';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get dashboard overview
router.get('/overview', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { timeframe = '30' } = req.query; // Default to 30 days

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        analytics: {
          where: {
            date: {
              gte: new Date(Date.now() - parseInt(timeframe as string) * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { date: 'desc' }
        },
        content: {
          where: {
            postedAt: {
              gte: new Date(Date.now() - parseInt(timeframe as string) * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { postedAt: 'desc' }
        }
      }
    });

    // Calculate overview metrics
    let totalFollowers = 0;
    let followerGrowth = 0;
    let totalEngagementRate = 0;
    let totalContent = 0;

    accounts.forEach(account => {
      const latestAnalytics = account.analytics[0];
      const oldestAnalytics = account.analytics[account.analytics.length - 1];

      if (latestAnalytics) {
        totalFollowers += latestAnalytics.followers;
        totalEngagementRate += latestAnalytics.engagementRate;
        
        if (oldestAnalytics) {
          followerGrowth += latestAnalytics.followers - oldestAnalytics.followers;
        }
      }

      totalContent += account.content.length;
    });

    const avgEngagementRate = accounts.length > 0 ? totalEngagementRate / accounts.length : 0;

    res.json({
      success: true,
      data: {
        totalFollowers,
        followerGrowth,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
        totalContent,
        connectedAccounts: accounts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data'
    });
  }
});

// Get follower growth chart data
router.get('/follower-growth', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { timeframe = '30' } = req.query;

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        analytics: {
          where: {
            date: {
              gte: new Date(Date.now() - parseInt(timeframe as string) * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    // Group analytics by date and sum followers across all platforms
    const dailyData: { [date: string]: { totalFollowers: number; platforms: string[] } } = {};

    accounts.forEach(account => {
      account.analytics.forEach(analytic => {
        const dateKey = analytic.date.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            totalFollowers: 0,
            platforms: []
          };
        }

        dailyData[dateKey].totalFollowers += analytic.followers;
        if (!dailyData[dateKey].platforms.includes(account.platform)) {
          dailyData[dateKey].platforms.push(account.platform);
        }
      });
    });

    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        followers: data.totalFollowers,
        platforms: data.platforms.length
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follower growth data'
    });
  }
});

// Get engagement trends
router.get('/engagement-trends', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { timeframe = '30' } = req.query;

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        analytics: {
          where: {
            date: {
              gte: new Date(Date.now() - parseInt(timeframe as string) * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    const dailyData: { [date: string]: { totalRate: number; count: number } } = {};

    accounts.forEach(account => {
      account.analytics.forEach(analytic => {
        const dateKey = analytic.date.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { totalRate: 0, count: 0 };
        }

        dailyData[dateKey].totalRate += analytic.engagementRate;
        dailyData[dateKey].count += 1;
      });
    });

    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        rate: Math.round((data.totalRate / data.count) * 100) / 100
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement trends'
    });
  }
});

// Get top performing content
router.get('/top-content', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { limit = '10' } = req.query;

    const content = await prisma.content.findMany({
      where: {
        account: {
          userId: user.id,
          isActive: true
        }
      },
      include: {
        account: {
          select: {
            platform: true,
            displayName: true
          }
        }
      },
      orderBy: [
        { likes: 'desc' },
        { comments: 'desc' },
        { shares: 'desc' }
      ],
      take: parseInt(limit as string)
    });

    // Calculate engagement for each content
    const contentWithEngagement = content.map(item => {
      const engagement = item.likes + item.comments + item.views;
      return {
        id: item.id,
        title: item.title || 'Untitled',
        platform: item.account.platform,
        accountName: item.account.displayName,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares,
        views: item.views,
        engagement,
        engagementRate: item.views > 0 ? Math.round(((item.likes + item.comments + item.shares) / item.views) * 100 * 100) / 100 : 0,
        postedAt: item.postedAt,
        thumbnail: item.thumbnail
      };
    });

    res.json({
      success: true,
      data: contentWithEngagement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top content'
    });
  }
});

// Get platform-specific analytics
router.get('/platform/:platform', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { platform } = req.params;
    const { timeframe = '30' } = req.query;

    const account = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform: platform.toLowerCase(),
        isActive: true
      },
      include: {
        analytics: {
          where: {
            date: {
              gte: new Date(Date.now() - parseInt(timeframe as string) * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { date: 'desc' }
        },
        content: {
          where: {
            postedAt: {
              gte: new Date(Date.now() - parseInt(timeframe as string) * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { postedAt: 'desc' },
          take: 50
        }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found for this platform'
      });
    }

    const latestAnalytics = account.analytics[0];
    const content = account.content;

    res.json({
      success: true,
      data: {
        account: {
          id: account.id,
          platform: account.platform,
          displayName: account.displayName,
          username: account.username,
          avatar: account.avatar
        },
        analytics: latestAnalytics,
        content: content.map(item => ({
          id: item.id,
          title: item.title,
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
          views: item.views,
          engagementRate: item.views > 0 ? Math.round(((item.likes + item.comments + item.shares) / item.views) * 100 * 100) / 100 : 0,
          postedAt: item.postedAt,
          thumbnail: item.thumbnail
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform analytics'
    });
  }
});

// Get detailed video analytics
router.get('/:platform/video/:videoId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { platform, videoId } = req.params;

    // Find the user's account for this platform
    const account = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform: platform.toLowerCase(),
        isActive: true
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found for this platform'
      });
    }

    // Find the specific content item
    const content = await prisma.content.findFirst({
      where: {
        id: videoId,
        accountId: account.id
      }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Calculate engagement rate
    const engagementRate = content.views > 0
      ? ((content.likes + content.comments + content.shares) / content.views) * 100
      : 0;

    // Return detailed video analytics
    res.json({
      id: content.id,
      title: content.title || 'Untitled Video',
      description: content.description || '',
      thumbnail: content.thumbnail || '',
      cover_image_url: content.thumbnail || '',
      create_time: content.postedAt ? Math.floor(content.postedAt.getTime() / 1000) : 0,
      duration: content.duration || 0,
      views: content.views,
      likes: content.likes,
      comments: content.comments,
      shares: content.shares,
      engagement_rate: Math.round(engagementRate * 10) / 10,
      // Add demographic data (mock data for now - can be enhanced with real data)
      demographics: {
        age_range: [
          { range: '18-24', percentage: 35 },
          { range: '25-34', percentage: 28 },
          { range: '35-44', percentage: 20 },
          { range: '45+', percentage: 17 }
        ],
        gender: [
          { gender: 'Male', percentage: 45 },
          { gender: 'Female', percentage: 55 }
        ],
        top_countries: [
          { country: 'United States', percentage: 40 },
          { country: 'United Kingdom', percentage: 15 },
          { country: 'Canada', percentage: 10 },
          { country: 'Australia', percentage: 8 }
        ],
        top_cities: [
          { city: 'New York', percentage: 12 },
          { city: 'Los Angeles', percentage: 8 },
          { city: 'London', percentage: 6 },
          { city: 'Toronto', percentage: 5 }
        ]
      },
      // Add traffic sources (mock data for now)
      traffic_sources: [
        { source: 'For You Page', percentage: 65 },
        { source: 'Profile', percentage: 20 },
        { source: 'Following', percentage: 10 },
        { source: 'Other', percentage: 5 }
      ]
    });
  } catch (error) {
    console.error('Video detail fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video analytics'
    });
  }
});

export default router;