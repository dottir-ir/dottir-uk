-- Create medical_cases table
CREATE TABLE IF NOT EXISTS medical_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  description TEXT NOT NULL,
  patient_demographics JSONB NOT NULL,
  clinical_history TEXT,
  examination_findings TEXT,
  investigations JSONB,
  diagnosis TEXT,
  treatment TEXT,
  outcome TEXT,
  learning_points TEXT,
  references JSONB,
  tags TEXT[],
  privacy_level INTEGER NOT NULL DEFAULT 1 CHECK (privacy_level BETWEEN 1 AND 3),
  allowed_roles TEXT[] DEFAULT ARRAY['student', 'doctor', 'educator', 'moderator', 'admin'],
  allowed_specialties TEXT[],
  is_educational BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'under_review', 'archived')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medical_cases_author_id ON medical_cases(author_id);
CREATE INDEX IF NOT EXISTS idx_medical_cases_specialty ON medical_cases(specialty);
CREATE INDEX IF NOT EXISTS idx_medical_cases_status ON medical_cases(status);
CREATE INDEX IF NOT EXISTS idx_medical_cases_privacy_level ON medical_cases(privacy_level);
CREATE INDEX IF NOT EXISTS idx_medical_cases_tags ON medical_cases USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_medical_cases_created_at ON medical_cases(created_at);

-- Add RLS policies
ALTER TABLE medical_cases ENABLE ROW LEVEL SECURITY;

-- Users can view cases based on privacy level and role
CREATE POLICY "View cases based on privacy and role" ON medical_cases
  FOR SELECT
  USING (
    -- Public cases (privacy_level = 1)
    (privacy_level = 1) OR
    -- Cases for specific roles
    (auth.role() = ANY(allowed_roles)) OR
    -- Cases for specific specialties
    (auth.jwt() ->> 'specialty' = ANY(allowed_specialties)) OR
    -- Author can always view their own cases
    (author_id = auth.uid())
  );

-- Users can create their own cases
CREATE POLICY "Create own cases" ON medical_cases
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Users can update their own cases
CREATE POLICY "Update own cases" ON medical_cases
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can delete their own cases
CREATE POLICY "Delete own cases" ON medical_cases
  FOR DELETE
  USING (author_id = auth.uid());

-- Admins and moderators can manage all cases
CREATE POLICY "Admins and moderators can manage all cases" ON medical_cases
  FOR ALL
  USING (auth.role() IN ('admin', 'moderator'))
  WITH CHECK (auth.role() IN ('admin', 'moderator')); 