import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req)
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'POST': {
        const { case_id } = await req.json()

        if (!case_id) {
          return new Response(
            JSON.stringify({ error: 'Case ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify case exists
        const { data: caseData, error: caseError } = await supabaseClient
          .from('medical_cases')
          .select('id')
          .eq('id', case_id)
          .single()

        if (caseError) {
          return new Response(
            JSON.stringify({ error: 'Case not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get IP address and user agent
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'

        // Create view record
        const { error: viewError } = await supabaseClient
          .from('case_views')
          .insert({
            case_id,
            viewer_id: profile.id,
            ip_address: ipAddress,
            user_agent: userAgent
          })

        if (viewError) {
          throw new Error(viewError.message)
        }

        // Update case view count
        const { error: updateError } = await supabaseClient
          .from('medical_cases')
          .update({ view_count: supabaseClient.rpc('increment') })
          .eq('id', case_id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Update analytics
        const today = new Date().toISOString().split('T')[0]
        const { error: analyticsError } = await supabaseClient
          .from('case_analytics')
          .upsert({
            case_id,
            date: today,
            view_count: 1
          }, {
            onConflict: 'case_id,date',
            count: 'view_count'
          })

        if (analyticsError) {
          throw new Error(analyticsError.message)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 