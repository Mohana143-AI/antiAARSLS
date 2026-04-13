-- 1. Add matches_detected column to reputation_scores
ALTER TABLE reputation_scores 
ADD COLUMN IF NOT EXISTS matches_detected INT DEFAULT 0;

-- 2. Create the increment_reputation RPC function
-- This function allows the backend to atomically update scores.
-- Usage: select increment_reputation(user_id, points, column_name)
CREATE OR REPLACE FUNCTION increment_reputation(
    uid UUID,
    amount NUMERIC,
    field TEXT,
    points NUMERIC DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'INSERT INTO reputation_scores (student_id, %I, total_score, last_calculated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (student_id) 
         DO UPDATE SET %I = COALESCE(reputation_scores.%I, 0) + $2, 
                       total_score = COALESCE(reputation_scores.total_score, 0) + $3,
                       last_calculated_at = now()', 
        field, field, field
    )
    USING uid, amount, points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
