import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role: 'student' | 'doctor' | 'educator'
  specialty?: string
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

    // Get request body
    const { email, password, full_name, role, specialty } = await req.json() as RegisterRequest

    // Validate input
    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    if (!['student', 'doctor', 'educator'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        specialty
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabaseClient
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        full_name,
        role,
        specialty,
        verification_status: 'pending'
      })
      .select()
      .single()

    if (profileError) {
      // Rollback auth user creation if profile creation fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create empty profile record
    const { error: extendedProfileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: profileData.id,
        privacy_settings: {
          profile_visibility: 'all_users',
          case_visibility: 'all_users'
        },
        notification_settings: {
          email_digest: true,
          push_enabled: true
        }
      })

    if (extendedProfileError) {
      // Log error but don't fail the request since the main profile was created
      console.error('Error creating extended profile:', extendedProfileError)
    }

    return new Response(
      JSON.stringify({
        user: profileData,
        message: 'Registration successful. Please check your email for verification.'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 