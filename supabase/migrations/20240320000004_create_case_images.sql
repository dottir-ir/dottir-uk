-- Create case_images table
CREATE TABLE IF NOT EXISTS case_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES medical_cases(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  description TEXT,
  annotations JSONB,
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_case_images_case_id ON case_images(case_id);
CREATE INDEX IF NOT EXISTS idx_case_images_order_index ON case_images(order_index);

-- Add RLS policies
ALTER TABLE case_images ENABLE ROW LEVEL SECURITY;

-- Users can view images for cases they have access to
CREATE POLICY "View case images" ON case_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM medical_cases
      WHERE medical_cases.id = case_images.case_id
      AND (
        -- Public cases
        (medical_cases.privacy_level = 1) OR
        -- Cases for specific roles
        (auth.role() = ANY(medical_cases.allowed_roles)) OR
        -- Cases for specific specialties
        (auth.jwt() ->> 'specialty' = ANY(medical_cases.allowed_specialties)) OR
        -- Author can always view their own cases
        (medical_cases.author_id = auth.uid())
      )
    )
  );

-- Users can create images for their own cases
CREATE POLICY "Create case images" ON case_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medical_cases
      WHERE medical_cases.id = case_images.case_id
      AND medical_cases.author_id = auth.uid()
    )
  );

-- Users can update images for their own cases
CREATE POLICY "Update case images" ON case_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM medical_cases
      WHERE medical_cases.id = case_images.case_id
      AND medical_cases.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medical_cases
      WHERE medical_cases.id = case_images.case_id
      AND medical_cases.author_id = auth.uid()
    )
  );

-- Users can delete images from their own cases
CREATE POLICY "Delete case images" ON case_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM medical_cases
      WHERE medical_cases.id = case_images.case_id
      AND medical_cases.author_id = auth.uid()
    )
  );

-- Admins and moderators can manage all case images
CREATE POLICY "Admins and moderators can manage all case images" ON case_images
  FOR ALL
  USING (auth.role() IN ('admin', 'moderator'))
  WITH CHECK (auth.role() IN ('admin', 'moderator')); 