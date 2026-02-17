import axios from 'axios';
import { PlatformService, PlatformAuthResult } from './platform.interface';

export class InstagramService implements PlatformService {
    private readonly appId: string;
    private readonly appSecret: string;
    private readonly redirectUri: string;
    private readonly baseUrl = 'https://graph.instagram.com';
    private readonly authUrl = 'https://api.instagram.com/oauth/authorize';

    constructor() {
        this.appId = process.env.INSTAGRAM_APP_ID || '';
        this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
        this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback';
    }

    getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            scope: 'user_profile,user_media',
            response_type: 'code',
            state: state || ''
        });
        return `${this.authUrl}?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<PlatformAuthResult> {
        // 1. Get Short-lived Token
        const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
            client_id: this.appId,
            client_secret: this.appSecret,
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
            code
        }));

        const { access_token, user_id } = tokenResponse.data;

        // 2. Exchange for Long-lived Token
        const longLivedResponse = await axios.get('https://graph.instagram.com/access_token', {
            params: {
                grant_type: 'ig_exchange_token',
                client_secret: this.appSecret,
                access_token
            }
        });

        const longLivedToken = longLivedResponse.data.access_token;
        const expiresIn = longLivedResponse.data.expires_in;

        // 3. Get User Profile
        const userProfile = await this.getProfile(longLivedToken);

        return {
            accessToken: longLivedToken,
            expiresIn,
            platformUserId: userProfile.id,
            username: userProfile.username,
            displayName: userProfile.username, // IG Basic Display doesn't always give display name
            avatar: undefined // IG Basic Display doesn't give avatar directly
        };
    }

    async refreshToken(token: string): Promise<PlatformAuthResult> {
        const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
            params: {
                grant_type: 'ig_refresh_token',
                access_token: token
            }
        });

        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
            platformUserId: '', // Not returned on refresh
            username: '',
            displayName: ''
        };
    }

    async getProfile(accessToken: string): Promise<any> {
        const response = await axios.get(`${this.baseUrl}/me`, {
            params: {
                fields: 'id,username,account_type,media_count',
                access_token: accessToken
            }
        });
        return response.data;
    }

    async getAnalytics(accessToken: string, accountId: string, startDate: Date, endDate: Date): Promise<any> {
        // Note: Basic Display API allows getting media list, but not deep account insights.
        // For insights, you need Instagram Graph API (Business accounts).
        // This implementation assumes Basic Display for MVP user context.

        const response = await axios.get(`${this.baseUrl}/me/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
                access_token: accessToken
            }
        });

        return response.data;
    }
}
