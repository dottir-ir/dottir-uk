CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id uuid,
  name text,
  email text,
  avatar text,
  role text,
  specialty text,
  bio text,
  location text,
  specialization text,
  joined_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  is_verified boolean DEFAULT false,
  verification_document_url text
); 