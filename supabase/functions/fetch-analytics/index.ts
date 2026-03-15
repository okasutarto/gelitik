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
    } else if (cred.platform === 'instagram' || cred.platform === 'instagram-graph') {
      snapshot = await fetchInstagram(cred)
    }

    if (!snapshot) throw new Error('No data returned from API')

    // Insert snapshot
    const { error: analyticsErr } = await supabase.from('Analytics').insert({
      id: crypto.randomUUID(),
      accountId: cred.id,
      date: new Date().toISOString(),
      ...snapshot,
    })

    if (analyticsErr) throw new Error(`Analytics insert failed: ${analyticsErr.message}`)

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

  // Video list — POST with JSON body (matches backend TikTokService.getVideos)
  let videos: any[] = []
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const videosRes = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,view_count,like_count,comment_count,share_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cred.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ max_count: 20 }),
        signal: controller.signal
      }
    )
    clearTimeout(timeout)
    const videosJson = await videosRes.json()
    console.log('TikTok videos response:', JSON.stringify(videosJson))
    videos = videosJson.data?.videos ?? []
  } catch (err: any) {
    console.warn('Video list fetch failed or timed out:', err.message)
  }

  const followers = user?.follower_count ?? 0
  const totalLikes = user?.likes_count ?? 0  // lifetime likes from user info
  const totalViews = videos.reduce((s: number, v: any) => s + (v.view_count ?? 0), 0)
  const totalComments = videos.reduce((s: number, v: any) => s + (v.comment_count ?? 0), 0)
  const totalShares = videos.reduce((s: number, v: any) => s + (v.share_count ?? 0), 0)

  // Match backend calculateAnalytics logic exactly
  const totalEngagement = totalLikes + totalComments + totalShares
  const totalImpressions = totalViews || followers
  const engagementRate = totalImpressions > 0
    ? (totalEngagement / totalImpressions) * 100
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
  console.log('FB accounts:', JSON.stringify(accountsJson))

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
  console.log('IG account id:', igAccountId)

  if (!igAccountId) throw new Error('No Instagram business account linked to page')

  // ── Get profile ──
  const profileRes = await fetch(
    `https://graph.facebook.com/v25.0/${igAccountId}?fields=followers_count,media_count,username&access_token=${pageToken}`
  )
  const profile = await profileRes.json()
  console.log('IG profile:', JSON.stringify(profile))

  // ── Get recent media ──
  let media: any[] = []
  try {
    const mediaRes = await fetch(
      `https://graph.facebook.com/v25.0/${igAccountId}/media?fields=like_count,comments_count,saved,impressions&access_token=${pageToken}&limit=30`
    )
    const mediaJson = await mediaRes.json()
    console.log('IG media response:', JSON.stringify(mediaJson).substring(0, 200))

    if (mediaJson.error) {
      // Retry without impressions
      const mediaRes2 = await fetch(
        `https://graph.facebook.com/v25.0/${igAccountId}/media?fields=like_count,comments_count,saved&access_token=${pageToken}&limit=30`
      )
      const mediaJson2 = await mediaRes2.json()
      media = mediaJson2.data ?? []
    } else {
      media = mediaJson.data ?? []
    }
  } catch (e: any) {
    console.warn('Media fetch failed:', e.message)
  }

  const totalLikes    = media.reduce((s: number, m: any) => s + (m.like_count     ?? 0), 0)
  const totalComments = media.reduce((s: number, m: any) => s + (m.comments_count ?? 0), 0)
  const totalSaves    = media.reduce((s: number, m: any) => s + (m.saved          ?? 0), 0)
  const totalViews    = media.reduce((s: number, m: any) => s + (m.impressions    ?? 0), 0)
  const totalShares   = media.reduce((s: number, m: any) => s + (m.shares         ?? 0), 0)

  const followers = profile.followers_count ?? 0
  const engagementRate = followers > 0 && media.length > 0
    ? ((totalLikes + totalComments + totalSaves + totalShares) / (followers * media.length)) * 100
    : 0

  console.log('IG snapshot:', { followers, totalLikes, totalComments, totalViews, mediaCount: media.length })

  return {
    followers,
    following: 0,
    totalViews,
    totalLikes,
    totalComments,
    totalShares: 0,
    totalSaves,
    engagementRate: parseFloat(engagementRate.toFixed(4)),
    rawPayload: { profile, media_count: media.length }
  }
}

