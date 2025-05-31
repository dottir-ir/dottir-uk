-- Create case_comments table
CREATE TABLE case_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES medical_cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES case_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX case_comments_case_id_idx ON case_comments(case_id);
CREATE INDEX case_comments_author_id_idx ON case_comments(author_id);
CREATE INDEX case_comments_parent_id_idx ON case_comments(parent_id);
CREATE INDEX case_comments_created_at_idx ON case_comments(created_at);

-- Enable Row Level Security
ALTER TABLE case_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view comments on cases they have access to"
  ON case_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM medical_cases c
      WHERE c.id = case_comments.case_id
      AND (
        c.privacy_level = 0 -- Public
        OR c.author_id = auth.uid() -- Case author
        OR c.allowed_roles @> ARRAY[auth.jwt()->>'role'] -- Allowed role
        OR c.allowed_specialties @> ARRAY[auth.jwt()->>'specialty'] -- Allowed specialty
      )
    )
  );

CREATE POLICY "Users can create comments on cases they have access to"
  ON case_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medical_cases c
      WHERE c.id = case_comments.case_id
      AND (
        c.privacy_level = 0 -- Public
        OR c.author_id = auth.uid() -- Case author
        OR c.allowed_roles @> ARRAY[auth.jwt()->>'role'] -- Allowed role
        OR c.allowed_specialties @> ARRAY[auth.jwt()->>'specialty'] -- Allowed specialty
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON case_comments
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON case_comments
  FOR DELETE
  USING (author_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_case_comments_updated_at
  BEFORE UPDATE ON case_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 