-- =============================================================
-- AARSLS Database Schema  –  Supabase / PostgreSQL
-- =============================================================

-- 1. ROLES ENUM
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin', 'recruiter');

-- 2. PROFILES  (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    department TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SKILLS
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,  -- e.g. 'Programming', 'Design', 'Communication'
    proficiency_level INT NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
    proof_url TEXT,
    image_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (student_id, name)  -- prevent duplicate skills per student
);

-- 4. PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    tech_stack TEXT[],
    project_url TEXT,
    contribution_level INT NOT NULL CHECK (contribution_level BETWEEN 1 AND 5),
    team_size INT DEFAULT 1,
    start_date DATE,
    end_date DATE,
    proof_url TEXT,
    image_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (student_id, title)  -- prevent duplicate projects per student
);

-- 5. CERTIFICATIONS
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    credential_url TEXT,
    proof_url TEXT,
    image_hash TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (student_id, name, issuer)  -- prevent duplicate certs
);

-- 6. PEER VALIDATIONS
CREATE TABLE validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    validator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_self_validation CHECK (validator_id != student_id),
    UNIQUE (skill_id, validator_id)  -- one validation per validator per skill
);

-- 7. REPUTATION SCORES
CREATE TABLE reputation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_score NUMERIC(6,2) DEFAULT 0,
    project_score NUMERIC(6,2) DEFAULT 0,
    certification_score NUMERIC(6,2) DEFAULT 0,
    validation_score NUMERIC(6,2) DEFAULT 0,
    total_score NUMERIC(6,2) DEFAULT 0,
    last_calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. REPUTATION HISTORY (for charts)
CREATE TABLE reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_score NUMERIC(6,2) NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_skills_student ON skills(student_id);
CREATE INDEX idx_projects_student ON projects(student_id);
CREATE INDEX idx_certifications_student ON certifications(student_id);
CREATE INDEX idx_validations_skill ON validations(skill_id);
CREATE INDEX idx_reputation_student ON reputation_scores(student_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- 11. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

