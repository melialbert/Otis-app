/*
  # Application d'apprentissage gamifiée - Schéma de base de données

  ## Vue d'ensemble
  Ce schéma supporte une application mobile d'apprentissage avec gamification,
  permettant aux utilisateurs de suivre leur progression sur 100 jours.

  ## 1. Nouvelles Tables

  ### `user_profiles`
  Profils utilisateurs avec statistiques globales
  - `id` (uuid, primary key) - Identifiant unique
  - `user_id` (uuid, foreign key) - Lien vers auth.users
  - `total_points` (integer) - Points accumulés
  - `completed_days` (integer) - Jours complétés sur 100
  - `current_level` (text) - Niveau actuel (seedling, target, star, diamond, trophy)
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Dernière mise à jour

  ### `daily_activities`
  Activités quotidiennes (photos, vidéos, montages)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `activity_date` (date) - Date de l'activité
  - `photos_count` (integer) - Nombre de photos (objectif: 3)
  - `video_completed` (boolean) - Vidéo réalisée
  - `editing_completed` (boolean) - Montage terminé
  - `editing_time_minutes` (integer) - Temps de montage en minutes
  - `comments` (text) - Commentaires de l'utilisateur
  - `points_earned` (integer) - Points gagnés ce jour
  - `is_complete` (boolean) - Journée complète (bonus)
  - `created_at` (timestamptz)

  ### `courses`
  Modules de cours disponibles
  - `id` (uuid, primary key)
  - `title` (text) - Titre du cours
  - `description` (text) - Description
  - `category` (text) - Catégorie (audiovisual, photography, video_editing)
  - `difficulty` (text) - Difficulté (beginner, intermediate, advanced)
  - `estimated_duration_minutes` (integer) - Durée estimée
  - `points_reward` (integer) - Points à gagner
  - `order_index` (integer) - Ordre d'affichage
  - `is_published` (boolean) - Publié ou non
  - `created_at` (timestamptz)

  ### `course_content`
  Contenu des cours (leçons)
  - `id` (uuid, primary key)
  - `course_id` (uuid, foreign key)
  - `title` (text) - Titre de la leçon
  - `content_type` (text) - Type (text, video, image, exercise)
  - `content` (text) - Contenu
  - `order_index` (integer) - Ordre dans le cours
  - `created_at` (timestamptz)

  ### `user_course_progress`
  Progression des utilisateurs dans les cours
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `course_id` (uuid, foreign key)
  - `started_at` (timestamptz) - Date de début
  - `completed_at` (timestamptz) - Date de complétion
  - `progress_percentage` (integer) - Progression (0-100)
  - `last_accessed_at` (timestamptz)

  ### `quizzes`
  Quiz liés aux cours
  - `id` (uuid, primary key)
  - `course_id` (uuid, foreign key)
  - `title` (text) - Titre du quiz
  - `description` (text) - Description
  - `passing_score` (integer) - Score minimum pour réussir
  - `points_reward` (integer) - Points à gagner
  - `time_limit_minutes` (integer) - Temps limité
  - `created_at` (timestamptz)

  ### `quiz_questions`
  Questions des quiz
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key)
  - `question_text` (text) - Question
  - `question_type` (text) - Type (multiple_choice, true_false, open_ended)
  - `correct_answer` (text) - Réponse correcte
  - `options` (jsonb) - Options pour choix multiples
  - `points` (integer) - Points pour cette question
  - `order_index` (integer)
  - `explanation` (text) - Explication de la réponse

  ### `user_quiz_attempts`
  Tentatives de quiz par les utilisateurs
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `quiz_id` (uuid, foreign key)
  - `score` (integer) - Score obtenu
  - `max_score` (integer) - Score maximum possible
  - `passed` (boolean) - Réussi ou non
  - `answers` (jsonb) - Réponses données
  - `completed_at` (timestamptz)
  - `time_taken_minutes` (integer)

  ### `achievements`
  Badges et récompenses
  - `id` (uuid, primary key)
  - `title` (text) - Titre du badge
  - `description` (text) - Description
  - `emoji` (text) - Emoji représentatif
  - `requirement_type` (text) - Type de condition (points, days, streak, courses)
  - `requirement_value` (integer) - Valeur à atteindre
  - `created_at` (timestamptz)

  ### `user_achievements`
  Badges obtenus par les utilisateurs
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `achievement_id` (uuid, foreign key)
  - `earned_at` (timestamptz)

  ## 2. Sécurité
  - RLS activé sur toutes les tables
  - Policies restrictives: utilisateurs authentifiés uniquement
  - Accès limité aux données personnelles de chaque utilisateur
  - Tables de contenu (courses, quizzes, achievements) en lecture seule pour tous

  ## 3. Notes importantes
  - Les valeurs par défaut assurent la cohérence des données
  - Les timestamps sont gérés automatiquement
  - Le système de points encourage l'engagement quotidien
  - Objectif: 100 jours pour maîtrise complète
*/

-- Table: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_points integer DEFAULT 0 NOT NULL,
  completed_days integer DEFAULT 0 NOT NULL,
  current_level text DEFAULT 'seedling' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: daily_activities
CREATE TABLE IF NOT EXISTS daily_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_date date DEFAULT CURRENT_DATE NOT NULL,
  photos_count integer DEFAULT 0 NOT NULL,
  video_completed boolean DEFAULT false NOT NULL,
  editing_completed boolean DEFAULT false NOT NULL,
  editing_time_minutes integer DEFAULT 0 NOT NULL,
  comments text DEFAULT '' NOT NULL,
  points_earned integer DEFAULT 0 NOT NULL,
  is_complete boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON daily_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON daily_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON daily_activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON daily_activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table: courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  category text DEFAULT 'audiovisual' NOT NULL,
  difficulty text DEFAULT 'beginner' NOT NULL,
  estimated_duration_minutes integer DEFAULT 30 NOT NULL,
  points_reward integer DEFAULT 50 NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  is_published boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Table: course_content
CREATE TABLE IF NOT EXISTS course_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content_type text DEFAULT 'text' NOT NULL,
  content text DEFAULT '' NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course content"
  ON course_content FOR SELECT
  TO authenticated
  USING (true);

-- Table: user_course_progress
CREATE TABLE IF NOT EXISTS user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0 NOT NULL,
  last_accessed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id)
);

ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_course_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_course_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_course_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  passing_score integer DEFAULT 70 NOT NULL,
  points_reward integer DEFAULT 100 NOT NULL,
  time_limit_minutes integer DEFAULT 15 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (true);

-- Table: quiz_questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type text DEFAULT 'multiple_choice' NOT NULL,
  correct_answer text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb NOT NULL,
  points integer DEFAULT 10 NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  explanation text DEFAULT '' NOT NULL
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (true);

-- Table: user_quiz_attempts
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0 NOT NULL,
  max_score integer NOT NULL,
  passed boolean DEFAULT false NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  time_taken_minutes integer DEFAULT 0 NOT NULL
);

ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
  ON user_quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON user_quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table: achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  emoji text DEFAULT '🏆' NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- Table: user_achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON daily_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user ON user_quiz_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_content_course ON course_content(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, order_index);