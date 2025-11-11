export interface UserProfile {
  id: string;
  user_id: string;
  total_points: number;
  completed_days: number;
  current_level: 'seedling' | 'target' | 'star' | 'diamond' | 'trophy';
  created_at: string;
  updated_at: string;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  activity_date: string;
  photos_count: number;
  video_completed: boolean;
  editing_completed: boolean;
  editing_time_minutes: number;
  comments: string;
  points_earned: number;
  is_complete: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'audiovisual' | 'photography' | 'video_editing';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  points_reward: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

export interface CourseContent {
  id: string;
  course_id: string;
  title: string;
  content_type: 'text' | 'video' | 'image' | 'exercise';
  content: string;
  order_index: number;
  created_at: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  started_at: string;
  completed_at?: string;
  progress_percentage: number;
  last_accessed_at: string;
}

export interface Quiz {
  id: string;
  course_id?: string;
  title: string;
  description: string;
  passing_score: number;
  points_reward: number;
  time_limit_minutes: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'open_ended';
  correct_answer: string;
  options: string[];
  points: number;
  order_index: number;
  explanation: string;
}

export interface UserQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  passed: boolean;
  answers: Record<string, string>;
  completed_at: string;
  time_taken_minutes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requirement_type: 'points' | 'days' | 'streak' | 'courses';
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}
