-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  documents JSONB NOT NULL,
  license_number TEXT,
  institution TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- Add RLS policies
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "Users can view own verification requests" ON verification_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own verification requests
CREATE POLICY "Users can create own verification requests" ON verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update verification requests
CREATE POLICY "Admins can update verification requests" ON verification_requests
  FOR UPDATE
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin'); 