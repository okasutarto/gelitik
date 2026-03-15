import { createClient } from 'npm:@supabase/supabase-js@2'

async function decryptToken(encryptedData: string): Promise<string> {
  const keyHex = Deno.env.get('ENCRYPTION_KEY')!
  const keyBuffer = hexToBytes(keyHex)

  const data = base64ToBytes(encryptedData)
  const iv = data.slice(0, 16)
  const authTag = data.slice(16, 32)
  const ciphertext = data.slice(32)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']
  )

  // Web Crypto expects ciphertext + authTag concatenated
  const combined = new Uint8Array(ciphertext.length + authTag.length)
  combined.set(ciphertext)
  combined.set(authTag, ciphertext.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    combined
  )

  return new TextDecoder().decode(decrypted)
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  const startTime = Date.now()

  const authHeader = req.headers.get('x-cron-secret')
  if (authHeader !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get timezone from query param (default to UTC+7 for Indonesia/WIB)
  const url = new URL(req.url)
  const timezoneOffset = parseInt(url.searchParams.get('timezone') || '7', 10)
  const now = new Date()
  // Adjust to user's timezone by adding offset hours
  now.setHours(now.getHours() + timezoneOffset)
  const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone

  // Get all connected accounts for TikTok and Instagram
  // Also check if token is valid (expiresAt > now or is null)
  const { data: credentials, error: credErr } = await supabase
    .from('SocialAccount')
    .select('*')
    .in('platform', ['tiktok', 'instagram', 'instagram-graph'])
    .or(`expiresAt.gt.${new Date(Date.now() + 1000 * 60 * 5).toISOString()},expiresAt.is.null`)

  if (credErr) {
    console.error('Full error:', JSON.stringify(credErr))
    return new Response(JSON.stringify(credErr), { status: 500 })
  }

  const results = await Promise.allSettled(
    (credentials || []).map(cred => fetchAndSave(cred, startTime, now, todayStr))
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

async function fetchAndSave(cred: any, startTime: number, now: Date, todayStr: string) {
  try {
    let snapshot: any = null

    if (cred.platform === 'tiktok') {
      snapshot = await fetchTikTok(cred)
    } else if (cred.platform === 'instagram' || cred.platform === 'instagram-graph') {
      snapshot = await fetchInstagram(cred)
    }

    if (!snapshot) throw new Error('No data returned from API')

    // Use the now and todayStr from outer scope (with timezone adjustment)
    const startOfDay = `${todayStr}T00:00:00.000Z`
    const endOfDay = `${todayStr}T23:59:59.999Z`

    // Check if snapshot already exists for today using proper date range
    const { data: existingSnapshot } = await supabase
      .from('Analytics')
      .select('id')
      .eq('accountId', cred.id)
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .maybeSingle()

    let analyticsErr = null

    if (existingSnapshot) {
      // Update existing
      const { error } = await supabase
        .from('Analytics')
        .update({
          ...snapshot,
          date: now.toISOString() // Always set date to the actual time of this exact function run
        })
        .eq('id', existingSnapshot.id)
      analyticsErr = error
    } else {
      // Insert new with exact current timestamp
      const { error } = await supabase.from('Analytics').insert({
        id: crypto.randomUUID(),
        accountId: cred.id,
        date: now.toISOString(),
        ...snapshot,
      })
      analyticsErr = error
    }

    if (analyticsErr) throw new Error(`Analytics save failed: ${analyticsErr.message}`)

    // Log success
    await supabase.from('FetchLog').insert({
      id: crypto.randomUUID(),
      accountId: cred.id,
      platform: cred.platform,
      status: 'success',
      durationMs: Date.now() - startTime,
      triggeredAt: new Date(startTime).toISOString()
    })

  } catch (err: any) {
    // Log failure — never crash the whole job
    await supabase.from('FetchLog').insert({
      id: crypto.randomUUID(),
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
  // User info
  const res = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,video_count,likes_count',
    { headers: { Authorization: `Bearer ${cred.accessToken}` } }
  )
  const json = await res.json()
  const user = json.data?.user

  // Video list — Fetch all videos with pagination
  let videos: any[] = []
  try {
    let hasMore = true
    let cursor: number | undefined = undefined

    while (hasMore) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const body: any = { max_count: 20 }
      if (cursor) body.cursor = cursor

      const videosRes = await fetch(
        'https://open.tiktokapis.com/v2/video/list/?fields=id,view_count,like_count,comment_count,share_count',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cred.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      )
      clearTimeout(timeout)

      const videosJson = await videosRes.json()
      const newVideos = videosJson.data?.videos ?? []
      videos.push(...newVideos)

      hasMore = videosJson.data?.has_more ?? false
      cursor = videosJson.data?.cursor

      // Safety limit to avoid edge function timeouts
      if (videos.length >= 500) break
    }
  } catch (err: any) {
    console.warn('Video list fetch failed or timed out:', err.message)
  }

  const followers = user?.follower_count ?? 0
  const totalLikes = user?.likes_count ?? 0  // lifetime likes from user info
  const totalViews = videos.reduce((s: number, v: any) => s + (v.view_count ?? 0), 0)
  const totalComments = videos.reduce((s: number, v: any) => s + (v.comment_count ?? 0), 0)
  const totalShares = videos.reduce((s: number, v: any) => s + (v.share_count ?? 0), 0)

  // Match frontend calculateAnalytics logic exactly
  const totalEngagement = totalLikes + totalComments + totalShares
  const engagementRate = totalViews > 0
    ? (totalEngagement / totalViews) * 100
    : 0

  return {
    followers,
    following: user?.following_count ?? 0,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalSaves: 0,
    engagementRate: Math.round(engagementRate * 100) / 100,
    rawPayload: { user_info: json, videos_list: { data: { videos } } }
  }
}

// ── Instagram fetch ─────────────────────────────────────────────
async function fetchInstagram(cred: any) {
  const token = cred.accessToken

  // ── Get Instagram Business Account ID first ──
  const accountsRes = await fetch(
    `https://graph.facebook.com/v25.0/me/accounts?access_token=${token}`
  )
  const accountsJson = await accountsRes.json()

  const page = accountsJson.data?.[0]
  if (!page) throw new Error('No Facebook page found')

  const pageToken = page.access_token
  const pageId = page.id

  // ── Get Instagram Business Account linked to the page ──
  const igRes = await fetch(
    `https://graph.facebook.com/v25.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
  )
  const igJson = await igRes.json()
  const igAccountId = igJson.instagram_business_account?.id

  if (!igAccountId) throw new Error('No Instagram business account linked to page')

  // ── Get profile ──
  const profileRes = await fetch(
    `https://graph.facebook.com/v25.0/${igAccountId}?fields=followers_count,follows_count,media_count,username&access_token=${pageToken}`
  )
  const profile = await profileRes.json()

  // ── Get recent media with insights ──
  let allMedia: any[] = []
  try {
    let hasMore = true
    let cursor: string | undefined = undefined

    // Loop to fetch all media
    while (hasMore) {
      const url = new URL(`https://graph.facebook.com/v25.0/${igAccountId}/media`)
      url.searchParams.append('fields', 'id,like_count,comments_count,media_type,media_product_type')
      url.searchParams.append('access_token', pageToken)
      url.searchParams.append('limit', '50')
      if (cursor) url.searchParams.append('after', cursor)

      const mediaRes = await fetch(url.toString())
      const mediaJson = await mediaRes.json()

      if (mediaJson.error) {
        console.warn('IG media error:', JSON.stringify(mediaJson.error))
        break
      }

      const mediaItems = mediaJson.data ?? []
      allMedia.push(...mediaItems)

      const paging = mediaJson.paging || {}
      hasMore = !!paging.cursors?.after
      cursor = paging.cursors?.after

      if (allMedia.length >= 500) break
    }

    // Next, fetch insights for these media items in chunks (API limits batches to 50)
    if (allMedia.length > 0) {
      const batchSize = 50
      for (let i = 0; i < allMedia.length; i += batchSize) {
        const batch = allMedia.slice(i, i + batchSize)

        const batchRequests = batch.map((item: any) => ({
          method: 'GET',
          relative_url: `v25.0/${item.id}/insights?metric=reach,views,saved,shares`
        }))

        const formData = new URLSearchParams()
        formData.append('access_token', pageToken)
        formData.append('batch', JSON.stringify(batchRequests))

        const batchRes = await fetch(`https://graph.facebook.com`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        })

        const batchData = await batchRes.json()

        batch.forEach((item: any, idx: number) => {
          item.reach = 0
          item.views = 0
          item.saves = 0
          item.shares = 0

          const res = batchData[idx]
          if (res && res.code === 200) {
            try {
              const body = JSON.parse(res.body)
              
              // If the body itself contains an error message despite a 200 wrapper
              if (body.error) {
                console.warn(`[Batch Insight Error Code 200] Media ${item.id}:`, JSON.stringify(body.error))
              }

              const insights = body.data || []

              for (const metric of insights) {
                const value = metric.values?.[0]?.value ?? metric.total_value?.value ?? 0
                if (metric.name === 'reach') item.reach = value
                if (metric.name === 'views') item.views = value
                if (metric.name === 'saved') item.saves = value
                if (metric.name === 'shares') item.shares = value
              }
            } catch (err) {
              console.warn(`Error parsing insights for media ${item.id}`, err)
            }
          } else if (res && res.body) {
             console.warn(`[Batch Insight Error Code ${res.code}] Media ${item.id}:`, res.body)
          }
        })
      }
    }
  } catch (e: any) {
    console.warn('Media fetch failed:', e.message)
  }

  const totalLikes    = allMedia.reduce((s: number, m: any) => s + (m.like_count     ?? 0), 0)
  const totalComments = allMedia.reduce((s: number, m: any) => s + (m.comments_count ?? 0), 0)
  const totalSaves    = allMedia.reduce((s: number, m: any) => s + (m.saves          ?? 0), 0)
  const totalViews    = allMedia.reduce((s: number, m: any) => s + (m.views          ?? 0), 0)
  const totalShares   = allMedia.reduce((s: number, m: any) => s + (m.shares         ?? 0), 0)

  const followers = profile.followers_count ?? 0
  const following = profile.follows_count ?? 0
  const totalEngagement = totalLikes + totalComments + totalSaves + totalShares
  const engagementRate = totalViews > 0
    ? (totalEngagement / totalViews) * 100
    : 0

  console.log('IG snapshot:', { followers, totalLikes, totalComments, totalViews, totalSaves, totalShares, mediaCount: allMedia.length })

  return {
    followers,
    following,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalSaves,
    engagementRate: parseFloat(engagementRate.toFixed(4)),
    rawPayload: { profile, media_count: allMedia.length }
  }
}

