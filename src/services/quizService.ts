import { supabase } from '../config/supabase';
import { Quiz, QuizQuestion, UserQuizAttempt } from '../types/database';
import { addPointsToProfile } from './userService';

export async function getQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getQuizById(quizId: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function submitQuizAttempt(
  userId: string,
  quizId: string,
  answers: Record<string, string>,
  timeTakenMinutes: number
): Promise<UserQuizAttempt> {
  const questions = await getQuizQuestions(quizId);
  const quiz = await getQuizById(quizId);

  if (!quiz) throw new Error('Quiz not found');

  let score = 0;
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

  questions.forEach((question) => {
    if (answers[question.id] === question.correct_answer) {
      score += question.points;
    }
  });

  const passed = (score / maxScore) * 100 >= quiz.passing_score;

  const { data, error } = await supabase
    .from('user_quiz_attempts')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      score,
      max_score: maxScore,
      passed,
      answers,
      time_taken_minutes: timeTakenMinutes,
    })
    .select()
    .single();

  if (error) throw error;

  if (passed) {
    await addPointsToProfile(userId, quiz.points_reward);
  }

  return data;
}

export async function getUserQuizAttempts(userId: string): Promise<UserQuizAttempt[]> {
  const { data, error } = await supabase
    .from('user_quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBestQuizAttempt(
  userId: string,
  quizId: string
): Promise<UserQuizAttempt | null> {
  const { data, error } = await supabase
    .from('user_quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
