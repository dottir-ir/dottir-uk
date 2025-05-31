-- Enhance profiles table with additional fields from architecture doc
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL CHECK (role IN ('student', 'doctor', 'educator', 'moderator', 'admin')),
ADD COLUMN IF NOT EXISTS credentials text,
ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_documents jsonb,
ADD COLUMN IF NOT EXISTS years_experience integer,
ADD COLUMN IF NOT EXISTS institution text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS social_links jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"profile_visibility": "all_users", "case_visibility": "all_users"}',
ADD COLUMN IF NOT EXISTS notification_settings jsonb;

-- Create medical_cases table (replacing posts table)
CREATE TABLE IF NOT EXISTS medical_cases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id uuid REFERENCES profiles(id) NOT NULL,
    title text NOT NULL,
    specialty text NOT NULL,
    description text NOT NULL,
    patient_demographics jsonb NOT NULL,
    clinical_history text,
    examination_findings text,
    investigations jsonb,
    diagnosis text,
    treatment text,
    outcome text,
    learning_points text,
    references jsonb,
    tags text[],
    privacy_level integer NOT NULL DEFAULT 1 CHECK (privacy_level BETWEEN 1 AND 3),
    allowed_roles text[] DEFAULT ARRAY['student', 'doctor', 'educator', 'moderator', 'admin'],
    allowed_specialties text[],
    is_educational boolean DEFAULT false,
    status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'under_review', 'archived')),
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create case_images table
CREATE TABLE IF NOT EXISTS case_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id uuid REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
    storage_path text NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    width integer,
    height integer,
    description text,
    annotations jsonb,
    is_primary boolean DEFAULT false,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create comments table (replacing post_comments)
CREATE TABLE IF NOT EXISTS comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id uuid REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
    author_id uuid REFERENCES profiles(id) NOT NULL,
    parent_id uuid REFERENCES comments(id),
    comment_type text NOT NULL DEFAULT 'standard' CHECK (comment_type IN ('standard', 'question', 'differential', 'treatment', 'educational')),
    content text NOT NULL,
    image_path text,
    is_pinned boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create likes table (replacing post_likes)
CREATE TABLE IF NOT EXISTS likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    case_id uuid REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
    like_type text NOT NULL DEFAULT 'standard' CHECK (like_type IN ('standard', 'educational', 'clinical')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, case_id)
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid REFERENCES profiles(id) NOT NULL,
    title text NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    is_collaborative boolean DEFAULT false,
    is_educational boolean DEFAULT false,
    specialty text,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create saved_cases table (replacing bookmarks)
CREATE TABLE IF NOT EXISTS saved_cases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    case_id uuid REFERENCES medical_cases(id) ON DELETE CASCADE NOT NULL,
    collection_id uuid REFERENCES collections(id),
    save_type text NOT NULL DEFAULT 'quick_save' CHECK (save_type IN ('quick_save', 'educational', 'research', 'reference')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, case_id, collection_id)
);

-- Create collection_collaborators table
CREATE TABLE IF NOT EXISTS collection_collaborators (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id uuid REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(collection_id, user_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    followed_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_id, followed_id)
);

-- Create specialty_follows table
CREATE TABLE IF NOT EXISTS specialty_follows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    specialty text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, specialty)
);

-- Enable RLS on all tables
ALTER TABLE medical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialty_follows ENABLE ROW LEVEL SECURITY;

-- Medical cases RLS policies
CREATE POLICY "Case visibility based on privacy level and user role"
    ON medical_cases FOR SELECT
    USING (
        -- Case author can always see their cases
        (SELECT auth_id FROM profiles WHERE id = author_id) = auth.uid() OR
        -- Level 1 cases visible to all authenticated users
        (privacy_level = 1) OR
        -- Level 2 cases visible to doctors and educators
        (privacy_level = 2 AND EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_id = auth.uid() AND role IN ('doctor', 'educator', 'moderator', 'admin')
        )) OR
        -- Level 3 cases visible to specific specialties
        (privacy_level = 3 AND EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_id = auth.uid() AND 
            (role IN ('moderator', 'admin') OR specialty = ANY(allowed_specialties))
        ))
    );

CREATE POLICY "Authors can create cases"
    ON medical_cases FOR INSERT
    WITH CHECK (auth.uid() = (SELECT auth_id FROM profiles WHERE id = author_id));

CREATE POLICY "Authors can update own cases"
    ON medical_cases FOR UPDATE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = author_id));

CREATE POLICY "Authors can delete own cases"
    ON medical_cases FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = author_id));

-- Case images RLS policies
CREATE POLICY "Case images are viewable with case access"
    ON case_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medical_cases c
            WHERE c.id = case_id AND
            (
                (SELECT auth_id FROM profiles WHERE id = c.author_id) = auth.uid() OR
                c.privacy_level = 1 OR
                (c.privacy_level = 2 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND role IN ('doctor', 'educator', 'moderator', 'admin')
                )) OR
                (c.privacy_level = 3 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND 
                    (role IN ('moderator', 'admin') OR specialty = ANY(c.allowed_specialties))
                ))
            )
        )
    );

CREATE POLICY "Case authors can manage images"
    ON case_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM medical_cases c
            WHERE c.id = case_id AND
            (SELECT auth_id FROM profiles WHERE id = c.author_id) = auth.uid()
        )
    );

