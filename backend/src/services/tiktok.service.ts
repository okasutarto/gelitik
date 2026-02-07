import axios from 'axios';
import { PlatformService, PlatformAuthResult } from './platform.interface';

export class TikTokService implements PlatformService {
    private readonly clientKey: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;
    private readonly baseUrl = 'https://open.tiktokapis.com/v2';

    constructor() {
        this.clientKey = process.env.TIKTOK_CLIENT_ID || '';
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
        this.redirectUri = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/auth/tiktok/callback';
    }

    getAuthUrl(state: string = ''): string {
        const params = new URLSearchParams({
            client_key: this.clientKey,
            redirect_uri: this.redirectUri,
            scope: 'user.info.basic,video.list',
            response_type: 'code',
            state
        });
        return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<PlatformAuthResult> {
        const response = await axios.post(`${this.baseUrl}/oauth/token/`, new URLSearchParams({
            client_key: this.clientKey,
            client_secret: this.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token, expires_in, open_id } = response.data;

        // Fetch user info immediately to populate profile
        const userInfo = await this.getProfile(access_token);

        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresIn: expires_in,
            platformUserId: open_id,
            username: userInfo.display_name, // TikTok API v2 naming
            displayName: userInfo.display_name,
            avatar: userInfo.avatar_url
        };
    }

    async refreshToken(refreshToken: string): Promise<PlatformAuthResult> {
        const response = await axios.post(`${this.baseUrl}/oauth/token/`, new URLSearchParams({
            client_key: this.clientKey,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
            platformUserId: response.data.open_id,
            username: '',
            displayName: ''
        };
    }

    async getProfile(accessToken: string): Promise<any> {
        const response = await axios.get(`${this.baseUrl}/user/info/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                fields: 'display_name,avatar_url'
            }
        });
        return response.data.data.user;
    }

    async getAnalytics(accessToken: string, accountId: string, startDate: Date, endDate: Date): Promise<any> {
        const response = await axios.post(`${this.baseUrl}/video/list`, {
            max_count: 50
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const videos = response.data.data.videos || [];
        
        const totalLikes = videos.reduce((sum, video) => sum + (video.like_count || 0), 0);
        const totalComments = videos.reduce((sum, video) => sum + (video.comment_count || 0), 0);
        const totalShares = videos.reduce((sum, video) => sum + (video.share_count || 0), 0);
        const totalViews = videos.reduce((sum, video) => sum + (video.view_count || 0), 0);
        
        const totalEngagement = totalLikes + totalComments + totalShares;
        const avgEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
        
        return {
            videos: videos.map(video => ({
                id: video.id,
                title: video.title || video.video_description?.substring(0, 100) || 'Untitled',
                description: video.video_description || '',
                thumbnail: video.cover_image_url,
                createTime: new Date(video.create_time * 1000),
                likes: video.like_count || 0,
                comments: video.comment_count || 0,
                shares: video.share_count || 0,
                views: video.view_count || 0,
                engagement: (video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0),
                engagementRate: video.view_count > 0 
                    ? Math.round(((video.like_count + video.comment_count + video.share_count) / video.view_count) * 100)
                    : 0,
                shareUrl: video.share_url,
                embedLink: video.embed_link
            })),
            analytics: {
                totalLikes,
                totalComments,
                totalShares,
                totalViews,
                engagementRate: Math.round(avgEngagementRate),
                followers: 0,
                following: 0
            }
        };
    }
}
