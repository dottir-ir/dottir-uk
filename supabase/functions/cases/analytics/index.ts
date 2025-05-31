import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface AnalyticsFilters {
  case_id?: string
  author_id?: string
  specialty?: string
  start_date?: string
  end_date?: string
  group_by?: 'day' | 'week' | 'month'
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
        const filters: AnalyticsFilters = {
          case_id: url.searchParams.get('case_id') || undefined,
          author_id: url.searchParams.get('author_id') || undefined,
          specialty: url.searchParams.get('specialty') || undefined,
          start_date: url.searchParams.get('start_date') || undefined,
          end_date: url.searchParams.get('end_date') || undefined,
          group_by: (url.searchParams.get('group_by') as AnalyticsFilters['group_by']) || 'day'
        }

        // Verify access
        if (filters.case_id) {
          const { data: caseData, error: caseError } = await supabaseClient
            .from('medical_cases')
            .select('author_id')
            .eq('id', filters.case_id)
            .single()

          if (caseError) {
            return new Response(
              JSON.stringify({ error: 'Case not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          if (caseData.author_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
            return new Response(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else if (filters.author_id && filters.author_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Build analytics queries
        const analytics = {
          views: await getViewAnalytics(supabaseClient, filters),
          comments: await getCommentAnalytics(supabaseClient, filters),
          collections: await getCollectionAnalytics(supabaseClient, filters),
          specialties: await getSpecialtyAnalytics(supabaseClient, filters),
          tags: await getTagAnalytics(supabaseClient, filters)
        }

        return new Response(
          JSON.stringify(analytics),
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

async function getViewAnalytics(supabaseClient: any, filters: AnalyticsFilters) {
  let query = supabaseClient
    .from('medical_cases')
    .select('view_count, created_at')

  if (filters.case_id) {
    query = query.eq('id', filters.case_id)
  }
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id)
  }
  if (filters.specialty) {
    query = query.eq('specialty', filters.specialty)
  }
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Group by time period
  const grouped = groupByTimePeriod(data, filters.group_by)
  return {
    total: data.reduce((sum: number, c: any) => sum + c.view_count, 0),
    by_period: grouped
  }
}

async function getCommentAnalytics(supabaseClient: any, filters: AnalyticsFilters) {
  let query = supabaseClient
    .from('case_comments')
    .select('created_at')
    .join('medical_cases', 'case_comments.case_id', 'medical_cases.id')

  if (filters.case_id) {
    query = query.eq('medical_cases.id', filters.case_id)
  }
  if (filters.author_id) {
    query = query.eq('medical_cases.author_id', filters.author_id)
  }
  if (filters.specialty) {
    query = query.eq('medical_cases.specialty', filters.specialty)
  }
  if (filters.start_date) {
    query = query.gte('case_comments.created_at', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('case_comments.created_at', filters.end_date)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Group by time period
  const grouped = groupByTimePeriod(data, filters.group_by)
  return {
    total: data.length,
    by_period: grouped
  }
}

async function getCollectionAnalytics(supabaseClient: any, filters: AnalyticsFilters) {
  let query = supabaseClient
    .from('collection_cases')
    .select('created_at')
    .join('medical_cases', 'collection_cases.case_id', 'medical_cases.id')

  if (filters.case_id) {
    query = query.eq('medical_cases.id', filters.case_id)
  }
  if (filters.author_id) {
    query = query.eq('medical_cases.author_id', filters.author_id)
  }
  if (filters.specialty) {
    query = query.eq('medical_cases.specialty', filters.specialty)
  }
  if (filters.start_date) {
    query = query.gte('collection_cases.created_at', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('collection_cases.created_at', filters.end_date)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Group by time period
  const grouped = groupByTimePeriod(data, filters.group_by)
  return {
    total: data.length,
    by_period: grouped
  }
}

async function getSpecialtyAnalytics(supabaseClient: any, filters: AnalyticsFilters) {
  let query = supabaseClient
    .from('medical_cases')
    .select('specialty, view_count')

  if (filters.case_id) {
    query = query.eq('id', filters.case_id)
  }
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id)
  }
  if (filters.specialty) {
    query = query.eq('specialty', filters.specialty)
  }
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Group by specialty
  const grouped = data.reduce((acc: any, c: any) => {
    if (!acc[c.specialty]) {
      acc[c.specialty] = {
        count: 0,
        views: 0
      }
    }
    acc[c.specialty].count++
    acc[c.specialty].views += c.view_count
    return acc
  }, {})

  return {
    total: data.length,
    by_specialty: grouped
  }
}

async function getTagAnalytics(supabaseClient: any, filters: AnalyticsFilters) {
  let query = supabaseClient
    .from('medical_cases')
    .select('tags, view_count')

  if (filters.case_id) {
    query = query.eq('id', filters.case_id)
  }
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id)
  }
  if (filters.specialty) {
    query = query.eq('specialty', filters.specialty)
  }
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Group by tag
  const grouped = data.reduce((acc: any, c: any) => {
    c.tags.forEach((tag: string) => {
      if (!acc[tag]) {
        acc[tag] = {
          count: 0,
          views: 0
        }
      }
      acc[tag].count++
      acc[tag].views += c.view_count
    })
    return acc
  }, {})

  return {
    total: data.length,
    by_tag: grouped
  }
}

function groupByTimePeriod(data: any[], groupBy: 'day' | 'week' | 'month') {
  const grouped = data.reduce((acc: any, item: any) => {
    const date = new Date(item.created_at)
    let key: string

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!acc[key]) {
      acc[key] = {
        count: 0,
        views: 0
      }
    }

    acc[key].count++
    if (item.view_count) {
      acc[key].views += item.view_count
    }

    return acc
  }, {})

  return grouped
} 