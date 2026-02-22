import axios from 'axios';
import { PlatformService, PlatformAuthResult } from './platform.interface';

/**
 * Instagram Graph API Service
 *
 * Provides full Instagram Business account integration including:
 * - OAuth with Facebook
 * - Account insights (followers, reach, views)
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
    private readonly graphUrl = 'https://graph.facebook.com/v25.0';
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

        // 3. Get Instagram Business Account linked to Facebook Pages
        const userInfo = await this.getInstagramAccount(accessToken);

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
     * Get account insights (followers, reach, views)
     */
    async getInsights(accessToken: string, timeframe: string = 'this_week'): Promise<any> {
        const igAccount = await this.getInstagramAccount(accessToken);

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
            // Get follower and media counts directly from profile request (more reliable than period='day' insight)
            let followers = 0;
            let mediaCount = 0;
            let followsCount = 0;
            try {
                const profileResponse = await axios.get(`${this.graphUrl}/${igAccount.id}`, {
                    params: {
                        fields: 'followers_count,follows_count,media_count',
                        access_token: accessToken
                    }
                });
                followers = profileResponse.data.followers_count || 0;
                mediaCount = profileResponse.data.media_count || 0;
                followsCount = profileResponse.data.follows_count || 0;
            } catch (e2: any) {
            }

            // Determine since/until based on timeframe
            const until = Math.floor(Date.now() / 1000);
            let days = 30; // default to last 30 days
            if (timeframe === 'this_week') days = 7;
            else if (timeframe === 'last_14_days') days = 14;
            else if (timeframe === 'last_30_days') days = 30;
            else if (timeframe === 'last_90_days') days = 90;
            const since = until - (days * 24 * 60 * 60);

            // Helper to get the most recent metric value (used for reach with period=week or days_28)
            const getLatestMetricValue = (responseData: any): number => {
                const data = responseData?.data?.[0];
                if (!data) return 0;
                const values = data.values || [];
                return values.length > 0 ? values[values.length - 1]?.value || 0 : 0;
            };

            // Helper to sum all values in a period (used for day)
            const sumMetricValues = (responseData: any): number => {
                const data = responseData?.data?.[0];
                if (!data) return 0;
                const values = data.values || [];
                return values.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
            };

            // Try reach and views (separate metrics matching official dashboard)
            let reach = 0;
            let views = 0; // This will hold "views" (total content views including repeats)
            try {
                const reachResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: {
                        metric: 'reach',
                        period: 'day',
                        metric_type: 'total_value',
                        since,
                        until,
                        access_token: accessToken
                    }
                });
                reach = parseMetricValue(reachResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] reach error:', e.response?.data || e.message);
            }

            // Try views (total content views - matches "Views" on official dashboard)
            try {
                const viewsResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: {
                        metric: 'views',
                        period: 'day',
                        metric_type: 'total_value',
                        since,
                        until,
                        access_token: accessToken
                    }
                });
                views = parseMetricValue(viewsResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] views error:', e.response?.data?.error?.message || e.message);
                views = reach; // fallback to reach if views not available
            }

            // Engagement metrics - fetch natively using metric_type=total_value + period=day + timeframe
            let totalInteractions = 0, likes = 0, comments = 0, shares = 0;

            // Try likes
            try {
                const likesResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'likes', metric_type: 'total_value', period: 'day', since, until, access_token: accessToken }
                });
                likes = parseMetricValue(likesResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] likes error:', e.response?.data?.error?.message || e.message);
            }

            // Try comments
            try {
                const commentsResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'comments', metric_type: 'total_value', period: 'day', since, until, access_token: accessToken }
                });
                comments = parseMetricValue(commentsResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] comments error:', e.response?.data?.error?.message || e.message);
            }

            // Try shares
            try {
                const sharesResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'shares', metric_type: 'total_value', period: 'day', since, until, access_token: accessToken }
                });
                shares = parseMetricValue(sharesResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] shares error:', e.response?.data?.error?.message || e.message);
            }

            totalInteractions = likes + comments + shares;

            // Try saves
            let saves = 0;
            try {
                const savesResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'saves', metric_type: 'total_value', period: 'day', since, until, access_token: accessToken }
                });
                saves = parseMetricValue(savesResponse.data);
            } catch (e: any) {
                console.error('[InstagramGraph] saves error:', e.response?.data?.error?.message || e.message);
            }

            totalInteractions = likes + comments + shares + saves;

            // Try profile_views
            let profileViews = 0;
            try {
                const profileViewsResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: {
                      metric: 'profile_views',
                      metric_type: 'total_value',
                      period: 'day',
                      since,
                      until,
                      access_token: accessToken }
                });
                profileViews = parseMetricValue(profileViewsResponse.data);
            } catch (e: any) {
            }

            // Try accounts_engaged
            let accountsEngaged = 0;
            try {
                const accountsEngagedResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: {
                      metric: 'accounts_engaged',
                      metric_type: 'total_value',
                      period: 'day',
                      since,
                      until,
                      access_token: accessToken
                    }
                });
                accountsEngaged = parseMetricValue(accountsEngagedResponse.data);
            } catch (e: any) {
            }

            // Try profile_links_taps
            let profileLinkTaps = 0;
            try {
                const linkTapsResponse = await axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                    params: { metric: 'profile_links_taps', metric_type: 'total_value', period: 'day', since, until, access_token: accessToken }
                });
                profileLinkTaps = parseMetricValue(linkTapsResponse.data);
            } catch (e: any) {
            }


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
                            params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe, breakdown: 'age,gender', access_token: accessToken }
                        }),
                        axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                            params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe, breakdown: 'city', access_token: accessToken }
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
                }
            }

            const userInsightsData = {
                followers,
                following: followsCount,
                mediaCount,
                reach,
                views,
                totalInteractions,
                likes,
                comments,
                shares,
                saves,
                profileViews,
                profileLinkTaps,
                accountsEngaged,
                demographics
            };


            return userInsightsData;
        } catch (error: any) {
            console.error('[InstagramGraph] getInsights error:', error.response?.data || error.message);
            // Return empty insights on failure
            return {
                followers: 0,
                following: 0,
                mediaCount: 0,
                reach: 0,
                views: 0,
                totalInteractions: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                saves: 0,
                profileViews: 0,
                profileLinkTaps: 0,
                accountsEngaged: 0,
                demographics: {
                    gender: [],
                    age: [],
                    cities: []
                }
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
        // views and plays are deprecated in v22+, transitioning to 'views' for all media
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
                        case 'views': media.views = value; break;
                        case 'reach': media.reach = value; break;
                        case 'saved': media.save_count = value; break;
                        case 'shares': media.share_count = value; break;
                        case 'plays': media.video_views = value; break;
                        case 'video_views': media.video_views = value; break;
                        case 'views': media.video_views = value; break;
                    }
                }

                // For non-video media, use views as view proxy
                if (!isReel) {
                    media.video_views = media.views || media.reach || 0;
                } else if (!media.video_views) {
                    media.video_views = media.views || media.reach || 0;
                }
            } catch (e: any) {
                media.video_views = 0;
                media.views = 0;
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
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comment_count,share_count,save_count,reach,views',
                access_token: accessToken
            }
        });

        const data = response.data;

        // Match the shape returned by the TikTok endpoint for frontend compatibility
        const engagement = (data.like_count || 0) + (data.comment_count || 0) + (data.share_count || 0);
        const views = data.views || data.reach || 0; // views or reach as proxy for views in frontend
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
    async getAnalytics(accessToken: string, accountId: string, startDate: Date, endDate: Date, timeframe: string = 'this_week'): Promise<any> {
        const [profile, insights, media] = await Promise.all([
            this.getProfile(accessToken),
            this.getInsights(accessToken, timeframe),
            this.getMedia(accessToken)
        ]);

        const mediaArray = media.data || [];

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
