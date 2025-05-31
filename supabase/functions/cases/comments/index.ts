import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface CommentRequest {
  case_id: string
  content: string
  parent_id?: string
  mentions?: string[]
  attachments?: Array<{
    type: string
    url: string
    name: string
    size: number
  }>
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
        const caseId = url.searchParams.get('case_id')
        const parentId = url.searchParams.get('parent_id')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const cursor = url.searchParams.get('cursor')
        
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: 'Case ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get comments
        let query = supabaseClient
          .from('case_comments')
          .select(`
            *,
            author:users(*),
            replies:case_comments(*)
          `)
          .eq('case_id', caseId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (parentId) {
          query = query.eq('parent_id', parentId)
        } else {
          query = query.is('parent_id', null)
        }

        if (cursor) {
          query = query.lt('created_at', cursor)
        }

        const { data: comments, error: commentsError } = await query

        if (commentsError) {
          return new Response(
            JSON.stringify({ error: commentsError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            comments,
            next_cursor: comments.length === limit ? comments[comments.length - 1].created_at : null
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'POST': {
        const commentData = await req.json() as CommentRequest

        // Validate required fields
        if (!commentData.case_id || !commentData.content) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify case exists
        const { data: existingCase, error: caseError } = await supabaseClient
          .from('medical_cases')
          .select('author_id')
          .eq('id', commentData.case_id)
          .single()

        if (caseError) {
          return new Response(
            JSON.stringify({ error: 'Case not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create comment
        const { data: newComment, error: createError } = await supabaseClient
          .from('case_comments')
          .insert({
            ...commentData,
            author_id: profile.id
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create notifications for mentions
        if (commentData.mentions?.length) {
          const { error: notificationError } = await supabaseClient
            .from('notifications')
            .insert(
              commentData.mentions.map(userId => ({
                user_id: userId,
                type: 'mention',
                title: 'New mention',
                message: `${profile.full_name} mentioned you in a comment`,
                data: {
                  case_id: commentData.case_id,
                  comment_id: newComment.id
                }
              }))
            )

          if (notificationError) {
            console.error('Failed to create mention notifications:', notificationError)
          }
        }

        // Create notification for case author if not self
        if (existingCase.author_id !== profile.id) {
          const { error: notificationError } = await supabaseClient
            .from('notifications')
            .insert({
              user_id: existingCase.author_id,
              type: 'comment',
              title: 'New comment',
              message: `${profile.full_name} commented on your case`,
              data: {
                case_id: commentData.case_id,
                comment_id: newComment.id
              }
            })

          if (notificationError) {
            console.error('Failed to create comment notification:', notificationError)
          }
        }

        return new Response(
          JSON.stringify(newComment),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        const url = new URL(req.url)
        const commentId = url.searchParams.get('id')
        
        if (!commentId) {
          return new Response(
            JSON.stringify({ error: 'Comment ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const commentData = await req.json() as Partial<CommentRequest>

        // Verify comment ownership
        const { data: existingComment, error: commentError } = await supabaseClient
          .from('case_comments')
          .select('author_id')
          .eq('id', commentId)
          .single()

        if (commentError) {
          return new Response(
            JSON.stringify({ error: 'Comment not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingComment.author_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update comment
        const { data: updatedComment, error: updateError } = await supabaseClient
          .from('case_comments')
          .update({
            ...commentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', commentId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(updatedComment),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const commentId = url.searchParams.get('id')
        
        if (!commentId) {
          return new Response(
            JSON.stringify({ error: 'Comment ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify comment ownership
        const { data: existingComment, error: commentError } = await supabaseClient
          .from('case_comments')
          .select('author_id')
          .eq('id', commentId)
          .single()

        if (commentError) {
          return new Response(
            JSON.stringify({ error: 'Comment not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingComment.author_id !== profile.id && profile.role !== 'admin' && profile.role !== 'moderator') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete comment
        const { error: deleteError } = await supabaseClient
          .from('case_comments')
          .delete()
          .eq('id', commentId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Comment deleted successfully' }),
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