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
        // Determine video list
        const response = await axios.post(`${this.baseUrl}/video/list/`, {
            max_count: 20
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return response.data.data;
    }
}
