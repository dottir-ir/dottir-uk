-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Add RLS policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access rate limits
CREATE POLICY "Service role only" ON rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role'); 