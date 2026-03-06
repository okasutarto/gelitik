import axios from 'axios';
import NodeCache from 'node-cache';

const GRAPH_API_VERSION = 'v25.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface InstagramInsights {
    followers: number;
    following: number;
    mediaCount: number;
    reach: number;
    views: number;
    totalInteractions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    profileViews: number;
    profileLinkTaps: number;
    websiteClicks: number;
    accountsEngaged: number;
    demographics: {
        gender: { gender: string; percentage: number }[];
        age: { label: string; percentage: number }[];
        cities: { name: string; percentage: number }[];
    };
    historical: {
        reach: { date: string; value: number }[];
        followers: { date: string; value: number }[];
        views: { date: string; value: number }[];
        likes: { date: string; value: number }[];
        comments: { date: string; value: number }[];
    };
}

export class InstagramInsightsService {
    private readonly graphUrl = GRAPH_API_BASE;
    private cache: NodeCache;

    constructor() {
        // Cache for 5 minutes
        this.cache = new NodeCache({ stdTTL: 300 });
    }

    /**
     * Parse metric value - handles both regular and total_value formats
     */
    private parseMetricValue(responseData: any): number {
        const data = responseData?.data?.[0];
        if (!data) return 0;
        if (data.total_value?.value !== undefined) {
            return data.total_value.value;
        }
        const values = data.values || [];
        return values.length > 0 ? values[values.length - 1]?.value || 0 : 0;
    }

    /**
     * Sum all values in a period
     */
    private sumMetricValues(responseData: any): number {
        const data = responseData?.data?.[0];
        if (!data) return 0;
        const values = data.values || [];
        return values.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    }

    /**
     * Get account insights (followers, reach, views)
     */
    async getInsights(
        accessToken: string,
        igAccountId: string,
        timeframe: string = 'this_week'
    ): Promise<InstagramInsights> {
        // Check cache first
        const cacheKey = `ig_insights_${igAccountId}_${timeframe}`;
        const cachedData = this.cache.get<InstagramInsights>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const until = Math.floor(Date.now() / 1000);
            let days = 30;
            if (timeframe === 'this_week') days = 7;
            else if (timeframe === 'last_14_days') days = 14;
            else if (timeframe === 'last_30_days') days = 30;
            else if (timeframe === 'last_90_days') days = 90;
            const since = until - (days * 24 * 60 * 60);

            let followers = 0, mediaCount = 0, followsCount = 0;
            let reach = 0, views = 0;
            let historicalReach: { date: string; value: number }[] = [];
            let historicalFollowers: { date: string; value: number }[] = [];
            let historicalViews: { date: string; value: number }[] = [];
            let totalInteractions = 0, likes = 0, comments = 0, shares = 0, saves = 0;
            let profileViews = 0, profileLinkTaps = 0, websiteClicks = 0, accountsEngaged = 0;

            const demographics = {
                gender: [] as any[],
                age: [] as any[],
                cities: [] as any[]
            };

            const [
                profileRes,
                reachRes,
                viewsRes,
                viewsHistoricalRes,
                followersRes,
                engagementRes,
                ageGenderRes,
                cityRes
            ] = await Promise.allSettled([
                axios.get(`${this.graphUrl}/${igAccountId}`, {
                    params: { fields: 'followers_count,follows_count,media_count', access_token: accessToken }
                }),
                axios.get(`${this.graphUrl}/${igAccountId}/insights`, {
                    params: { metric: 'reach', period: 'day', since, until, access_token: accessToken }
                }),
                axios.get(`${this.graphUrl}/${igAccountId}/insights`, {
                    params: { metric: 'views', period: 'day', metric_type: 'total_value', since, until, access_token: accessToken }
                }),
                // Historical views for chart (daily data, without total_value)
                axios.get(`${this.graphUrl}/${igAccountId}/insights`, {
                    params: { metric: 'views', period: 'day', since, until, access_token: accessToken }
                }),
                axios.get(`${this.graphUrl}/${igAccountId}/insights`, {
                    params: { metric: 'follower_count', period: 'day', since, until, access_token: accessToken }
                }),
                axios.get(`${this.graphUrl}/${igAccountId}/insights`, {
                    params: {
                        metric: 'likes,comments,shares,saves,profile_views,profile_links_taps,website_clicks,accounts_engaged',
                        metric_type: 'total_value', period: 'day', since, until, access_token: accessToken
                    }
                }),
                axios.get(`${this.graphUrl}/${igAccountId}/insights`, {
                    params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe, breakdown: 'age,gender', access_token: accessToken }
                }),
                axios.get(`${this.graphUrl}/${igAccountId}/insights`, {
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
                reach = this.sumMetricValues(reachRes.value.data);
            }

            // Process Views
            if (viewsRes.status === 'fulfilled') {
                views = this.parseMetricValue(viewsRes.value.data);
            } else {
                views = reach;
            }

            // Process Historical Views (for chart)
            if (viewsHistoricalRes.status === 'fulfilled') {
                const viewsData = viewsHistoricalRes.value.data?.data?.[0]?.values || [];
                historicalViews = viewsData.map((v: any) => ({
                    date: v.end_time?.split('T')[0] || '',
                    value: v.value || 0
                }));
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
                websiteClicks = findMetric('website_clicks');
                accountsEngaged = findMetric('accounts_engaged');
            }

            // Process Demographics
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

                demographics.gender = genders.map(g => ({ gender: g.gender, percentage: Math.round((g.count / totalGenderCount) * 100) }));
                demographics.age = ages.map(a => ({ label: a.group, percentage: Math.round((a.count / totalAgeCount) * 100) }));
                demographics.cities = cities.map((c: any) => ({ name: c.name, percentage: Math.round((c.count / totalCityCount) * 100) }));
            }

            totalInteractions = likes + comments + shares + saves;

            const result = {
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
                websiteClicks,
                accountsEngaged,
                demographics,
                historical: {
                    reach: historicalReach,
                    followers: historicalFollowers,
                    views: historicalViews,
                    likes: [],
                    comments: []
                }
            };

            // Cache the result
            this.cache.set(cacheKey, result);

            return result;
        } catch (error: any) {
            console.error('[InstagramGraph] getInsights error:', error.response?.data || error.message);
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
                websiteClicks: 0,
                accountsEngaged: 0,
                demographics: { gender: [], age: [], cities: [] },
                historical: { reach: [], followers: [], views: [], likes: [], comments: [] }
            };
        }
    }
}

export default InstagramInsightsService;
