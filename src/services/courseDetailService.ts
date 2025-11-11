import { supabase } from '../config/supabase';
import {
  CourseWeek,
  CourseActivity,
  CourseProject,
  ProjectEvaluationCriteria,
  UserActivityCompletion,
} from '../types/database';

export async function getCourseWeeks(courseId: string): Promise<CourseWeek[]> {
  const { data, error } = await supabase
    .from('course_weeks')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getWeekActivities(weekId: string): Promise<CourseActivity[]> {
  const { data, error } = await supabase
    .from('course_activities')
    .select('*')
    .eq('week_id', weekId)
    .order('day_number', { ascending: true })
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCourseActivities(courseId: string): Promise<CourseActivity[]> {
  const { data: weeks } = await supabase
    .from('course_weeks')
    .select('id')
    .eq('course_id', courseId);

  if (!weeks || weeks.length === 0) return [];

  const weekIds = weeks.map(w => w.id);

  const { data, error } = await supabase
    .from('course_activities')
    .select('*')
    .in('week_id', weekIds)
    .order('day_number', { ascending: true })
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCourseProject(courseId: string): Promise<CourseProject | null> {
  const { data, error } = await supabase
    .from('course_projects')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProjectCriteria(projectId: string): Promise<ProjectEvaluationCriteria[]> {
  const { data, error } = await supabase
    .from('project_evaluation_criteria')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getUserActivityCompletions(
  userId: string,
  activityIds: string[]
): Promise<UserActivityCompletion[]> {
  if (activityIds.length === 0) return [];

  const { data, error } = await supabase
    .from('user_activity_completion')
    .select('*')
    .eq('user_id', userId)
    .in('activity_id', activityIds);

  if (error) throw error;
  return data || [];
}

export async function toggleActivityCompletion(
  userId: string,
  activityId: string,
  completed: boolean
): Promise<UserActivityCompletion> {
  const { data: existing } = await supabase
    .from('user_activity_completion')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_id', activityId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('user_activity_completion')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('user_activity_completion')
      .insert({
        user_id: userId,
        activity_id: activityId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
