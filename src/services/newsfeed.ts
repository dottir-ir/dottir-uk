import { supabase } from '../lib/supabase';
import { Case } from '../types/case';

interface NewsfeedOptions {
  userId: string;
  cursor?: string;
  limit?: number;
}

interface NewsfeedResponse {
  cases: Case[];
  nextCursor?: string;
}

export async function getPersonalizedFeed({ userId, cursor, limit = 10 }: NewsfeedOptions): Promise<NewsfeedResponse> {
  try {
    // Get user preferences and followed entities
    const { data: user } = await supabase
      .from('users')
      .select('specialty, role')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    const { data: followedUsers } = await supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', userId);

    const { data: followedSpecialties } = await supabase
      .from('specialty_follows')
      .select('specialty')
      .eq('user_id', userId);

    // Calculate weights and limits for each category
    const specialtyLimit = Math.floor(limit * 0.4); // 40% from user's specialty
    const trendingLimit = Math.floor(limit * 0.3); // 30% trending content
    const followedLimit = Math.floor(limit * 0.2); // 20% from followed users
    const educationalLimit = limit - specialtyLimit - trendingLimit - followedLimit; // 10% educational content

    // Get cases from user's specialty
    const specialtyCases = await getSpecialtyCases(user.specialty, specialtyLimit, cursor);

    // Get trending cases
    const trendingCases = await getTrendingCases(trendingLimit, cursor);

    // Get cases from followed users
    const followedCases = await getFollowedUsersCases(
      (followedUsers || []).map(f => f.followed_id),
      followedLimit,
      cursor
    );

    // Get educational cases
    const educationalCases = await getEducationalCases(educationalLimit, cursor);

    // Combine and sort all cases
    const allCases = [...specialtyCases, ...trendingCases, ...followedCases, ...educationalCases]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Remove duplicates
    const uniqueCases = Array.from(new Map(allCases.map(case_ => [case_.id, case_])).values());

    // Get next cursor
    const nextCursor = uniqueCases.length > 0 ? uniqueCases[uniqueCases.length - 1].id : undefined;

    return {
      cases: uniqueCases.slice(0, limit),
      nextCursor
    };
  } catch (error) {
    console.error('Error fetching personalized feed:', error);
    throw error;
  }
}

async function getSpecialtyCases(specialty: string, limit: number, cursor?: string): Promise<Case[]> {
  const query = supabase
    .from('medical_cases')
    .select('*')
    .eq('specialty', specialty)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query.lt('id', cursor);
  }

  const { data } = await query;
  return data || [];
}

async function getTrendingCases(limit: number, cursor?: string): Promise<Case[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const query = supabase
    .from('medical_cases')
    .select('*')
    .gte('created_at', oneWeekAgo.toISOString())
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query.lt('id', cursor);
  }

  const { data } = await query;
  return data || [];
}

async function getFollowedUsersCases(followedUserIds: string[], limit: number, cursor?: string): Promise<Case[]> {
  if (followedUserIds.length === 0) return [];

  const query = supabase
    .from('medical_cases')
    .select('*')
    .in('author_id', followedUserIds)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query.lt('id', cursor);
  }

  const { data } = await query;
  return data || [];
}

async function getEducationalCases(limit: number, cursor?: string): Promise<Case[]> {
  const query = supabase
    .from('medical_cases')
    .select('*')
    .eq('is_educational', true)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query.lt('id', cursor);
  }

  const { data } = await query;
  return data || [];
} 