-- =============================================================
-- AARSLS  –  Automated Reputation Scoring Logic
-- =============================================================
-- Weightages:
--   Skill Proficiency  : 30%
--   Project Contribution: 30%
--   Verified Certs      : 20%
--   Peer Validation     : 20%
-- =============================================================

-- -------------------------------------------------------
-- Core function: recalculate_reputation(student_uuid)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_reputation(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
    v_skill_score   NUMERIC(6,2) := 0;
    v_project_score NUMERIC(6,2) := 0;
    v_cert_score    NUMERIC(6,2) := 0;
    v_valid_score   NUMERIC(6,2) := 0;
    v_total         NUMERIC(6,2) := 0;
BEGIN
    -- Skill score: avg proficiency (1-5) normalised to 0-100, weight 30%
    -- Penalty: If no proof_url is provided, the skill value is halved (0.5 multiplier)
    SELECT COALESCE(
        AVG(proficiency_level * CASE WHEN proof_url IS NOT NULL THEN 1.0 ELSE 0.5 END) / 5.0 * 100, 0
    )
      INTO v_skill_score
      FROM skills WHERE student_id = p_student_id;

    -- Project score: avg contribution_level (1-5) normalised to 0-100, weight 30%
    -- Penalty: If no proof_url is provided, the project value is halved (0.5 multiplier)
    SELECT COALESCE(
        AVG(contribution_level * CASE WHEN proof_url IS NOT NULL THEN 1.0 ELSE 0.5 END) / 5.0 * 100, 0
    )
      INTO v_project_score
      FROM projects WHERE student_id = p_student_id;

    -- Certification score: ratio of approved certs out of 10 (cap), weight 20%
    SELECT COALESCE(
        LEAST(COUNT(*), 10)::NUMERIC / 10.0 * 100, 0
    )
      INTO v_cert_score
      FROM certifications
     WHERE student_id = p_student_id
       AND verification_status = 'approved';

    -- Peer validation score: avg rating across all validated skills, weight 20%
    SELECT COALESCE(AVG(v.rating) / 5.0 * 100, 0)
      INTO v_valid_score
      FROM validations v
      JOIN skills s ON v.skill_id = s.id
     WHERE s.student_id = p_student_id;

    -- Weighted total
    v_total := (v_skill_score  * 0.30)
             + (v_project_score * 0.30)
             + (v_cert_score    * 0.20)
             + (v_valid_score   * 0.20);

    -- Upsert reputation_scores
    INSERT INTO reputation_scores
        (student_id, skill_score, project_score, certification_score, validation_score, total_score, last_calculated_at)
    VALUES
        (p_student_id, v_skill_score, v_project_score, v_cert_score, v_valid_score, v_total, now())
    ON CONFLICT (student_id)
    DO UPDATE SET
        skill_score          = EXCLUDED.skill_score,
        project_score        = EXCLUDED.project_score,
        certification_score  = EXCLUDED.certification_score,
        validation_score     = EXCLUDED.validation_score,
        total_score          = EXCLUDED.total_score,
        last_calculated_at   = now();

    -- Append to history (one per day, upsert)
    INSERT INTO reputation_history (student_id, total_score, snapshot_date)
    VALUES (p_student_id, v_total, CURRENT_DATE)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------
-- Trigger functions
-- -------------------------------------------------------

-- After INSERT / UPDATE / DELETE on skills
CREATE OR REPLACE FUNCTION trg_skills_reputation() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_reputation(OLD.student_id);
    ELSE
        PERFORM recalculate_reputation(NEW.student_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS skills_reputation_trigger ON skills;
CREATE TRIGGER skills_reputation_trigger
AFTER INSERT OR UPDATE OR DELETE ON skills
FOR EACH ROW EXECUTE FUNCTION trg_skills_reputation();

-- After INSERT / UPDATE / DELETE on projects
CREATE OR REPLACE FUNCTION trg_projects_reputation() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_reputation(OLD.student_id);
    ELSE
        PERFORM recalculate_reputation(NEW.student_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS projects_reputation_trigger ON projects;
CREATE TRIGGER projects_reputation_trigger
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION trg_projects_reputation();

-- After UPDATE on certifications (status change)
CREATE OR REPLACE FUNCTION trg_certs_reputation() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
        PERFORM recalculate_reputation(NEW.student_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS certs_reputation_trigger ON certifications;
CREATE TRIGGER certs_reputation_trigger
AFTER UPDATE ON certifications
FOR EACH ROW EXECUTE FUNCTION trg_certs_reputation();

-- After INSERT on certifications (newly added → still pending but prepare)
CREATE OR REPLACE FUNCTION trg_certs_insert() RETURNS TRIGGER AS $$
BEGIN
    PERFORM recalculate_reputation(NEW.student_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS certs_insert_trigger ON certifications;
CREATE TRIGGER certs_insert_trigger
AFTER INSERT ON certifications
FOR EACH ROW EXECUTE FUNCTION trg_certs_insert();

-- After INSERT / DELETE on validations
CREATE OR REPLACE FUNCTION trg_validations_reputation() RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT student_id INTO v_student_id FROM skills WHERE id = OLD.skill_id;
    ELSE
        SELECT student_id INTO v_student_id FROM skills WHERE id = NEW.skill_id;
    END IF;
    IF v_student_id IS NOT NULL THEN
        PERFORM recalculate_reputation(v_student_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validations_reputation_trigger ON validations;
CREATE TRIGGER validations_reputation_trigger
AFTER INSERT OR UPDATE OR DELETE ON validations
FOR EACH ROW EXECUTE FUNCTION trg_validations_reputation();

-- -------------------------------------------------------
-- Audit log trigger (generic)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_audit_log() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        COALESCE(current_setting('app.current_user_id', true)::UUID, NULL),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit trigger to core tables
DROP TRIGGER IF EXISTS audit_skills ON skills;
CREATE TRIGGER audit_skills     AFTER INSERT OR UPDATE OR DELETE ON skills        FOR EACH ROW EXECUTE FUNCTION trg_audit_log();
DROP TRIGGER IF EXISTS audit_projects ON projects;
CREATE TRIGGER audit_projects   AFTER INSERT OR UPDATE OR DELETE ON projects      FOR EACH ROW EXECUTE FUNCTION trg_audit_log();
DROP TRIGGER IF EXISTS audit_certs ON certifications;
CREATE TRIGGER audit_certs      AFTER INSERT OR UPDATE OR DELETE ON certifications FOR EACH ROW EXECUTE FUNCTION trg_audit_log();
DROP TRIGGER IF EXISTS audit_validations ON validations;
CREATE TRIGGER audit_validations AFTER INSERT OR UPDATE OR DELETE ON validations   FOR EACH ROW EXECUTE FUNCTION trg_audit_log();
