DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'update_own_affirmations'
    AND polrelid = 'public.affirmations'::regclass
  ) THEN
    CREATE POLICY "update_own_affirmations"
      ON affirmations
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;