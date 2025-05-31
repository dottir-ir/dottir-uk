-- Update profiles table with additional fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS specialization text,
ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_document_url text;

-- Create specialties table
CREATE TABLE IF NOT EXISTS specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create user_specialties junction table
CREATE TABLE IF NOT EXISTS user_specialties (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    specialty_id uuid REFERENCES specialties(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, specialty_id)
);

-- Update posts table with additional fields
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS age text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS symptoms text,
ADD COLUMN IF NOT EXISTS history text,
ADD COLUMN IF NOT EXISTS diagnosis text,
ADD COLUMN IF NOT EXISTS treatment text,
ADD COLUMN IF NOT EXISTS outcome text,
ADD COLUMN IF NOT EXISTS image_descriptions text[],
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (post_id, tag)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    content text NOT NULL,
    reference_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

-- Add RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Published posts are viewable by everyone"
    ON posts FOR SELECT
    USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
    ON post_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can create comments"
    ON post_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON post_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON post_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
    ON post_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like posts"
    ON post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks"
    ON bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark posts"
    ON bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
    ON bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id); 