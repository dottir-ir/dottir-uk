import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface CaseRequest {
  title: string
  specialty: string
  description: string
  patient_demographics: Record<string, any>
  clinical_history?: string
  examination_findings?: string
  investigations?: Record<string, any>
  diagnosis?: string
  treatment?: string
  outcome?: string
  learning_points?: string
  references?: Record<string, any>
  tags?: string[]
  privacy_level?: number
  allowed_roles?: string[]
  allowed_specialties?: string[]
  is_educational?: boolean
  status?: 'draft' | 'published' | 'under_review' | 'archived'
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
      case 'GET': {
        const url = new URL(req.url)
        const caseId = url.searchParams.get('id')
        
        if (caseId) {
          // Get single case
          const { data: caseData, error: caseError } = await supabaseClient
            .from('medical_cases')
            .select(`
              *,
              author:users(*),
              images:case_images(*)
            `)
            .eq('id', caseId)
            .single()

          if (caseError) {
            return new Response(
              JSON.stringify({ error: caseError.message }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Increment view count
          await supabaseClient
            .from('medical_cases')
            .update({ view_count: caseData.view_count + 1 })
            .eq('id', caseId)

          return new Response(
            JSON.stringify(caseData),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // List cases with filters
          const specialty = url.searchParams.get('specialty')
          const author = url.searchParams.get('author')
          const limit = parseInt(url.searchParams.get('limit') || '10')
          const cursor = url.searchParams.get('cursor')

          let query = supabaseClient
            .from('medical_cases')
            .select(`
              *,
              author:users(*),
              images:case_images(*)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

          if (specialty) {
            query = query.eq('specialty', specialty)
          }
          if (author) {
            query = query.eq('author_id', author)
          }
          if (cursor) {
            query = query.lt('created_at', cursor)
          }

          const { data: cases, error: casesError } = await query

          if (casesError) {
            return new Response(
              JSON.stringify({ error: casesError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              cases,
              next_cursor: cases.length === limit ? cases[cases.length - 1].created_at : null
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'POST': {
        const caseData = await req.json() as CaseRequest

        // Validate required fields
        if (!caseData.title || !caseData.specialty || !caseData.description || !caseData.patient_demographics) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create case
        const { data: newCase, error: createError } = await supabaseClient
          .from('medical_cases')
          .insert({
            ...caseData,
            author_id: profile.id,
            status: caseData.status || 'draft'
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(newCase),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        const url = new URL(req.url)
        const caseId = url.searchParams.get('id')
        
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: 'Case ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const caseData = await req.json() as CaseRequest

        // Verify case ownership
        const { data: existingCase, error: caseError } = await supabaseClient
          .from('medical_cases')
          .select('author_id')
          .eq('id', caseId)
          .single()

        if (caseError) {
          return new Response(
            JSON.stringify({ error: 'Case not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingCase.author_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update case
        const { data: updatedCase, error: updateError } = await supabaseClient
          .from('medical_cases')
          .update({
            ...caseData,
            updated_at: new Date().toISOString()
          })
          .eq('id', caseId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(updatedCase),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const caseId = url.searchParams.get('id')
        
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: 'Case ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify case ownership
        const { data: existingCase, error: caseError } = await supabaseClient
          .from('medical_cases')
          .select('author_id')
          .eq('id', caseId)
          .single()

        if (caseError) {
          return new Response(
            JSON.stringify({ error: 'Case not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingCase.author_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete case
        const { error: deleteError } = await supabaseClient
          .from('medical_cases')
          .delete()
          .eq('id', caseId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Case deleted successfully' }),
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