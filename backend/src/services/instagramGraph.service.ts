import axios from 'axios';
import { PlatformService, PlatformAuthResult } from './platform.interface';
import NodeCache from 'node-cache';

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
    private cache: NodeCache;

    constructor() {
        // Use the same app credentials as Basic API (client_id 1216837513935124)
        this.appId = process.env.INSTAGRAM_APP_ID || '';
        this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
        // But use the Graph API callback URL
        this.redirectUri = process.env.INSTAGRAM_GRAPH_REDIRECT_URI || (() => { throw new Error('INSTAGRAM_GRAPH_REDIRECT_URI environment variable is required'); })();
        // Initialize cache with 60-second Time To Live (TTL)
        this.cache = new NodeCache({ stdTTL: 60 });
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
    async getProfile(accessToken: string, igAccount?: any): Promise<any> {
        if (!igAccount) {
            igAccount = await this.getInstagramAccount(accessToken);
        }

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
    async getInsights(accessToken: string, timeframe: string = 'this_week', igAccount?: any): Promise<any> {
        if (!igAccount) {
            igAccount = await this.getInstagramAccount(accessToken);
        }

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

            let followers = 0;
            let mediaCount = 0;
            let followsCount = 0;

            // Try reach, views, and followers history concurrently
            let reach = 0;
            let views = 0;
            let historicalReach: { date: string, value: number }[] = [];
            let historicalFollowers: { date: string, value: number }[] = [];

            // Engagement metrics - fetch natively using grouped metric_type=total_value
            let totalInteractions = 0, likes = 0, comments = 0, shares = 0, saves = 0;
            let profileViews = 0, accountsEngaged = 0, profileLinkTaps = 0;
            let historicalLikes: { date: string; value: number }[] = [];
            let historicalComments: { date: string; value: number }[] = [];

            // Fetch demographics if the account has enough followers
            let demographics = {
                gender: [] as any[],
                age: [] as any[],
                cities: [] as any[]
            };

            try {
                // Kick off all 7 requests concurrently
                const [
                    profileRes,
                    reachRes,
                    viewsRes,
                    followersRes,
                    engagementRes,
                    ageGenderRes,
                    cityRes
                ] = await Promise.allSettled([
                    // 0. Profile stats (followers_count)
                    axios.get(`${this.graphUrl}/${igAccount.id}`, {
                        params: { fields: 'followers_count,follows_count,media_count', access_token: accessToken }
                    }),
                    // 1. Reach history
                    axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                        params: { metric: 'reach', period: 'day', since, until, access_token: accessToken }
                    }),
                    // 2. Views (total)
                    axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                        params: { metric: 'views', period: 'day', metric_type: 'total_value', since, until, access_token: accessToken }
                    }),
                    // 3. Followers history
                    axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                        params: { metric: 'follower_count', period: 'day', since, until, access_token: accessToken }
                    }),
                    // 4. Grouped engagement metrics
                    axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                        params: {
                            metric: 'likes,comments,shares,saves,profile_views,profile_links_taps,accounts_engaged',
                            metric_type: 'total_value', period: 'day', since, until, access_token: accessToken
                        }
                    }),
                    // 5. Demographics (Age/Gender)
                    axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                        params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe, breakdown: 'age,gender', access_token: accessToken }
                    }),
                    // 6. Demographics (City)
                    axios.get(`${this.graphUrl}/${igAccount.id}/insights`, {
                        params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe, breakdown: 'city', access_token: accessToken }
                    })
                ]);

                // Process Profile
                if (profileRes.status === 'fulfilled') {
                    followers = profileRes.value.data.followers_count || 0;
                    mediaCount = profileRes.value.data.media_count || 0;
                    followsCount = profileRes.value.data.follows_count || 0;
                }

                // Process Reach
                if (reachRes.status === 'fulfilled') {
                    const reachData = reachRes.value.data?.data?.[0]?.values || [];
                    historicalReach = reachData.map((v: any) => ({
                        date: v.end_time?.split('T')[0] || '',
                        value: v.value || 0
                    }));
                    reach = sumMetricValues(reachRes.value.data);
                }

                // Process Views
                if (viewsRes.status === 'fulfilled') {
                    views = parseMetricValue(viewsRes.value.data);
                } else {
                    views = reach; // fallback
                }

                // Process Followers
                if (followersRes.status === 'fulfilled') {
                    const followersData = followersRes.value.data?.data?.[0]?.values || [];
                    historicalFollowers = followersData.map((v: any) => ({
                        date: v.end_time?.split('T')[0] || '',
                        value: v.value || 0
                    }));
                }

                // Process Engagement
                if (engagementRes.status === 'fulfilled') {
                    const dataArray = engagementRes.value.data?.data || [];
                    const findMetric = (name: string) => {
                        const metricData = dataArray.find((m: any) => m.name === name);
                        return metricData ? metricData.total_value?.value || 0 : 0;
                    };
                    likes = findMetric('likes');
                    comments = findMetric('comments');
                    shares = findMetric('shares');
                    saves = findMetric('saves');
                    profileViews = findMetric('profile_views');
                    profileLinkTaps = findMetric('profile_links_taps');
                    accountsEngaged = findMetric('accounts_engaged');
                }

                // Process Demographics (only valid if followers >= 100 on Instagram's backend)
                if (ageGenderRes.status === 'fulfilled' && cityRes.status === 'fulfilled') {
                    const ageGenderBreakdown = ageGenderRes.value.data?.data?.[0]?.total_value?.breakdowns?.[0] || {};
                    const ageGenderData = ageGenderBreakdown.results || [];
                    const dimensionKeys = ageGenderBreakdown.dimension_keys || ['age', 'gender'];
                    const ageIdx = dimensionKeys.indexOf('age');
                    const genderIdx = dimensionKeys.indexOf('gender');

                    const cityData = cityRes.value.data?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];

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
                        name: (result.dimension_values?.[0] || "").split(',')[0],
                        count: result.value || 0
                    })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

                    const ages = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(group => ({ group, count: ageGenderMap.get(group) || 0 }));
                    const genders = ['Male', 'Female', 'Other'].map(gender => ({ gender, count: ageGenderMap.get(gender) || 0 }));

                    const totalGenderCount = genders.reduce((sum: number, g: {count: number}) => sum + g.count, 0) || 1;
                    const totalAgeCount = ages.reduce((sum: number, a: {count: number}) => sum + a.count, 0) || 1;
                    const totalCityCount = cities.reduce((sum: number, c: {count: number}) => sum + c.count, 0) || 1;

                    demographics = {
                        gender: genders.map(g => ({ gender: g.gender, percentage: Math.round((g.count / totalGenderCount) * 100) })),
                        age: ages.map(a => ({ label: a.group, percentage: Math.round((a.count / totalAgeCount) * 100) })),
                        cities: cities.map((c: any) => ({ name: c.name, percentage: Math.round((c.count / totalCityCount) * 100) }))
                    };
                }
            } catch (e) {
                console.error('[InstagramGraph] parallel insights error:', e);
            }

            totalInteractions = likes + comments + shares + saves;

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
                demographics,
                historical: {
                    reach: historicalReach,
                    followers: historicalFollowers,
                    likes: historicalLikes,
                    comments: historicalComments
                }
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
                },
                historical: {
                    reach: [],
                    followers: [],
                    likes: [],
                    comments: []
                }
            };
        }
    }

    /**
     * Get media with insights
     */
    async getMedia(accessToken: string, limit: number = 50, igAccount?: any): Promise<any> {
        if (!igAccount) {
            igAccount = await this.getInstagramAccount(accessToken);
        }

        const response = await axios.get(`${this.graphUrl}/${igAccount.id}/media`, {
            params: {
                fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
                access_token: accessToken,
                limit
            }
        });

        const mediaItems = response.data.data || [];
        if (mediaItems.length === 0) return { data: [] };

        // Construct a batch request to get all media insights in one network call
        // Facebook Graph API allows up to 50 requests per batch.
        const batchRequests = mediaItems.map((media: any) => ({
            method: 'GET',
            relative_url: `v25.0/${media.id}/insights?metric=reach,saved,shares,views`
        }));

        try {
            const batchResponse = await axios.post(`https://graph.facebook.com`, {
                access_token: accessToken,
                batch: JSON.stringify(batchRequests)
            });

            // The batch response is an array of responses corresponding to each request
            const batchResults = batchResponse.data || [];

            mediaItems.forEach((media: any, index: number) => {
                const result = batchResults[index];

                // Set default zero values
                media.views = 0; media.reach = 0; media.save_count = 0; media.share_count = 0; media.video_views = 0;

                if (result && result.code === 200) {
                    try {
                        const body = JSON.parse(result.body);
                        const insightsData = body.data || [];

                        for (const metric of insightsData) {
                            const value = metric.values?.[0]?.value ?? metric.total_value?.value ?? 0;
                            switch (metric.name) {
                                case 'views': media.views = value; break;
                                case 'reach': media.reach = value; break;
                                case 'saved': media.save_count = value; break;
                                case 'shares': media.share_count = value; break;
                            }
                        }
                    } catch (e) {
                        // Error parsing insight body for this item
                    }
                }

                const isReel = media.media_product_type === 'REELS';

                if (!isReel) {
                    media.video_views = media.views || media.reach || 0;
                } else if (!media.video_views) {
                    media.video_views = media.views || media.reach || 0;
                }

                // Normalize comment_count from comments_count
                if (media.comments_count !== undefined && media.comment_count === undefined) {
                    media.comment_count = media.comments_count;
                }
            });
        } catch (e: any) {
            console.error('[InstagramGraph] media batch insights error:', e.response?.data?.error?.message || e.message);
            // On failure, items will just have their base stats (likes, comments) from the first query and 0 for complex insights
        }

        return { data: mediaItems };
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
        const cacheKey = `ig_analytics_${accountId}_${timeframe}`;
        const cachedData = this.cache.get(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        // Fetch the base account once
        const igAccount = await this.getInstagramAccount(accessToken);

        const [profile, insights, media] = await Promise.all([
            this.getProfile(accessToken, igAccount),
            this.getInsights(accessToken, timeframe, igAccount),
            this.getMedia(accessToken, 50, igAccount)
        ]);

        const mediaArray = media.data || [];

        insights.following = profile.follows_count || 0;

        // Compute historical engagement (likes and comments) directly from media items, grouped by day
        // Initialize dailyEngagement with 0s for every day in the timeframe
        const dailyEngagement = new Map<string, { likes: number, comments: number }>();
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Zero-fill all days in the timeframe to ensure continuous lines and correct axis bounds
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            dailyEngagement.set(dateKey, { likes: 0, comments: 0 });
        }

        mediaArray.forEach((item: any) => {
            if (item.timestamp) {
                const dateKey = item.timestamp.split('T')[0];
                if (dailyEngagement.has(dateKey)) {
                    const existing = dailyEngagement.get(dateKey)!;
                    existing.likes += (item.like_count || 0);
                    // Use comments_count (Graph API standard) or comment_count (Basic Display)
                    existing.comments += (item.comments_count !== undefined ? item.comments_count : (item.comment_count || 0));
                }
            }
        });

        // Convert grouped data to sorted arrays
        const dates = Array.from(dailyEngagement.keys()).sort();
        const historicalLikes = dates.map(date => ({ date, value: dailyEngagement.get(date)!.likes }));
        const historicalComments = dates.map(date => ({ date, value: dailyEngagement.get(date)!.comments }));

        // Only overwrite the empty arrays if we actually have media data to show
        if (historicalLikes.length > 0) {
            insights.historical.likes = historicalLikes;
            insights.historical.comments = historicalComments;
        }

        const userInsightsData = {
            profile,
            insights,
            media: mediaArray
        };

        this.cache.set(cacheKey, userInsightsData);
        return userInsightsData;
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
