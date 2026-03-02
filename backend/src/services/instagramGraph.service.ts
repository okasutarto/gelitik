import { PlatformService, PlatformAuthResult } from './platform.interface';
import { InstagramAuthService } from './instagramAuth.service';
import { InstagramInsightsService } from './instagramInsights.service';
import { InstagramMediaService } from './instagramMedia.service';
import NodeCache from 'node-cache';

/**
 * Instagram Graph API Service - Facade
 *
 * Provides full Instagram Business account integration by delegating to specialized services:
 * - InstagramAuthService: OAuth flows and account discovery
 * - InstagramInsightsService: Account and media insights
 * - InstagramMediaService: Media operations
 *
 * Requires:
 * - Facebook Developer App with Instagram Graph API
 * - Instagram Business Account linked to Facebook Page
 */
export class InstagramGraphService implements PlatformService {
    private readonly authService: InstagramAuthService;
    private readonly insightsService: InstagramInsightsService;
    private readonly mediaService: InstagramMediaService;
    private cache: NodeCache;

    constructor() {
        this.authService = new InstagramAuthService();
        this.insightsService = new InstagramInsightsService();
        this.mediaService = new InstagramMediaService();
        this.cache = new NodeCache({ stdTTL: 60 });
    }

    getAuthUrl(state?: string): string {
        return this.authService.getAuthUrl(state);
    }

    async exchangeCode(code: string): Promise<PlatformAuthResult> {
        return this.authService.exchangeCode(code);
    }

    async refreshToken(token: string): Promise<PlatformAuthResult> {
        return this.authService.refreshToken(token);
    }

    async getInstagramAccount(accessToken: string): Promise<any> {
        return this.authService.getInstagramAccount(accessToken);
    }

    async getProfile(accessToken: string, igAccount?: any): Promise<any> {
        return this.authService.getProfile(accessToken, igAccount);
    }

    async getInsights(accessToken: string, timeframe: string = 'this_week', igAccount?: any): Promise<any> {
        if (!igAccount) {
            igAccount = await this.authService.getInstagramAccount(accessToken);
        }
        return this.insightsService.getInsights(accessToken, igAccount.id, timeframe);
    }

    async getMedia(accessToken: string, limit: number = 50, igAccount?: any): Promise<any> {
        if (!igAccount) {
            igAccount = await this.authService.getInstagramAccount(accessToken);
        }
        return this.mediaService.getMedia(accessToken, igAccount.id, limit);
    }

    async getMediaInsights(accessToken: string, mediaId: string): Promise<any> {
        return this.mediaService.getMediaInsights(accessToken, mediaId);
    }

    async getAnalytics(
        accessToken: string,
        accountId: string,
        startDate: Date,
        endDate: Date,
        timeframe: string = 'this_week'
    ): Promise<any> {
        const cacheKey = `ig_analytics_${accountId}_${timeframe}`;
        const cachedData = this.cache.get(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const igAccount = await this.authService.getInstagramAccount(accessToken);

        const [profile, insights, media] = await Promise.all([
            this.authService.getProfile(accessToken, igAccount),
            this.insightsService.getInsights(accessToken, igAccount.id, timeframe),
            this.mediaService.getMedia(accessToken, igAccount.id, 50)
        ]);

        const mediaArray = media.data || [];

        insights.following = profile.follows_count || 0;

        // Compute historical engagement from media items
        const dailyEngagement = new Map<string, { likes: number, comments: number }>();
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            dailyEngagement.set(dateKey, { likes: 0, comments: 0 });
        }

        mediaArray.forEach((item: any) => {
            if (item.timestamp) {
                const dateKey = item.timestamp.split('T')[0];
                if (dailyEngagement.has(dateKey)) {
                    const existing = dailyEngagement.get(dateKey)!;
                    existing.likes += (item.like_count || 0);
                    existing.comments += (item.comments_count !== undefined ? item.comments_count : (item.comment_count || 0));
                }
            }
        });

        const dates = Array.from(dailyEngagement.keys()).sort();
        const historicalLikes = dates.map(date => ({ date, value: dailyEngagement.get(date)!.likes }));
        const historicalComments = dates.map(date => ({ date, value: dailyEngagement.get(date)!.comments }));

        if (historicalLikes.length > 0) {
            insights.historical.likes = historicalLikes;
            insights.historical.comments = historicalComments;
        }

        const userInsightsData = {
            profile,
            insights,
            media: mediaArray
        };

        this.cache.set(cacheKey, userInsightsData);
        return userInsightsData;
    }

    calculateEngagementRate(media: any[]): number {
        if (!media?.length) return 0;

        const totalEngagement = media.reduce((sum, m) => {
            return sum + (m.like_count || 0) + (m.comment_count || 0) + (m.share_count || 0);
        }, 0);

        const totalReach = media.reduce((sum, m) => {
            return sum + (m.reach || 0);
        }, 0);

        return totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
    }
}

export default InstagramGraphService;
