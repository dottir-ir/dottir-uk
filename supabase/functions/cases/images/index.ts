import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

interface ImageRequest {
  case_id: string
  file_name: string
  file_type: string
  file_size: number
  width?: number
  height?: number
  description?: string
  annotations?: Record<string, any>
  is_primary?: boolean
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
        const caseId = url.searchParams.get('case_id')
        
        if (!caseId) {
          return new Response(
            JSON.stringify({ error: 'Case ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get case images
        const { data: images, error: imagesError } = await supabaseClient
          .from('case_images')
          .select('*')
          .eq('case_id', caseId)
          .order('order_index', { ascending: true })

        if (imagesError) {
          return new Response(
            JSON.stringify({ error: imagesError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(images),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'POST': {
        const imageData = await req.json() as ImageRequest

        // Validate required fields
        if (!imageData.case_id || !imageData.file_name || !imageData.file_type || !imageData.file_size) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify case ownership
        const { data: existingCase, error: caseError } = await supabaseClient
          .from('medical_cases')
          .select('author_id')
          .eq('id', imageData.case_id)
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

        // Generate storage path
        const storagePath = `cases/${imageData.case_id}/${Date.now()}-${imageData.file_name}`

        // Create image record
        const { data: newImage, error: createError } = await supabaseClient
          .from('case_images')
          .insert({
            ...imageData,
            storage_path: storagePath,
            order_index: imageData.order_index || 0
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate signed URL for upload
        const { data: signedUrl, error: signedUrlError } = await supabaseClient
          .storage
          .from('cases')
          .createSignedUploadUrl(storagePath)

        if (signedUrlError) {
          return new Response(
            JSON.stringify({ error: signedUrlError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            image: newImage,
            upload_url: signedUrl.signedUrl
          }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        const url = new URL(req.url)
        const imageId = url.searchParams.get('id')
        
        if (!imageId) {
          return new Response(
            JSON.stringify({ error: 'Image ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const imageData = await req.json() as Partial<ImageRequest>

        // Verify case ownership through image
        const { data: existingImage, error: imageError } = await supabaseClient
          .from('case_images')
          .select('case_id')
          .eq('id', imageId)
          .single()

        if (imageError) {
          return new Response(
            JSON.stringify({ error: 'Image not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: existingCase, error: caseError } = await supabaseClient
          .from('medical_cases')
          .select('author_id')
          .eq('id', existingImage.case_id)
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

        // Update image
        const { data: updatedImage, error: updateError } = await supabaseClient
          .from('case_images')
          .update({
            ...imageData,
            updated_at: new Date().toISOString()
          })
          .eq('id', imageId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(updatedImage),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const imageId = url.searchParams.get('id')
        
        if (!imageId) {
          return new Response(
            JSON.stringify({ error: 'Image ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify case ownership through image
        const { data: existingImage, error: imageError } = await supabaseClient
          .from('case_images')
          .select('case_id, storage_path')
          .eq('id', imageId)
          .single()

        if (imageError) {
          return new Response(
            JSON.stringify({ error: 'Image not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: existingCase, error: caseError } = await supabaseClient
          .from('medical_cases')
          .select('author_id')
          .eq('id', existingImage.case_id)
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

        // Delete image from storage
        const { error: storageError } = await supabaseClient
          .storage
          .from('cases')
          .remove([existingImage.storage_path])

        if (storageError) {
          return new Response(
            JSON.stringify({ error: storageError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete image record
        const { error: deleteError } = await supabaseClient
          .from('case_images')
          .delete()
          .eq('id', imageId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Image deleted successfully' }),
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