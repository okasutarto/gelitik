import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('x-cron-secret')
  if (authHeader !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Find tokens expiring within 24 hours
  // Also only refresh tokens that actually have an expiration (ignore long-lived null)
  const { data: expiring, error } = await supabase
    .from('SocialAccount')
    .select('*')
    .in('platform', ['tiktok', 'instagram'])
    .not('expiresAt', 'is', 'null')
    .lt('expiresAt', new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString())

  if (error) {
    console.error('Database error:', error)
    return new Response('Database error', { status: 500 })
  }

  for (const cred of expiring ?? []) {
    try {
      let newToken: any = null

      if (cred.platform === 'tiktok') {
        newToken = await refreshTikTokToken(cred)
      } else if (cred.platform === 'instagram') {
        newToken = await refreshInstagramToken(cred)
      }

      if (newToken) {
        await supabase
          .from('SocialAccount')
          .update({
            accessToken: newToken.accessToken,
            expiresAt: newToken.expiresAt,
            updatedAt: new Date().toISOString()
          })
          .eq('id', cred.id)
      }
    } catch (err) {
      console.error(`Failed to refresh token for account ${cred.id} (${cred.platform}):`, err)
    }
  }

  return new Response('Done', { status: 200 })
})

async function refreshTikTokToken(cred: any) {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: Deno.env.get('TIKTOK_CLIENT_KEY')!,
      client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET')!,
      grant_type: 'refresh_token',
      refresh_token: cred.refreshToken
    })
  })
  if (!res.ok) throw new Error(`TikTok refresh failed: ${await res.text()}`)

  const json = await res.json()
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000).toISOString()
  }
}

async function refreshInstagramToken(cred: any) {
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${cred.accessToken}`
  )
  if (!res.ok) throw new Error(`Instagram refresh failed: ${await res.text()}`)

  const json = await res.json()
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000).toISOString()
  }
}
