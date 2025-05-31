import { supabase } from '../../lib/supabase';
import { Case, SearchFilters, PaginationParams, SearchResponse, Attachment } from './types';

export const caseService = {
  async createCase(caseData: Omit<Case, 'id' | 'created_at' | 'updated_at'>): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .insert([caseData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCase(id: string): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        attachments:case_attachments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCase(id: string): Promise<void> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async searchCases(
    filters: SearchFilters,
    pagination: PaginationParams
  ): Promise<SearchResponse<Case>> {
    let query = supabase
      .from('cases')
      .select(`
        *,
        attachments:case_attachments(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    if (filters.tags?.length) {
      query = query.contains('tags', filters.tags);
    }
    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id);
    }
    if (filters.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end);
    }
    if (filters.search_term) {
      query = query.or(`title.ilike.%${filters.search_term}%,content.ilike.%${filters.search_term}%`);
    }

    // Apply pagination
    const { data, error, count } = await query
      .range(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit - 1
      );

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page,
      total_pages: Math.ceil((count || 0) / pagination.limit),
    };
  },

  async uploadAttachment(
    caseId: string,
    file: File,
    metadata: Omit<Attachment, 'id' | 'case_id' | 'created_at'>
  ): Promise<Attachment> {
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${caseId}-${Date.now()}.${fileExt}`;
    const filePath = `case-attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    // Create attachment record
    const { data, error } = await supabase
      .from('case_attachments')
      .insert([
        {
          case_id: caseId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: metadata.uploaded_by,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    const { error } = await supabase
      .from('case_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) throw error;
  },
}; 