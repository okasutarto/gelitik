import axios from 'axios';
import crypto from 'crypto';
import { TikTokUserInfo, TikTokVideo, PlatformAnalytics } from '../types';
import { PlatformService } from './platform.interface';

export class TikTokService implements PlatformService {
  private clientId = process.env.TIKTOK_CLIENT_ID;
  private clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  private redirectUri = process.env.TIKTOK_REDIRECT_URI;
  private baseUrl = 'https://open.tiktokapis.com/v2';

  getAuthUrl(state?: string, codeChallenge?: string): string {
    const scopes = ['user.info.profile', 'user.info.stats', 'video.list'];
    const authState = state || Math.random().toString(36).substring(7);
    const clientId = this.clientId || '';
    const redirectUri = this.redirectUri || '';

    let url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(',')}&response_type=code&state=${authState}`;

    if (codeChallenge) {
      url += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    }

    return url;
  }

  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async exchangeCode(code: string, codeVerifier?: string): Promise<any> {
    try {
      const tokenData = await this.exchangeCodeForToken(code, codeVerifier);
      const userInfo = await this.getUserInfo(tokenData.access_token) as TikTokUserInfo;

      if (process.env.NODE_ENV === 'development') {
        console.log('[TikTok] userInfo object:', userInfo);
      }

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        platformUserId: userInfo.open_id,
        username: userInfo.display_name,
        displayName: userInfo.display_name,
        avatar: userInfo.avatar_url,
        scope: tokenData.scope
      };
    } catch (error) {
      console.error('[TikTok] Exchange code error:', error);
      if (axios.isAxiosError(error)) {
        console.error('[TikTok] Response data:', error.response?.data);
        console.error('[TikTok] Response status:', error.response?.status);
      }
      throw new Error('Failed to exchange code for token');
    }
  }

  async exchangeCodeForToken(code: string, codeVerifier?: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    refresh_expires_in?: string;
    scope: string;
    token_type: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('client_key', this.clientId || '');
      params.append('client_secret', this.clientSecret || '');
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', this.redirectUri || '');
      if (codeVerifier) {
        params.append('code_verifier', codeVerifier);
      }

      const response = await axios.post(`${this.baseUrl}/oauth/token/`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[TikTok] Token response:', response.data);
        console.log('[TikTok] Token scopes:', response.data.scope);
      }

      return response.data;
    } catch (error) {
      console.error('[TikTok] Exchange code error:', error);
      if (axios.isAxiosError(error)) {
        console.error('[TikTok] Response data:', error.response?.data);
        console.error('[TikTok] Response status:', error.response?.status);
      }
      throw new Error('Failed to exchange code for token');
    }
  }

  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      const fields = 'open_id,union_id,avatar_url,avatar_url_100,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count';
      const response = await axios.get(`${this.baseUrl}/user/info/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { fields }
      });

      const user = (response.data as any).data?.user;
      if (!user) {
        throw new Error('No user data in response');
      }

      return user as TikTokUserInfo;
    } catch (error) {
      console.error('[TikTok] Get user info error:', error);
      if (axios.isAxiosError(error)) {
        console.error('[TikTok] Response data:', error.response?.data);
        console.error('[TikTok] Response status:', error.response?.status);
      }
      throw new Error('Failed to fetch user info');
    }
  }

  async getProfile(accessToken: string): Promise<any> {
    return this.getUserInfo(accessToken);
  }

  async getVideos(accessToken: string, cursor?: string, maxCount: number = 50): Promise<{
    videos: TikTokVideo[];
    has_more: boolean;
    cursor?: string;
  }> {
    try {
      const params: any = {
        max_count: maxCount,
        fields: 'id,video_description,create_time,like_count,comment_count,share_count,view_count,cover_image_url,embed_link,duration,height,width'
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const response = await axios.post(
        `${this.baseUrl}/video/list/`,
        {},
        {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[TikTok] Videos response:', response.data);
      }

      const videos = response.data?.data?.videos || [];
      return {
        videos,
        has_more: response.data?.data?.has_more || false,
        cursor: response.data?.data?.cursor
      };
    } catch (error: any) {
      console.error('[TikTok] Get videos error detail:', error.response?.data || error.message);
      throw new Error('Failed to fetch videos');
    }
  }

  async calculateAnalytics(userInfo: TikTokUserInfo, videos: TikTokVideo[]): Promise<PlatformAnalytics> {
    const totalLikes = videos.reduce((sum: number, video) => sum + video.like_count, 0) + userInfo.likes_count;
    const totalComments = videos.reduce((sum: number, video) => sum + video.comment_count, 0);
    const totalShares = videos.reduce((sum: number, video) => sum + video.share_count, 0);
    const totalViews = videos.reduce((sum: number, video) => sum + video.view_count, 0);

    const totalEngagement = totalLikes + totalComments + totalShares;
    const totalImpressions = totalViews || userInfo.follower_count;

    const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

    return {
      followers: userInfo.follower_count,
      following: userInfo.following_count,
      totalLikes,
      totalComments,
      totalShares,
      totalViews,
      engagementRate: Math.round(engagementRate * 100) / 100
    };
  }

  async refreshTokenForToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    refresh_expires_in?: number;
    scope: string;
    token_type: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('client_key', this.clientId || '');
      params.append('client_secret', this.clientSecret || '');
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);

      const response = await axios.post(`${this.baseUrl}/oauth/token/`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[TikTok] Refresh token error detail:', error);
      if (axios.isAxiosError(error)) {
        console.error('[TikTok] Response data:', error.response?.data);
        console.error('[TikTok] Response status:', error.response?.status);
      }
      throw new Error('Failed to refresh token');
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const tokenData = await this.refreshTokenForToken(refreshToken);
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        platformUserId: '',
        username: '',
        displayName: ''
      };
    } catch (error) {
      console.error('[TikTok] Refresh token error:', error);
      if (axios.isAxiosError(error)) {
        console.error('[TikTok] Response data:', error.response?.data);
        console.error('[TikTok] Response status:', error.response?.status);
      }
      throw new Error('Failed to refresh token');
    }
  }

  async getAnalytics(accessToken: string, accountId: string, startDate: Date, endDate: Date): Promise<any> {
    const videosData = await this.getVideos(accessToken, undefined, 50);
    const userInfo = await this.getUserInfo(accessToken);
    const analytics = await this.calculateAnalytics(userInfo, videosData.videos);

    return {
      videos: videosData.videos,
      analytics,
      userInfo
    };
  }

  async getVideoDetails(accessToken: string, videoId: string): Promise<TikTokVideo> {
    try {
      // Use the official TikTok Display API /v2/video/query/ endpoint
      const fields = 'id,title,video_description,duration,cover_image_url,like_count,comment_count,share_count,view_count';
      const response = await axios.post(
        `${this.baseUrl}/video/query/?fields=${fields}`,
        {
          filters: {
            video_ids: [videoId]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[TikTok] Video query response:', response.data);
      }

      const videos = response.data?.data?.videos || [];

      if (videos.length === 0) {
        throw new Error(`Video with ID ${videoId} not found`);
      }

      return videos[0] as TikTokVideo;
    } catch (error) {
      console.error('[TikTok] Get video details error:', error);
      if (axios.isAxiosError(error)) {
        console.error('[TikTok] Response data:', error.response?.data);
        console.error('[TikTok] Response status:', error.response?.status);
      }
      throw new Error('Failed to fetch video details');
    }
  }

  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/verify_token/`, null, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.valid;
    } catch (error) {
      return false;
    }
  }
}
