import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface CollectionRequest {
  name: string
  description?: string
  is_public?: boolean
  tags?: string[]
}

interface CollectionCaseRequest {
  collection_id: string
  case_id: string
  notes?: string
  order_index?: number
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
        const collectionId = url.searchParams.get('id')
        const userId = url.searchParams.get('user_id')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const cursor = url.searchParams.get('cursor')
        
        if (collectionId) {
          // Get single collection with cases
          const { data: collection, error: collectionError } = await supabaseClient
            .from('collections')
            .select(`
              *,
              cases:collection_cases(
                *,
                case:medical_cases(
                  *,
                  author:users(*),
                  images:case_images(*)
                )
              )
            `)
            .eq('id', collectionId)
            .single()

          if (collectionError) {
            return new Response(
              JSON.stringify({ error: collectionError.message }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Check access
          if (!collection.is_public && collection.owner_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
            return new Response(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify(collection),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // List collections
          let query = supabaseClient
            .from('collections')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

          if (userId) {
            query = query.eq('owner_id', userId)
          } else {
            query = query.or(`is_public.eq.true,owner_id.eq.${profile.id}`)
          }

          if (cursor) {
            query = query.lt('created_at', cursor)
          }

          const { data: collections, error: collectionsError } = await query

          if (collectionsError) {
            return new Response(
              JSON.stringify({ error: collectionsError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              collections,
              next_cursor: collections.length === limit ? collections[collections.length - 1].created_at : null
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'POST': {
        const collectionData = await req.json() as CollectionRequest

        // Validate required fields
        if (!collectionData.name) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create collection
        const { data: newCollection, error: createError } = await supabaseClient
          .from('collections')
          .insert({
            ...collectionData,
            owner_id: profile.id
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
          JSON.stringify(newCollection),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        const url = new URL(req.url)
        const collectionId = url.searchParams.get('id')
        
        if (!collectionId) {
          return new Response(
            JSON.stringify({ error: 'Collection ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const collectionData = await req.json() as Partial<CollectionRequest>

        // Verify collection ownership
        const { data: existingCollection, error: collectionError } = await supabaseClient
          .from('collections')
          .select('owner_id')
          .eq('id', collectionId)
          .single()

        if (collectionError) {
          return new Response(
            JSON.stringify({ error: 'Collection not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingCollection.owner_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update collection
        const { data: updatedCollection, error: updateError } = await supabaseClient
          .from('collections')
          .update({
            ...collectionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', collectionId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(updatedCollection),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const collectionId = url.searchParams.get('id')
        
        if (!collectionId) {
          return new Response(
            JSON.stringify({ error: 'Collection ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify collection ownership
        const { data: existingCollection, error: collectionError } = await supabaseClient
          .from('collections')
          .select('owner_id')
          .eq('id', collectionId)
          .single()

        if (collectionError) {
          return new Response(
            JSON.stringify({ error: 'Collection not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingCollection.owner_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete collection
        const { error: deleteError } = await supabaseClient
          .from('collections')
          .delete()
          .eq('id', collectionId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Collection deleted successfully' }),
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