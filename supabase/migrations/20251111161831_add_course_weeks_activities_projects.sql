/*
  # Ajout de la structure des semaines, activités et projets finaux

  ## Vue d'ensemble
  Cette migration ajoute la structure complète pour les modules de formation avec:
  - Semaines de cours
  - Activités quotidiennes par semaine
  - Projets finaux avec critères d'évaluation

  ## 1. Nouvelles Tables

  ### `course_weeks`
  Semaines d'un module de formation
  - `id` (uuid, primary key)
  - `course_id` (uuid, foreign key) - Lien vers le cours
  - `week_number` (integer) - Numéro de la semaine
  - `title` (text) - Titre de la semaine
  - `description` (text) - Description
  - `order_index` (integer) - Ordre d'affichage
  - `created_at` (timestamptz)

  ### `course_activities`
  Activités quotidiennes dans une semaine
  - `id` (uuid, primary key)
  - `week_id` (uuid, foreign key) - Lien vers la semaine
  - `day_number` (integer) - Jour de la semaine (1-7)
  - `title` (text) - Titre de l'activité
  - `activity_type` (text) - Type: COURS, VIDÉO, QUIZ, EXERCICE
  - `description` (text) - Description détaillée
  - `duration_minutes` (integer) - Durée estimée
  - `xp_reward` (integer) - Points XP à gagner
  - `order_index` (integer) - Ordre d'affichage
  - `created_at` (timestamptz)

  ### `course_projects`
  Projets finaux pour les modules
  - `id` (uuid, primary key)
  - `course_id` (uuid, foreign key) - Lien vers le cours
  - `title` (text) - Titre du projet
  - `description` (text) - Description complète
  - `xp_reward` (integer) - Points XP à gagner
  - `deadline_days` (integer) - Nombre de jours pour compléter
  - `requirements` (jsonb) - Liste des exigences (array)
  - `created_at` (timestamptz)

  ### `project_evaluation_criteria`
  Critères d'évaluation des projets
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key) - Lien vers le projet
  - `title` (text) - Titre du critère
  - `description` (text) - Description
  - `max_points` (integer) - Points maximum pour ce critère
  - `order_index` (integer) - Ordre d'affichage
  - `created_at` (timestamptz)

  ### `user_activity_completion`
  Suivi de complétion des activités par utilisateur
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `activity_id` (uuid, foreign key)
  - `completed` (boolean) - Complété ou non
  - `completed_at` (timestamptz) - Date de complétion
  - `created_at` (timestamptz)

  ### `user_project_submissions`
  Soumissions de projets par les utilisateurs
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `project_id` (uuid, foreign key)
  - `submission_data` (jsonb) - Données de la soumission
  - `total_score` (integer) - Score total obtenu
  - `submitted_at` (timestamptz)
  - `evaluated_at` (timestamptz) - Date d'évaluation
  - `created_at` (timestamptz)

  ## 2. Sécurité
  - RLS activé sur toutes les tables
  - Tables de contenu (weeks, activities, projects, criteria) en lecture seule
  - Tables utilisateur (completion, submissions) avec accès personnel uniquement

  ## 3. Notes importantes
  - Structure flexible pour supporter différents types d'activités
  - Les exigences et données sont stockées en JSONB pour flexibilité
  - Système de tracking précis de la progression
*/

-- Table: course_weeks
CREATE TABLE IF NOT EXISTS course_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE course_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course weeks"
  ON course_weeks FOR SELECT
  TO authenticated
  USING (true);

-- Table: course_activities
CREATE TABLE IF NOT EXISTS course_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid REFERENCES course_weeks(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  activity_type text NOT NULL,
  description text DEFAULT '' NOT NULL,
  duration_minutes integer DEFAULT 30 NOT NULL,
  xp_reward integer DEFAULT 50 NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE course_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course activities"
  ON course_activities FOR SELECT
  TO authenticated
  USING (true);

-- Table: course_projects
CREATE TABLE IF NOT EXISTS course_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  xp_reward integer DEFAULT 100 NOT NULL,
  deadline_days integer DEFAULT 7 NOT NULL,
  requirements jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE course_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course projects"
  ON course_projects FOR SELECT
  TO authenticated
  USING (true);

-- Table: project_evaluation_criteria
CREATE TABLE IF NOT EXISTS project_evaluation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES course_projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  max_points integer NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE project_evaluation_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view evaluation criteria"
  ON project_evaluation_criteria FOR SELECT
  TO authenticated
  USING (true);

-- Table: user_activity_completion
CREATE TABLE IF NOT EXISTS user_activity_completion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES course_activities(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, activity_id)
);

ALTER TABLE user_activity_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity completion"
  ON user_activity_completion FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity completion"
  ON user_activity_completion FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity completion"
  ON user_activity_completion FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: user_project_submissions
CREATE TABLE IF NOT EXISTS user_project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES course_projects(id) ON DELETE CASCADE NOT NULL,
  submission_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  total_score integer DEFAULT 0 NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  evaluated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, project_id)
);

ALTER TABLE user_project_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project submissions"
  ON user_project_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project submissions"
  ON user_project_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project submissions"
  ON user_project_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_course_weeks_course ON course_weeks(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_activities_week ON course_activities(week_id, day_number, order_index);
CREATE INDEX IF NOT EXISTS idx_course_projects_course ON course_projects(course_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_project ON project_evaluation_criteria(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_activity_completion_user ON user_activity_completion(user_id, activity_id);
CREATE INDEX IF NOT EXISTS idx_user_project_submissions_user ON user_project_submissions(user_id, project_id);
