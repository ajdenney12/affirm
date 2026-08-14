/*
  # Create Affirmations and Goals Tables

  1. New Tables
    - `affirmations`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (uuid, references auth.users, not null)
      - `text` (text, not null) - The affirmation text content
      - `timestamp` (timestamptz, default now()) - When the affirmation was created
      - `created_at` (timestamptz, default now()) - Database record creation time

    - `goals`
      - `id` (bigint, primary key, auto-increment)
      - `user_id` (uuid, references auth.users, not null)
      - `title` (text, not null) - Goal title
      - `description` (text, nullable) - Optional goal description
      - `type` (text, not null) - Type of goal: 'progress', 'habit', or 'milestone'
      - `target` (integer, default 100) - Target value for the goal
      - `current` (integer, default 0) - Current progress value
      - `status` (text, default 'active') - Goal status
      - `milestones` (jsonb, nullable) - Array of milestones for milestone-type goals
      - `habit_days` (jsonb, nullable) - Array of completed days for habit-type goals
      - `created_at` (timestamptz, default now()) - When the goal was created

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read their own affirmations and goals
      - Insert their own affirmations and goals
      - Update their own goals
      - Delete their own affirmations and goals
*/

-- Create affirmations table
CREATE TABLE IF NOT EXISTS affirmations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  target integer DEFAULT 100,
  current integer DEFAULT 0,
  status text DEFAULT 'active',
  milestones jsonb,
  habit_days jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS affirmations_user_id_idx ON affirmations(user_id);
CREATE INDEX IF NOT EXISTS affirmations_timestamp_idx ON affirmations(timestamp DESC);
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);
CREATE INDEX IF NOT EXISTS goals_status_idx ON goals(status);

-- Enable Row Level Security
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affirmations table
CREATE POLICY "Users can view own affirmations"
  ON affirmations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affirmations"
  ON affirmations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own affirmations"
  ON affirmations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for goals table
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);