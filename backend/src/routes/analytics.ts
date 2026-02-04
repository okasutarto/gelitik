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

export default router;