-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  images text[],
  image_descriptions text[],
  specialty text,
  age text,
  gender text,
  symptoms text,
  history text,
  diagnosis text,
  treatment text,
  outcome text,
  is_anonymous boolean DEFAULT false,
  status text NOT NULL DEFAULT 'published',
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now()
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_tags table
CREATE TABLE IF NOT EXISTS post_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  tag text NOT NULL
); 