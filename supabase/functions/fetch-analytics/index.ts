import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  const startTime = Date.now()

  const authHeader = req.headers.get('x-cron-secret')
  if (authHeader !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get all connected accounts for TikTok and Instagram
  // Also check if token is valid (expiresAt > now or is null)
  const { data: credentials, error: credErr } = await supabase
    .from('SocialAccount')
    .select('*')
    .in('platform', ['tiktok', 'instagram'])
    .or(`expiresAt.gt.${new Date(Date.now() + 1000 * 60 * 5).toISOString()},expiresAt.is.null`)

  if (credErr) {
    console.error('Failed to load credentials:', credErr)
    return new Response('DB error', { status: 500 })
  }

  const results = await Promise.allSettled(
    (credentials || []).map(cred => fetchAndSave(cred, startTime))
  )

  const summary = results.map((r, i) => ({
    accountId: credentials[i].id,
    platform: credentials[i].platform,
    status: r.status
  }))

  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// ── Per-platform fetch ──────────────────────────────────────────

async function fetchAndSave(cred: any, startTime: number) {
  try {
    let snapshot: any = null

    if (cred.platform === 'tiktok') {
      snapshot = await fetchTikTok(cred)
    } else if (cred.platform === 'instagram') {
      snapshot = await fetchInstagram(cred)
    }

    if (!snapshot) throw new Error('No data returned from API')

    // Insert snapshot
    await supabase.from('Analytics').insert({
      accountId: cred.id,
      date: new Date().toISOString(),
      ...snapshot,
    })

    // Log success
    await supabase.from('FetchLog').insert({
      accountId: cred.id,
      platform: cred.platform,
      status: 'success',
      durationMs: Date.now() - startTime,
      triggeredAt: new Date(startTime).toISOString()
    })

  } catch (err: any) {
    // Log failure — never crash the whole job
    await supabase.from('FetchLog').insert({
      accountId: cred.id,
      platform: cred.platform,
      status: 'error',
      errorMessage: err.message,
      durationMs: Date.now() - startTime,
      triggeredAt: new Date(startTime).toISOString()
    })
    throw err
  }
}

// ── TikTok fetch ────────────────────────────────────────────────

async function fetchTikTok(cred: any) {
  const res = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,video_count,likes_count',
    { headers: { Authorization: `Bearer ${cred.accessToken}` } }
  )
  const json = await res.json()
  const user = json.data?.user

  // Fetch recent video stats separately
  const videosRes = await fetch(
    'https://open.tiktokapis.com/v2/video/list/?fields=view_count,like_count,comment_count,share_count',
    { headers: { Authorization: `Bearer ${cred.accessToken}` } }
  )
  const videosJson = await videosRes.json()
  const videos = videosJson.data?.videos ?? []

  const totalViews = videos.reduce((sum: number, v: any) => sum + (v.view_count ?? 0), 0)
  const totalLikes = videos.reduce((sum: number, v: any) => sum + (v.like_count ?? 0), 0)
  const totalComments = videos.reduce((sum: number, v: any) => sum + (v.comment_count ?? 0), 0)
  const totalShares = videos.reduce((sum: number, v: any) => sum + (v.share_count ?? 0), 0)

  const followers = user?.follower_count ?? 0
  const engagementRate = followers > 0
    ? ((totalLikes + totalComments + totalShares) / (followers * videos.length)) * 100
    : 0

  return {
    followers,
    following: user?.following_count ?? 0,
    totalViews: totalViews,
    totalLikes: totalLikes,
    totalComments: totalComments,
    totalShares: totalShares,
    totalSaves: 0, // TikTok API does not expose saves in this endpoint
    engagementRate: parseFloat(engagementRate.toFixed(4)),
    rawPayload: { user_info: json, videos_list: videosJson }
  }
}

// ── Instagram fetch ─────────────────────────────────────────────

async function fetchInstagram(cred: any) {
  const fields = 'followers_count,media_count,name'
  const res = await fetch(
    `https://graph.instagram.com/me?fields=${fields}&access_token=${cred.accessToken}`
  )
  const user = await res.json()

  // Fetch recent media metrics
  const mediaRes = await fetch(
    `https://graph.instagram.com/me/media?fields=like_count,comments_count,saved,impressions,reach&access_token=${cred.accessToken}&limit=30`
  )
  const mediaJson = await mediaRes.json()
  const media = mediaJson.data ?? []

  const totalLikes = media.reduce((sum: number, m: any) => sum + (m.like_count ?? 0), 0)
  const totalComments = media.reduce((sum: number, m: any) => sum + (m.comments_count ?? 0), 0)
  const totalSaves = media.reduce((sum: number, m: any) => sum + (m.saved ?? 0), 0)
  const totalViews = media.reduce((sum: number, m: any) => sum + (m.impressions ?? 0), 0)

  const followers = user.followers_count ?? 0
  const engagementRate = followers > 0 && media.length > 0
    ? ((totalLikes + totalComments + totalSaves) / (followers * media.length)) * 100
    : 0

  return {
    followers,
    totalViews: totalViews,
    totalLikes: totalLikes,
    totalComments: totalComments,
    totalShares: 0, // IG API does not expose shares here
    totalSaves: totalSaves,
    engagementRate: parseFloat(engagementRate.toFixed(4)),
    rawPayload: { user_info: user, media_list: mediaJson }
  }
}
