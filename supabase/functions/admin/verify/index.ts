import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface VerificationReviewRequest {
  request_id: string
  status: 'approved' | 'rejected'
  notes?: string
}

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

    // Verify admin role
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profileError || adminProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { request_id, status, notes } = await req.json() as VerificationReviewRequest

    // Validate input
    if (!request_id || !status || !['approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get verification request
    const { data: verificationRequest, error: requestError } = await supabaseClient
      .from('verification_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (requestError) {
      return new Response(
        JSON.stringify({ error: 'Verification request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update verification request
    const { error: updateError } = await supabaseClient
      .from('verification_requests')
      .update({
        status,
        notes,
        reviewed_by: adminProfile.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', request_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user verification status
    const { error: userUpdateError } = await supabaseClient
      .from('users')
      .update({
        verification_status: status
      })
      .eq('id', verificationRequest.user_id)

    if (userUpdateError) {
      return new Response(
        JSON.stringify({ error: userUpdateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification for user
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: verificationRequest.user_id,
        type: 'verification_review',
        title: 'Verification Request Reviewed',
        message: `Your verification request has been ${status}. ${notes ? `Notes: ${notes}` : ''}`,
        data: {
          request_id,
          status,
          notes
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    return new Response(
      JSON.stringify({
        message: 'Verification request reviewed successfully',
        status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 