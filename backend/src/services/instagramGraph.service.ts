import axios from 'axios';
import { PlatformService, PlatformAuthResult } from './platform.interface';

/**
 * Instagram Graph API Service
 *
 * Provides full Instagram Business account integration including:
 * - OAuth with Facebook
 * - Account insights (followers, reach, impressions)
 * - Media insights
 * - User profile data
 *
 * Requires:
 * - Facebook Developer App with Instagram Graph API
 * - Instagram Business Account linked to Facebook Page
 */
export class InstagramGraphService implements PlatformService {
    private readonly appId: string;
    private readonly appSecret: string;
    private readonly redirectUri: string;
    private readonly graphUrl = 'https://graph.facebook.com/v18.0';
    private readonly authUrl = 'https://www.instagram.com/oauth/authorize';

    constructor() {
        this.appId = process.env.INSTAGRAM_GRAPH_APP_ID || '';
        this.appSecret = process.env.INSTAGRAM_GRAPH_APP_SECRET || '';
        this.redirectUri = process.env.INSTAGRAM_GRAPH_REDIRECT_URI || 'http://localhost:3000/auth/instagram-graph/callback';
    }

    /**
     * Get OAuth URL for Instagram Graph API
     * Requires instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement scopes
     */
    getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            scope: 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights',
            response_type: 'code',
            state: state || ''
        });
        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCode(code: string): Promise<PlatformAuthResult> {
        // 1. Exchange code for short-lived token
        const tokenResponse = await axios.get(`${this.graphUrl}/oauth/access_token`, {
            params: {
                client_id: this.appId,
                client_secret: this.appSecret,
                redirect_uri: this.redirectUri,
                code
            }
        });

        const shortLivedToken = tokenResponse.data.access_token;

        // 2. Exchange for long-lived token
        const longLivedResponse = await axios.get(`${this.graphUrl}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: this.appId,
                client_secret: this.appSecret,
                fb_exchange_token: shortLivedToken
            }
        });

        const accessToken = longLivedResponse.data.access_token;
        const expiresIn = longLivedResponse.data.expires_in;

        // 3. Get user info (Instagram Business Account)
        const userInfo = await this.getInstagramAccount(accessToken);

        // 4. Get profile picture
        const profile = await this.getProfile(accessToken);

        return {
            accessToken,
            refreshToken: accessToken, // Instagram Graph uses same token for refresh
            expiresIn,
            platformUserId: userInfo.id,
            username: userInfo.username,
            displayName: userInfo.name || userInfo.username,
            avatar: profile?.picture?.url
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(token: string): Promise<PlatformAuthResult> {
        const response = await axios.get(`${this.graphUrl}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: this.appId,
                client_secret: this.appSecret,
                fb_exchange_token: token
            }
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.access_token,
            expiresIn: response.data.expires_in,
            platformUserId: '',
            username: '',
            displayName: ''
        };
    }

    /**
     * Get Instagram Business Account info
     */
    async getInstagramAccount(accessToken: string): Promise<any> {
        // First get the Facebook user
        const fbUserResponse = await axios.get(`${this.graphUrl}/me`, {
            params: {
                fields: 'id,name',
                access_token: accessToken
            }
        });

        const fbUserId = fbUserResponse.data.id;

        // Then get Instagram account
        const igAccountResponse = await axios.get(`${this.graphUrl}/${fbUserId}/accounts`, {
            params: {
                fields: 'instagram_business_account{id,username,name}',
                access_token: accessToken
            }
        });

        const accounts = igAccountResponse.data.data;
        const igAccount = accounts?.find((acc: any) => acc.instagram_business_account);

        if (!igAccount?.instagram_business_account) {
            throw new Error('No Instagram Business Account found. Please link an Instagram account to your Facebook Page.');
        }

        return igAccount.instagram_business_account;
    }

    /**
     * Get user profile
     */
    async getProfile(accessToken: string): Promise<any> {
        const igAccount = await this.getInstagramAccount(accessToken);

        const response = await axios.get(`${this.graphUrl}/${igAccount.id}`, {
            params: {
                fields: 'id,username,name,profile_picture_url,media_count',
                access_token: accessToken
            }
        });

        return response.data;
    }

    /**
     * Get account insights (followers, reach, impressions)
     */
    async getInsights(accessToken: string): Promise<any> {
        const igAccount = await this.getInstagramAccount(accessToken);

        const response = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
            params: {
                fields: 'follower_count,following_count,media_count,total_reach,total_impressions',
                access_token: accessToken
            }
        });

        const insights = response.data.data || [];

        return {
            followers: insights.find((i: any) => i.name === 'follower_count')?.value || 0,
            following: insights.find((i: any) => i.name === 'following_count')?.value || 0,
            mediaCount: insights.find((i: any) => i.name === 'media_count')?.value || 0,
            reach: insights.find((i: any) => i.name === 'total_reach')?.value || 0,
            impressions: insights.find((i: any) => i.name === 'total_impressions')?.value || 0
        };
    }

    /**
     * Get media with insights
     */
    async getMedia(accessToken: string, limit: number = 25): Promise<any> {
        const igAccount = await this.getInstagramAccount(accessToken);

        const response = await axios.get(`${this.graphUrl}/${igAccount.id}/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comment_count,share_count,save_count,reach,impressions',
                access_token: accessToken,
                limit
            }
        });

        return response.data;
    }

    /**
     * Get insights for a specific media item
     */
    async getMediaInsights(accessToken: string, mediaId: string): Promise<any> {
        const response = await axios.get(`${this.graphUrl}/${mediaId}`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comment_count,share_count,save_count,reach,impressions',
                access_token: accessToken
            }
        });

        const data = response.data;
        
        // Match the shape returned by the TikTok endpoint for frontend compatibility
        const engagement = (data.like_count || 0) + (data.comment_count || 0) + (data.share_count || 0);
        const views = data.impressions || data.reach || 0; // impressions or reach as proxy for views in frontend
        const engagementRate = views > 0 ? (engagement / views) * 100 : 0;

        return {
            id: data.id,
            title: data.caption || 'Untitled Post',
            description: data.caption || '',
            thumbnail: data.thumbnail_url || data.media_url || '',
            cover_image_url: data.thumbnail_url || data.media_url || '',
            create_time: new Date(data.timestamp).getTime() / 1000,
            duration: 0, // Images don't have duration
            views: views,
            likes: data.like_count || 0,
            comments: data.comment_count || 0,
            shares: data.share_count || 0,
            engagement_rate: Math.round(engagementRate * 10) / 10
        };
    }

    /**
     * Get analytics data (combines profile + insights)
     */
    async getAnalytics(accessToken: string, accountId: string, startDate: Date, endDate: Date): Promise<any> {
        const [profile, insights, media] = await Promise.all([
            this.getProfile(accessToken),
            this.getInsights(accessToken),
            this.getMedia(accessToken)
        ]);

        return {
            profile,
            insights,
            media: media.data || []
        };
    }

    /**
     * Calculate engagement rate from media
     */
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
