-- Create collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create collection_cases table
CREATE TABLE collection_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES medical_cases(id) ON DELETE CASCADE,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, case_id)
);

-- Create indexes
CREATE INDEX collections_owner_id_idx ON collections(owner_id);
CREATE INDEX collections_is_public_idx ON collections(is_public);
CREATE INDEX collections_tags_idx ON collections USING GIN(tags);
CREATE INDEX collections_created_at_idx ON collections(created_at);

CREATE INDEX collection_cases_collection_id_idx ON collection_cases(collection_id);
CREATE INDEX collection_cases_case_id_idx ON collection_cases(case_id);
CREATE INDEX collection_cases_order_index_idx ON collection_cases(order_index);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Users can view public collections"
  ON collections
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own collections"
  ON collections
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create collections"
  ON collections
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own collections"
  ON collections
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own collections"
  ON collections
  FOR DELETE
  USING (owner_id = auth.uid());

-- Create policies for collection_cases
CREATE POLICY "Users can view cases in collections they have access to"
  ON collection_cases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_cases.collection_id
      AND (
        c.is_public = true
        OR c.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add cases to their own collections"
  ON collection_cases
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_cases.collection_id
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cases in their own collections"
  ON collection_cases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_cases.collection_id
      AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_cases.collection_id
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove cases from their own collections"
  ON collection_cases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_cases.collection_id
      AND c.owner_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_cases_updated_at
  BEFORE UPDATE ON collection_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 