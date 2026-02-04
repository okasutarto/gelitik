export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface TikTokUserInfo {
  open_id: string;
  union_id?: string;
  avatar_url: string;
  avatar_url_100?: string;
  avatar_large_url?: string;
  display_name: string;
  bio_description?: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export interface TikTokVideo {
  id: string;
  title: string;
  video_description?: string;
  duration: number;
  height: number;
  width: number;
  cover_image_url: string;
  embed_html?: string;
  embed_link?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  create_time: number;
}

export interface PlatformAnalytics {
  followers: number;
  following: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  engagementRate: number;
}

export interface DashboardData {
  overview: {
    totalFollowers: number;
    followerGrowth: number;
    avgEngagementRate: number;
    totalContent: number;
  };
  charts: {
    followerGrowth: Array<{ date: string; followers: number }>;
    engagementTrends: Array<{ date: string; rate: number }>;
    topPerformingContent: Array<{
      id: string;
      title: string;
      platform: string;
      engagement: number;
    }>;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}