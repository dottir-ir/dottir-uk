import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface VerificationRequest {
  documents: {
    type: string
    url: string
    name: string
  }[]
  license_number?: string
  institution?: string
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

    // Get request body
    const { documents, license_number, institution } = await req.json() as VerificationRequest

    // Validate input
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No documents provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Update user profile with verification documents
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        verification_documents: documents,
        verification_status: 'pending',
        ...(license_number && { credentials: license_number }),
        ...(institution && { institution })
      })
      .eq('id', profile.id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create verification request record
    const { error: verificationError } = await supabaseClient
      .from('verification_requests')
      .insert({
        user_id: profile.id,
        documents,
        license_number,
        institution,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })

    if (verificationError) {
      return new Response(
        JSON.stringify({ error: verificationError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Verification documents submitted successfully',
        status: 'pending'
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