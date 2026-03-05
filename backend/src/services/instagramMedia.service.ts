import axios from 'axios';

const GRAPH_API_VERSION = 'v25.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface MediaItem {
    id: string;
    caption?: string;
    media_type: string;
    media_product_type: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink?: string;
    timestamp?: string;
    like_count?: number;
    comments_count?: number;
    views?: number;
    reach?: number;
    save_count?: number;
    share_count?: number;
    video_views?: number;
}

export class InstagramMediaService {
    private readonly graphUrl = GRAPH_API_BASE;

    async getMedia(accessToken: string, igAccountId: string, limit: number = 50): Promise<{ data: MediaItem[] }> {
        // Fetch ALL media posts with pagination (like TikTok)
        const allMedia: MediaItem[] = [];
        let cursor: string | undefined = undefined;
        let hasMore = true;

        while (hasMore) {
            const response: any = await axios.get(`${this.graphUrl}/${igAccountId}/media`, {
                params: {
                    fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
                    access_token: accessToken,
                    limit,
                    after: cursor
                }
            });

            const mediaItems: MediaItem[] = response.data.data || [];
            allMedia.push(...mediaItems);

            // Check for pagination
            const paging: any = response.data.paging || {};
            hasMore = paging.cursors?.after ? true : false;
            cursor = paging.cursors?.after;

            // Safety limit to avoid infinite loops
            if (allMedia.length > 1000) break;
        }

        if (allMedia.length === 0) return { data: [] };

        // Batch request for insights (max 50 per batch)
        const batchSize = 50;
        const mediaWithInsights: MediaItem[] = [];

        for (let i = 0; i < allMedia.length; i += batchSize) {
            const batch = allMedia.slice(i, i + batchSize);
            const batchRequests = batch.map((media: any) => ({
                method: 'GET',
                relative_url: `v25.0/${media.id}/insights?metric=reach,saved,shares,views`
            }));

            try {
                const batchResponse = await axios.post(`https://graph.facebook.com`, {
                    access_token: accessToken,
                    batch: JSON.stringify(batchRequests)
                });

                const batchResults = batchResponse.data || [];

                batch.forEach((media: any, index: number) => {
                    const result = batchResults[index];
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
                            console.error('[InstagramGraph] Error parsing insight body for media item:', e);
                        }
                    }

                    const isReel = media.media_product_type === 'REELS';
                    if (!isReel) {
                        media.video_views = media.views || media.reach || 0;
                    } else if (!media.video_views) {
                        media.video_views = media.views || media.reach || 0;
                    }

                    if (media.comments_count !== undefined && media.comment_count === undefined) {
                        media.comment_count = media.comments_count;
                    }

                    mediaWithInsights.push(media);
                });
            } catch (e: any) {
                console.error('[InstagramGraph] media batch insights error:', e.response?.data?.error?.message || e.message);
                mediaWithInsights.push(...batch);
            }
        }

        return { data: mediaWithInsights };
    }

    async getMediaInsights(accessToken: string, mediaId: string): Promise<any> {
        const response = await axios.get(`${this.graphUrl}/${mediaId}`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comment_count,share_count,save_count,reach,views',
                access_token: accessToken
            }
        });

        const data = response.data;
        const engagement = (data.like_count || 0) + (data.comment_count || 0) + (data.share_count || 0);
        const views = data.views || data.reach || 0;
        const engagementRate = views > 0 ? (engagement / views) * 100 : 0;

        return {
            id: data.id,
            title: data.caption || 'Untitled Post',
            description: data.caption || '',
            thumbnail: data.thumbnail_url || data.media_url || '',
            cover_image_url: data.thumbnail_url || data.media_url || '',
            create_time: new Date(data.timestamp).getTime() / 1000,
            duration: 0,
            views: views,
            likes: data.like_count || 0,
            comments: data.comment_count || 0,
            shares: data.share_count || 0,
            engagement_rate: Math.round(engagementRate * 10) / 10
        };
    }
}

export default InstagramMediaService;
