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
    // Graph API requires Facebook OAuth dialog (NOT Instagram's own OAuth)
    private readonly authUrl = 'https://www.facebook.com/dialog/oauth';

    constructor() {
        // Use the same app credentials as Basic API (client_id 1216837513935124)
        this.appId = process.env.INSTAGRAM_APP_ID || '';
        this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
        // But use the Graph API callback URL
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
            // Scopes for Instagram Graph API via Facebook OAuth
            // These require the Facebook Page + linked Instagram Business/Creator account
            scope: 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
            response_type: 'code',
            state: state || ''
        });
        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCode(code: string): Promise<PlatformAuthResult> {
        // 1. Exchange code for short-lived User Access Token (POST required by Meta)
        const tokenResponse = await axios.post(
            `https://graph.facebook.com/v18.0/oauth/access_token`,
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
        console.log('[Instagram Graph] Short-lived token obtained');

        // 2. Exchange for long-lived User Access Token (60 days)
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
        console.log('[Instagram Graph] Long-lived token obtained, expires in:', expiresIn, 'seconds');

        // 3. Get Instagram Business Account linked to Facebook Pages
        const userInfo = await this.getInstagramAccount(accessToken);
        console.log('[Instagram Graph] Instagram account found:', userInfo.username);

        // 4. Get full profile details
        const profile = await this.getProfile(accessToken);

        return {
            accessToken,
            refreshToken: accessToken, // Graph API long-lived tokens are refreshed with same token
            expiresIn,
            platformUserId: userInfo.id,
            username: userInfo.username,
            displayName: userInfo.name || userInfo.username,
            avatar: profile?.profile_picture_url || undefined
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
                fields: 'id,username,name,profile_picture_url,media_count,biography,follows_count,followers_count',
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
        console.log('[InstagramGraph] Getting insights for account:', igAccount.id, igAccount.username);

        // Helper to parse metric value - handles both regular and total_value formats
        const parseMetricValue = (responseData: any): number => {
            const data = responseData?.data?.[0];
            if (!data) return 0;
            // For metric_type=total_value: response has total_value.value
            if (data.total_value?.value !== undefined) {
                return data.total_value.value;
            }
            // For regular metrics: response has values array
            const values = data.values || [];
            return values.length > 0 ? values[values.length - 1]?.value || 0 : 0;
        };

        try {
            // Use day period - get most recent value (last item in array)
            // API returns: data[0].values = [{value: X, end_time: ...}, {value: Y, end_time: ...}]
            // We want the most recent (last one)

            // Try follower_count - use day period (API uses day, not days_28 or 28_days for this metric)
            let followers = 0;
            try {
                console.log('[InstagramGraph] Fetching follower_count with day...');
                const followerResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: {
                        metric: 'follower_count',
                        period: 'day',
                        access_token: accessToken
                    }
                });
                console.log('[InstagramGraph] follower_count response:', JSON.stringify(followerResponse.data));
                const followerValues = followerResponse.data.data?.[0]?.values || [];
                followers = followerValues.length > 0 ? followerValues[followerValues.length - 1]?.value || 0 : 0;
            } catch (e: any) {
                console.log('[InstagramGraph] follower_count day failed:', e.response?.data?.error?.message);
            }

            // Also get media count and following from profile
            let mediaCount = 0;
            let followsCount = 0;
            try {
                console.log('[InstagramGraph] Trying to get profile data...');
                const profileResponse = await axios.get(`${this.graphUrl}/${igAccount.id}`, {
                    params: {
                        fields: 'followers_count,follows_count,media_count',
                        access_token: accessToken
                    }
                });
                console.log('[InstagramGraph] profile response:', JSON.stringify(profileResponse.data));
                if (followers === 0) {
                    followers = profileResponse.data.followers_count || 0;
                }
                mediaCount = profileResponse.data.media_count || 0;
                followsCount = profileResponse.data.follows_count || 0;
            } catch (e2: any) {
                console.log('[InstagramGraph] profile error:', e2.response?.data?.error?.message || e2.message);
            }

            // Try reach
            let reach = 0;
            try {
                console.log('[InstagramGraph] Fetching reach...');
                const reachResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: {
                        metric: 'reach',
                        period: 'day',
                        access_token: accessToken
                    }
                });
                console.log('[InstagramGraph] reach response:', JSON.stringify(reachResponse.data));
                const reachValues = reachResponse.data.data?.[0]?.values || [];
                reach = reachValues.length > 0 ? reachValues[reachValues.length - 1]?.value || 0 : 0;
            } catch (e: any) {
                console.error('[InstagramGraph] reach error:', e.response?.data || e.message);
                // reach not available, continue
            }

            // Try engagement metrics - get individual metrics
            let totalInteractions = 0, likes = 0, comments = 0, shares = 0;

            // Try likes (requires metric_type=total_value)
            try {
                console.log('[InstagramGraph] Fetching likes...');
                const likesResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'likes', period: 'day', metric_type: 'total_value', access_token: accessToken }
                });
                console.log('[InstagramGraph] likes response:', JSON.stringify(likesResponse.data));
                likes = parseMetricValue(likesResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] likes error:', e.response?.data || e.message);
            }

            // Try comments (requires metric_type=total_value)
            try {
                console.log('[InstagramGraph] Fetching comments...');
                const commentsResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'comments', period: 'day', metric_type: 'total_value', access_token: accessToken }
                });
                console.log('[InstagramGraph] comments response:', JSON.stringify(commentsResponse.data));
                comments = parseMetricValue(commentsResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] comments error:', e.response?.data || e.message);
            }

            // Try shares (requires metric_type=total_value)
            try {
                console.log('[InstagramGraph] Fetching shares...');
                const sharesResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'shares', period: 'day', metric_type: 'total_value', access_token: accessToken }
                });
                console.log('[InstagramGraph] shares response:', JSON.stringify(sharesResponse.data));
                shares = parseMetricValue(sharesResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] shares error:', e.response?.data || e.message);
            }

            // Try profile_views
            let profileViews = 0;
            try {
                console.log('[InstagramGraph] Fetching profile_views...');
                const profileViewsResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'profile_views', period: 'day', metric_type: 'total_value', access_token: accessToken }
                });
                console.log('[InstagramGraph] profile_views response:', JSON.stringify(profileViewsResponse.data));
                profileViews = parseMetricValue(profileViewsResponse.data);
            } catch (e: any) {
                console.log('[InstagramGraph] profile_views error:', e.response?.data?.error?.message || e.message);
            }

            // Try accounts_engaged
            let accountsEngaged = 0;
            try {
                console.log('[InstagramGraph] Fetching accounts_engaged...');
                const accountsEngagedResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'accounts_engaged', period: 'day', metric_type: 'total_value', access_token: accessToken }
                });
                console.log('[InstagramGraph] accounts_engaged response:', JSON.stringify(accountsEngagedResponse.data));
                accountsEngaged = parseMetricValue(accountsEngagedResponse.data);
            } catch (e: any) {
                console.log('[InstagramGraph] accounts_engaged error:', e.response?.data?.error?.message || e.message);
            }

            totalInteractions = likes + comments + shares;

            console.log('[InstagramGraph] Final values - followers:', followers, 'reach:', reach, 'interactions:', totalInteractions);

            // Fetch demographics if the account has enough followers
            let demographics = {
                gender: [] as any[],
                age: [] as any[],
                cities: [] as any[]
            };

            if (followers >= 100) {
                try {
                    const [ageGenderRes, cityRes] = await Promise.all([
                        axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                            params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe: 'last_30_days', breakdown: 'age,gender', access_token: accessToken }
                        }),
                        axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                            params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe: 'last_30_days', breakdown: 'city', access_token: accessToken }
                        })
                    ]);

                    const ageGenderBreakdown = ageGenderRes.data?.data?.[0]?.total_value?.breakdowns?.[0] || {};
                    const ageGenderData = ageGenderBreakdown.results || [];
                    const dimensionKeys = ageGenderBreakdown.dimension_keys || ['age', 'gender'];
                    const ageIdx = dimensionKeys.indexOf('age');
                    const genderIdx = dimensionKeys.indexOf('gender');

                    const cityData = cityRes.data?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];

                    const ageGenderMap = new Map<string, number>();
                    ageGenderData.forEach((result: any) => {
                        const ageInfo = ageIdx >= 0 ? result.dimension_values?.[ageIdx] : null;
                        const genderInfo = genderIdx >= 0 ? result.dimension_values?.[genderIdx] : null;
                        const value = result.value || 0;
                        if (ageInfo) ageGenderMap.set(ageInfo, (ageGenderMap.get(ageInfo) || 0) + value);
                        if (genderInfo) {
                            let genderKey = 'Other';
                            if (genderInfo === 'M') genderKey = 'Male';
                            else if (genderInfo === 'F') genderKey = 'Female';
                            else if (genderInfo === 'U' || genderInfo === 'O') genderKey = 'Other';
                            ageGenderMap.set(genderKey, (ageGenderMap.get(genderKey) || 0) + value);
                        }
                    });

                    const cities = cityData.map((result: any) => ({
                        name: (result.dimension_values?.[0] || "").split(',')[0], // Map to 'name' for TopCitiesPanel
                        count: result.value || 0
                    })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

                    const ages = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(group => ({ group, count: ageGenderMap.get(group) || 0 }));
                    const genders = ['Male', 'Female', 'Other'].map(gender => ({ gender, count: ageGenderMap.get(gender) || 0 }));

                    const totalGenderCount = genders.reduce((sum: number, g: {count: number}) => sum + g.count, 0) || 1;
                    const totalAgeCount = ages.reduce((sum: number, a: {count: number}) => sum + a.count, 0) || 1;
                    const totalCityCount = cities.reduce((sum: number, c: {count: number}) => sum + c.count, 0) || 1;

                    demographics = {
                        gender: genders.map(g => ({ gender: g.gender, percentage: Math.round((g.count / totalGenderCount) * 100) })),
                        age: ages.map(a => ({ label: a.group, percentage: Math.round((a.count / totalAgeCount) * 100) })), // Map to 'label' for AgeRangePanel
                        cities: cities.map((c: any) => ({ name: c.name, percentage: Math.round((c.count / totalCityCount) * 100) })) // Map to 'name' for TopCitiesPanel
                    };
                } catch (e: any) {
                    console.log('[InstagramGraph] Demographics error:', e.response?.data?.error?.message || e.message);
                }
            }

            return {
                followers,
                following: followsCount,
                mediaCount,
                reach,
                impressions: reach,
                totalInteractions,
                likes,
                comments,
                shares,
                profileViews,
                accountsEngaged,
                demographics
            };
        } catch (error: any) {
            console.error('[InstagramGraph] getInsights error:', error.response?.data || error.message);
            // Return empty insights on failure
            return {
                followers: 0,
                following: 0,
                mediaCount: 0,
                reach: 0,
                impressions: 0,
                totalInteractions: 0,
                likes: 0,
                comments: 0,
                shares: 0
            };
        }
    }

    /**
     * Get media with insights
     */
    async getMedia(accessToken: string, limit: number = 50): Promise<any> {
        const igAccount = await this.getInstagramAccount(accessToken);

        const response = await axios.get(`${this.graphUrl}/${igAccount.id}/media`, {
            params: {
                fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
                access_token: accessToken,
                limit
            }
        });

        const mediaItems = response.data.data || [];

        // For each media item, fetch per-media insights
        // impressions and plays are deprecated in v22+, transitioning to 'views' for all media
        const mediaWithInsights = await Promise.all(mediaItems.map(async (media: any) => {
            try {
                // Use the new standard 'views' metric, universally available in v25.0
                const isReel = media.media_product_type === 'REELS';
                const metrics = 'reach,saved,shares,views';

                const insightsResponse = await axios.get(`${this.graphUrl}/${media.id}/insights`, {
                    params: {
                        metric: metrics,
                        access_token: accessToken
                    }
                });

                const insightsData = insightsResponse.data.data || [];
                for (const metric of insightsData) {
                    const value = metric.values?.[0]?.value ?? metric.total_value?.value ?? 0;
                    switch (metric.name) {
                        case 'impressions': media.impressions = value; break;
                        case 'reach': media.reach = value; break;
                        case 'saved': media.save_count = value; break;
                        case 'shares': media.share_count = value; break;
                        case 'plays': media.video_views = value; break;
                        case 'video_views': media.video_views = value; break;
                        case 'views': media.video_views = value; break;
                    }
                }

                // For non-video media, use impressions as view proxy
                if (!isReel) {
                    media.video_views = media.impressions || media.reach || 0;
                } else if (!media.video_views) {
                    media.video_views = media.impressions || media.reach || 0;
                }
            } catch (e: any) {
                console.log('[InstagramGraph] insights error for media', media.id, ':', e.response?.data?.error?.message || e.message);
                media.video_views = 0;
                media.impressions = 0;
                media.reach = 0;
                media.save_count = 0;
                media.share_count = 0;
            }

            // Normalize comment_count from comments_count
            if (media.comments_count !== undefined && media.comment_count === undefined) {
                media.comment_count = media.comments_count;
            }

            return media;
        }));

        return { data: mediaWithInsights };
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

        const mediaArray = media.data || [];

        // Aggregate total saves and interactions from media
        let totalSaves = 0;
        let totalInteractions = 0;

        for (const item of mediaArray) {
            totalSaves += (item.save_count || 0);
            totalInteractions += (item.like_count || 0) + (item.comments_count || item.comment_count || 0) + (item.share_count || 0) + (item.save_count || 0);
        }

        // Attach aggregated metrics to insights
        insights.saves = totalSaves;
        insights.totalInteractions = totalInteractions;
        insights.following = profile.follows_count || 0;

        return {
            profile,
            insights,
            media: mediaArray
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
