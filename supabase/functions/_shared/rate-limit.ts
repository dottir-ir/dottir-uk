import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export async function rateLimit(req: Request): Promise<RateLimitResult> {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const key = `ratelimit:${ip}`
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get current rate limit data
  const { data: rateData } = await supabaseClient
    .from('rate_limits')
    .select('*')
    .eq('key', key)
    .single()

  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 60 // 60 requests per minute

  if (!rateData) {
    // First request from this IP
    await supabaseClient
      .from('rate_limits')
      .insert({
        key,
        count: 1,
        reset_at: new Date(now + windowMs).toISOString()
      })

    return {
      success: true,
      remaining: maxRequests - 1,
      reset: now + windowMs
    }
  }

  // Check if window has expired
  if (new Date(rateData.reset_at).getTime() < now) {
    // Reset window
    await supabaseClient
      .from('rate_limits')
      .update({
        count: 1,
        reset_at: new Date(now + windowMs).toISOString()
      })
      .eq('key', key)

    return {
      success: true,
      remaining: maxRequests - 1,
      reset: now + windowMs
    }
  }

  // Check if limit exceeded
  if (rateData.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      reset: new Date(rateData.reset_at).getTime()
    }
  }

  // Increment counter
  await supabaseClient
    .from('rate_limits')
    .update({
      count: rateData.count + 1
    })
    .eq('key', key)

  return {
    success: true,
    remaining: maxRequests - (rateData.count + 1),
    reset: new Date(rateData.reset_at).getTime()
  }
} 