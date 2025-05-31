import { supabase } from '../../lib/supabase';
import { Profile, PaginationParams, SearchResponse } from './types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await this.updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
  },

  async searchProfiles(
    searchTerm: string,
    pagination: PaginationParams
  ): Promise<SearchResponse<Profile>> {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
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

  async getDoctors(
    pagination: PaginationParams
  ): Promise<SearchResponse<Profile>> {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'doctor')
      .eq('is_verified', true)
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

  async verifyDoctor(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
}; 