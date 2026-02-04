import axios from 'axios';
import { TikTokUserInfo, TikTokVideo, PlatformAnalytics } from '../types';

export class TikTokService {
  private clientId = process.env.TIKTOK_CLIENT_ID;
  private clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  private redirectUri = process.env.TIKTOK_REDIRECT_URI;
  private baseUrl = 'https://open.tiktokapis.com/v2';

  // Get authorization URL for OAuth flow
  getAuthUrl(): string {
    const scopes = ['user.info.basic', 'video.list'];
    const state = Math.random().toString(36).substring(7);
    
    return `https://www.tiktok.com/v2/auth/authorize/` +
      `?client_key=${this.clientId}` +
      `&scope=${scopes.join(',')}` +
      `&response_type=code` +
      `&redirect_uri=${this.redirectUri}` +
      `&state=${state}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    refresh_expires_in?: number;
    scope: string;
    token_type: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/access_token/`, null, {
        params: {
          client_key: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        }
      });

      return response.data.data;
    } catch (error) {
      throw new Error('Failed to exchange code for token');
    }
  }

  // Get user information
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/info/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.data.user;
    } catch (error) {
      throw new Error('Failed to fetch user info');
    }
  }

  // Get user's videos
  async getVideos(accessToken: string, cursor?: string, maxCount: number = 20): Promise<{
    videos: TikTokVideo[];
    has_more: boolean;
    cursor?: string;
  }> {
    try {
      const params: any = {
        max_count: maxCount
      };

      if (cursor) {
        params.cursor = cursor;
      }

      const response = await axios.get(`${this.baseUrl}/video/list/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params
      });

      return response.data.data;
    } catch (error) {
      throw new Error('Failed to fetch videos');
    }
  }

  // Calculate engagement metrics from user info and videos
  async calculateAnalytics(userInfo: TikTokUserInfo, videos: TikTokVideo[]): Promise<PlatformAnalytics> {
    const totalLikes = videos.reduce((sum, video) => sum + video.like_count, 0) + userInfo.likes_count;
    const totalComments = videos.reduce((sum, video) => sum + video.comment_count, 0);
    const totalShares = videos.reduce((sum, video) => sum + video.share_count, 0);
    const totalViews = videos.reduce((sum, video) => sum + video.view_count, 0);
    
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
      engagementRate: Math.round(engagementRate * 100) / 100 // Round to 2 decimal places
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    refresh_expires_in?: number;
    scope: string;
    token_type: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/refresh_token/`, null, {
        params: {
          client_key: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }
      });

      return response.data.data;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  // Verify token is still valid
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/verify_token/`, null, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data.data.valid;
    } catch (error) {
      return false;
    }
  }
}