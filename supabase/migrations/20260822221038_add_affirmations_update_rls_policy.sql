/*
  # Add Missing UPDATE RLS Policy on affirmations

  ## Background
  The affirmations table has RLS enabled with SELECT, INSERT, and DELETE policies,
  but no UPDATE policy. When RLS is enabled and no policy exists for a command,
  that command is denied for all roles. This means the app's "edit affirmation"
  feature silently fails at the database level.

  ## Changes
  - Adds a single UPDATE policy on the affirmations table.

  ## Security
  - The policy is scoped to the `authenticated` role.
  - The USING clause (`auth.uid() = user_id`) ensures a user can only update
    rows they already own.
  - The WITH CHECK clause (`auth.uid() = user_id`) ensures that after the update,
    the row must still belong to the same user — preventing ownership reassignment.

  ## No other changes
  - No changes to goals or user_subscriptions policies.
  - No changes to existing affirmations SELECT, INSERT, or DELETE policies.
  - RLS remains enabled on affirmations.
*/

DROP POLICY IF EXISTS "Users can update own affirmations" ON affirmations;

CREATE POLICY "Users can update own affirmations"
  ON affirmations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
