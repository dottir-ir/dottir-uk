import { supabase } from '../../lib/supabase';
import { Case, Profile, SearchFilters, PaginationParams, SearchResponse } from './types';

export const searchService = {
  async searchCases(
    searchTerm: string,
    filters: SearchFilters,
    pagination: PaginationParams
  ): Promise<SearchResponse<Case>> {
    let query = supabase
      .from('cases')
      .select(`
        *,
        attachments:case_attachments(*)
      `, { count: 'exact' });

    // Apply search term
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
    }

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

    // Apply pagination
    const { data, error, count } = await query
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

  async searchProfiles(
    searchTerm: string,
    pagination: PaginationParams,
    role?: Profile['role']
  ): Promise<SearchResponse<Profile>> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply search term
    if (searchTerm) {
      query = query.or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    const { data, error, count } = await query
      .order('full_name', { ascending: true })
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

  async searchComments(
    searchTerm: string,
    pagination: PaginationParams,
    caseId?: string
  ): Promise<SearchResponse<any>> {
    let query = supabase
      .from('comments')
      .select(`
        *,
        case:cases(id, title),
        author:profiles(id, username, full_name, avatar_url)
      `, { count: 'exact' });

    // Apply search term
    if (searchTerm) {
      query = query.ilike('content', `%${searchTerm}%`);
    }

    // Apply case filter
    if (caseId) {
      query = query.eq('case_id', caseId);
    }

    // Apply pagination
    const { data, error, count } = await query
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

  async getPopularTags(limit: number = 10): Promise<{ tag: string; count: number }[]> {
    const { data, error } = await supabase
      .from('cases')
      .select('tags');

    if (error) throw error;

    // Count tag occurrences
    const tagCounts = new Map<string, number>();
    data?.forEach(case_ => {
      case_.tags?.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Convert to array and sort by count
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  async getRelatedCases(caseId: string, limit: number = 5): Promise<Case[]> {
    // Get the case's tags
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('tags')
      .eq('id', caseId)
      .single();

    if (caseError) throw caseError;

    // Find cases with similar tags
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .neq('id', caseId)
      .contains('tags', caseData.tags)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
}; 