import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface SearchFilters {
  query?: string
  specialty?: string
  author_id?: string
  tags?: string[]
  privacy_level?: 'public' | 'private' | 'restricted'
  is_educational?: boolean
  status?: 'draft' | 'published' | 'archived'
  created_after?: string
  created_before?: string
  sort_by?: 'created_at' | 'updated_at' | 'view_count'
  sort_order?: 'asc' | 'desc'
  limit: number
  cursor?: string
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
        const filters: SearchFilters = {
          query: url.searchParams.get('query') || undefined,
          specialty: url.searchParams.get('specialty') || undefined,
          author_id: url.searchParams.get('author_id') || undefined,
          tags: url.searchParams.get('tags')?.split(',') || undefined,
          privacy_level: url.searchParams.get('privacy_level') as SearchFilters['privacy_level'] || undefined,
          is_educational: url.searchParams.get('is_educational') === 'true',
          status: url.searchParams.get('status') as SearchFilters['status'] || undefined,
          created_after: url.searchParams.get('created_after') || undefined,
          created_before: url.searchParams.get('created_before') || undefined,
          sort_by: url.searchParams.get('sort_by') as SearchFilters['sort_by'] || 'created_at',
          sort_order: url.searchParams.get('sort_order') as SearchFilters['sort_order'] || 'desc',
          limit: parseInt(url.searchParams.get('limit') || '10'),
          cursor: url.searchParams.get('cursor') || undefined
        }

        // Build query
        let query = supabaseClient
          .from('medical_cases')
          .select(`
            *,
            author:users!medical_cases_author_id_fkey (
              id,
              full_name,
              specialty,
              role
            )
          `)

        // Apply filters
        if (filters.query) {
          query = query.or(`
            title.ilike.%${filters.query}%,
            description.ilike.%${filters.query}%,
            clinical_history.ilike.%${filters.query}%,
            examination_findings.ilike.%${filters.query}%,
            diagnosis.ilike.%${filters.query}%
          `)
        }

        if (filters.specialty) {
          query = query.eq('specialty', filters.specialty)
        }

        if (filters.author_id) {
          query = query.eq('author_id', filters.author_id)
        }

        if (filters.tags?.length) {
          query = query.contains('tags', filters.tags)
        }

        if (filters.privacy_level) {
          query = query.eq('privacy_level', filters.privacy_level)
        }

        if (filters.is_educational !== undefined) {
          query = query.eq('is_educational', filters.is_educational)
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

        if (filters.created_after) {
          query = query.gte('created_at', filters.created_after)
        }

        if (filters.created_before) {
          query = query.lte('created_at', filters.created_before)
        }

        // Apply sorting
        query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

        // Apply pagination
        if (filters.cursor) {
          const [timestamp, id] = filters.cursor.split('_')
          query = query.or(`
            ${filters.sort_by}.lt.${timestamp},
            and(${filters.sort_by}.eq.${timestamp},id.lt.${id})
          `)
        }

        query = query.limit(filters.limit + 1)

        // Execute query
        const { data: cases, error } = await query

        if (error) {
          throw new Error(error.message)
        }

        // Check if there are more results
        const hasMore = cases.length > filters.limit
        const results = cases.slice(0, filters.limit)

        // Get next cursor
        let nextCursor: string | undefined
        if (hasMore) {
          const lastCase = results[results.length - 1]
          nextCursor = `${lastCase[filters.sort_by]}_${lastCase.id}`
        }

        // Filter results based on user access
        const accessibleCases = results.filter(c => {
          // Public cases are always accessible
          if (c.privacy_level === 'public') return true

          // Private cases are only accessible to the author
          if (c.privacy_level === 'private') {
            return c.author_id === profile.id
          }

          // Restricted cases are accessible to:
          // 1. The author
          // 2. Users with allowed roles
          // 3. Users with allowed specialties
          // 4. Admins and moderators
          if (c.privacy_level === 'restricted') {
            if (c.author_id === profile.id) return true
            if (profile.role === 'admin' || profile.role === 'moderator') return true
            if (c.allowed_roles?.includes(profile.role)) return true
            if (c.allowed_specialties?.includes(profile.specialty)) return true
            return false
          }

          return false
        })

        return new Response(
          JSON.stringify({
            cases: accessibleCases,
            next_cursor: nextCursor
          }),
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