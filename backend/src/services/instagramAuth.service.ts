import axios from 'axios';
import { PlatformAuthResult } from './platform.interface';

const GRAPH_API_VERSION = 'v25.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class InstagramAuthService {
    private readonly appId: string;
    private readonly appSecret: string;
    private readonly redirectUri: string;
    private readonly authUrl = 'https://www.facebook.com/dialog/oauth';

    constructor() {
        this.appId = process.env.INSTAGRAM_APP_ID || '';
        this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
        this.redirectUri = process.env.INSTAGRAM_GRAPH_REDIRECT_URI || (() => {
            throw new Error('INSTAGRAM_GRAPH_REDIRECT_URI environment variable is required');
        })();
    }

    getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            scope: 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
            response_type: 'code',
            state: state || ''
        });
        return `${this.authUrl}?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<PlatformAuthResult> {
        // 1. Exchange code for short-lived User Access Token
        const tokenResponse = await axios.post(
            `${GRAPH_API_BASE}/oauth/access_token`,
            null,
            {
                params: {
                    client_id: this.appId,
                    client_secret: this.appSecret,
                    redirect_uri: this.redirectUri,
                    code
                }
            }
        );

        const shortLivedToken = tokenResponse.data.access_token;

        // 2. Exchange for long-lived User Access Token (60 days)
        const longLivedResponse = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: this.appId,
                client_secret: this.appSecret,
                fb_exchange_token: shortLivedToken
            }
        });

        const accessToken = longLivedResponse.data.access_token;
        const expiresIn = longLivedResponse.data.expires_in;

        // 3. Get Instagram Business Account
        const igAccount = await this.getInstagramAccount(accessToken);

        // 4. Get full profile details
        const profile = await this.getProfile(accessToken, igAccount);

        return {
            accessToken,
            refreshToken: accessToken,
            expiresIn,
            platformUserId: igAccount.id,
            username: igAccount.username,
            displayName: igAccount.name || igAccount.username,
            avatar: profile?.profile_picture_url || undefined
        };
    }

    async refreshToken(token: string): Promise<PlatformAuthResult> {
        const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
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

    async getInstagramAccount(accessToken: string): Promise<{ id: string; username: string; name?: string }> {
        // Get Facebook user
        const fbUserResponse = await axios.get(`${GRAPH_API_BASE}/me`, {
            params: { fields: 'id,name', access_token: accessToken }
        });

        const fbUserId = fbUserResponse.data.id;

        // Get Instagram account
        const igAccountResponse = await axios.get(`${GRAPH_API_BASE}/${fbUserId}/accounts`, {
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

    async getProfile(accessToken: string, igAccount?: { id: string }): Promise<any> {
        if (!igAccount) {
            igAccount = await this.getInstagramAccount(accessToken);
        }

        const response = await axios.get(`${GRAPH_API_BASE}/${igAccount.id}`, {
            params: {
                fields: 'id,username,name,profile_picture_url,media_count,biography,follows_count,followers_count',
                access_token: accessToken
            }
        });

        return response.data;
    }
}

export default InstagramAuthService;
