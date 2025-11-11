import { supabase } from '../config/supabase';
import { Course, CourseContent, UserCourseProgress } from '../types/database';

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCourseContent(courseId: string): Promise<CourseContent[]> {
  const { data, error } = await supabase
    .from('course_content')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function getUserCourseProgress(
  userId: string,
  courseId: string
): Promise<UserCourseProgress | null> {
  const { data, error } = await supabase
    .from('user_course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function startCourse(userId: string, courseId: string): Promise<UserCourseProgress> {
  const { data, error } = await supabase
    .from('user_course_progress')
    .insert({
      user_id: userId,
      course_id: courseId,
      progress_percentage: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourseProgress(
  userId: string,
  courseId: string,
  progressPercentage: number
): Promise<UserCourseProgress> {
  const updates: any = {
    progress_percentage: progressPercentage,
    last_accessed_at: new Date().toISOString(),
  };

  if (progressPercentage >= 100) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('user_course_progress')
    .update(updates)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllUserProgress(userId: string): Promise<UserCourseProgress[]> {
  const { data, error } = await supabase
    .from('user_course_progress')
    .select('*')
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
