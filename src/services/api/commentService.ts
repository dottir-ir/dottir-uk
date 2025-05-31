import { supabase } from '../../lib/supabase';
import { Comment, PaginationParams, SearchResponse } from './types';

export const commentService = {
  async createComment(commentData: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getComment(id: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateComment(id: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCaseComments(
    caseId: string,
    pagination: PaginationParams
  ): Promise<SearchResponse<Comment>> {
    const { data, error, count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('case_id', caseId)
      .is('parent_id', null) // Get only top-level comments
      .order('created_at', { ascending: false })
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

  async getReplies(
    commentId: string,
    pagination: PaginationParams
  ): Promise<SearchResponse<Comment>> {
    const { data, error, count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true })
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

  async getCommentThread(commentId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .or(`id.eq.${commentId},parent_id.eq.${commentId}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
}; 