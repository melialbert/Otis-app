import { supabase } from '../config/supabase';
import { DailyActivity } from '../types/database';
import { calculateDayPoints } from '../utils/points';
import { addPointsToProfile, incrementCompletedDays } from './userService';

export async function getDailyActivities(userId: string, limit = 30): Promise<DailyActivity[]> {
  const { data, error } = await supabase
    .from('daily_activities')
    .select('*')
    .eq('user_id', userId)
    .order('activity_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getActivityByDate(userId: string, date: string): Promise<DailyActivity | null> {
  const { data, error } = await supabase
    .from('daily_activities')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createOrUpdateActivity(
  userId: string,
  activityData: {
    activity_date: string;
    photos_count: number;
    video_completed: boolean;
    editing_completed: boolean;
    editing_time_minutes: number;
    comments: string;
  }
): Promise<DailyActivity> {
  const { points, isComplete } = calculateDayPoints(
    activityData.photos_count,
    activityData.video_completed,
    activityData.editing_completed
  );

  const existingActivity = await getActivityByDate(userId, activityData.activity_date);

  if (existingActivity) {
    const pointsDifference = points - existingActivity.points_earned;

    const { data, error } = await supabase
      .from('daily_activities')
      .update({
        ...activityData,
        points_earned: points,
        is_complete: isComplete,
      })
      .eq('id', existingActivity.id)
      .select()
      .single();

    if (error) throw error;

    if (pointsDifference !== 0) {
      await addPointsToProfile(userId, pointsDifference);
    }

    if (isComplete && !existingActivity.is_complete) {
      await incrementCompletedDays(userId);
    }

    return data;
  } else {
    const { data, error } = await supabase
      .from('daily_activities')
      .insert({
        user_id: userId,
        ...activityData,
        points_earned: points,
        is_complete: isComplete,
      })
      .select()
      .single();

    if (error) throw error;

    await addPointsToProfile(userId, points);

    if (isComplete) {
      await incrementCompletedDays(userId);
    }

    return data;
  }
}

export async function deleteActivity(activityId: string, userId: string): Promise<void> {
  const { data: activity } = await supabase
    .from('daily_activities')
    .select('*')
    .eq('id', activityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!activity) throw new Error('Activity not found');

  const { error } = await supabase
    .from('daily_activities')
    .delete()
    .eq('id', activityId)
    .eq('user_id', userId);

  if (error) throw error;

  await addPointsToProfile(userId, -activity.points_earned);

  if (activity.is_complete) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('completed_days')
      .eq('user_id', userId)
      .single();

    if (profile && profile.completed_days > 0) {
      await supabase
        .from('user_profiles')
        .update({ completed_days: profile.completed_days - 1 })
        .eq('user_id', userId);
    }
  }
}
