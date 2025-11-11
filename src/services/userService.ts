import { supabase } from '../config/supabase';
import { UserProfile } from '../types/database';
import { getLevelFromPoints } from '../utils/points';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      total_points: 0,
      completed_days: 0,
      current_level: 'seedling',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addPointsToProfile(userId: string, points: number): Promise<UserProfile> {
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error('Profile not found');

  const newTotalPoints = profile.total_points + points;
  const newLevel = getLevelFromPoints(newTotalPoints);

  return await updateUserProfile(userId, {
    total_points: newTotalPoints,
    current_level: newLevel,
  });
}

export async function incrementCompletedDays(userId: string): Promise<UserProfile> {
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error('Profile not found');

  return await updateUserProfile(userId, {
    completed_days: profile.completed_days + 1,
  });
}