-- Comments RLS policies
CREATE POLICY "Comments are viewable with case access"
    ON comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medical_cases c
            WHERE c.id = case_id AND
            (
                (SELECT auth_id FROM profiles WHERE id = c.author_id) = auth.uid() OR
                c.privacy_level = 1 OR
                (c.privacy_level = 2 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND role IN ('doctor', 'educator', 'moderator', 'admin')
                )) OR
                (c.privacy_level = 3 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND 
                    (role IN ('moderator', 'admin') OR specialty = ANY(c.allowed_specialties))
                ))
            )
        )
    );

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    WITH CHECK (
        auth.uid() = (SELECT auth_id FROM profiles WHERE id = author_id) AND
        EXISTS (
            SELECT 1 FROM medical_cases c
            WHERE c.id = case_id AND
            (
                (SELECT auth_id FROM profiles WHERE id = c.author_id) = auth.uid() OR
                c.privacy_level = 1 OR
                (c.privacy_level = 2 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND role IN ('doctor', 'educator', 'moderator', 'admin')
                )) OR
                (c.privacy_level = 3 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND 
                    (role IN ('moderator', 'admin') OR specialty = ANY(c.allowed_specialties))
                ))
            )
        )
    );

CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = author_id));

CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = author_id));

-- Likes RLS policies
CREATE POLICY "Likes are viewable with case access"
    ON likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medical_cases c
            WHERE c.id = case_id AND
            (
                (SELECT auth_id FROM profiles WHERE id = c.author_id) = auth.uid() OR
                c.privacy_level = 1 OR
                (c.privacy_level = 2 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND role IN ('doctor', 'educator', 'moderator', 'admin')
                )) OR
                (c.privacy_level = 3 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND 
                    (role IN ('moderator', 'admin') OR specialty = ANY(c.allowed_specialties))
                ))
            )
        )
    );

CREATE POLICY "Users can like cases"
    ON likes FOR INSERT
    WITH CHECK (
        auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id) AND
        EXISTS (
            SELECT 1 FROM medical_cases c
            WHERE c.id = case_id AND
            (
                (SELECT auth_id FROM profiles WHERE id = c.author_id) = auth.uid() OR
                c.privacy_level = 1 OR
                (c.privacy_level = 2 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND role IN ('doctor', 'educator', 'moderator', 'admin')
                )) OR
                (c.privacy_level = 3 AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE auth_id = auth.uid() AND 
                    (role IN ('moderator', 'admin') OR specialty = ANY(c.allowed_specialties))
                ))
            )
        )
    );

CREATE POLICY "Users can unlike cases"
    ON likes FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

-- Collections RLS policies
CREATE POLICY "Public collections are viewable by everyone"
    ON collections FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view own collections"
    ON collections FOR SELECT
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = owner_id));

CREATE POLICY "Users can create collections"
    ON collections FOR INSERT
    WITH CHECK (auth.uid() = (SELECT auth_id FROM profiles WHERE id = owner_id));

CREATE POLICY "Users can update own collections"
    ON collections FOR UPDATE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = owner_id));

CREATE POLICY "Users can delete own collections"
    ON collections FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = owner_id));

-- Saved cases RLS policies
CREATE POLICY "Users can view own saved cases"
    ON saved_cases FOR SELECT
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can save cases"
    ON saved_cases FOR INSERT
    WITH CHECK (
        auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id) AND
        (collection_id IS NULL OR EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id AND
            (c.owner_id = user_id OR EXISTS (
                SELECT 1 FROM collection_collaborators cc
                WHERE cc.collection_id = c.id AND cc.user_id = user_id
            ))
        ))
    );

CREATE POLICY "Users can update own saved cases"
    ON saved_cases FOR UPDATE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can delete own saved cases"
    ON saved_cases FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

-- Collection collaborators RLS policies
CREATE POLICY "Collection owners can manage collaborators"
    ON collection_collaborators FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id AND
            (SELECT auth_id FROM profiles WHERE id = c.owner_id) = auth.uid()
        )
    );

CREATE POLICY "Collaborators can view collection collaborators"
    ON collection_collaborators FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id AND
            (
                (SELECT auth_id FROM profiles WHERE id = c.owner_id) = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM collection_collaborators cc
                    WHERE cc.collection_id = c.id AND
                    (SELECT auth_id FROM profiles WHERE id = cc.user_id) = auth.uid()
                )
            )
        )
    );

-- Follows RLS policies
CREATE POLICY "Follows are viewable by everyone"
    ON follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON follows FOR INSERT
    WITH CHECK (
        auth.uid() = (SELECT auth_id FROM profiles WHERE id = follower_id) AND
        follower_id != followed_id
    );

CREATE POLICY "Users can unfollow others"
    ON follows FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = follower_id));

-- Specialty follows RLS policies
CREATE POLICY "Specialty follows are viewable by everyone"
    ON specialty_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow specialties"
    ON specialty_follows FOR INSERT
    WITH CHECK (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can unfollow specialties"
    ON specialty_follows FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_cases_author_id ON medical_cases(author_id);
CREATE INDEX IF NOT EXISTS idx_medical_cases_specialty ON medical_cases(specialty);
CREATE INDEX IF NOT EXISTS idx_medical_cases_privacy_level ON medical_cases(privacy_level);
CREATE INDEX IF NOT EXISTS idx_medical_cases_status ON medical_cases(status);
CREATE INDEX IF NOT EXISTS idx_medical_cases_created_at ON medical_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_case_images_case_id ON case_images(case_id);
CREATE INDEX IF NOT EXISTS idx_comments_case_id ON comments(case_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_case_id ON likes(case_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_saved_cases_user_id ON saved_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cases_case_id ON saved_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_collection_collaborators_collection_id ON collection_collaborators(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_collaborators_user_id ON collection_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_specialty_follows_user_id ON specialty_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_specialty_follows_specialty ON specialty_follows(specialty); 