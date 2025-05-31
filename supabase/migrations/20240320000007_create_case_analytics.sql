-- Create case views table
CREATE TABLE case_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES medical_cases(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_case_views_case_id ON case_views(case_id);
CREATE INDEX idx_case_views_viewer_id ON case_views(viewer_id);
CREATE INDEX idx_case_views_created_at ON case_views(created_at);

-- Enable RLS
ALTER TABLE case_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own case views"
    ON case_views FOR SELECT
    USING (
        auth.uid() IN (
            SELECT author_id FROM medical_cases WHERE id = case_id
        )
        OR auth.uid() = viewer_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid()
            AND (role = 'admin' OR role = 'moderator')
        )
    );

CREATE POLICY "System can create case views"
    ON case_views FOR INSERT
    WITH CHECK (true);

-- Create case analytics table
CREATE TABLE case_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES medical_cases(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    collection_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(case_id, date)
);

-- Create indexes
CREATE INDEX idx_case_analytics_case_id ON case_analytics(case_id);
CREATE INDEX idx_case_analytics_date ON case_analytics(date);

-- Enable RLS
ALTER TABLE case_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own case analytics"
    ON case_analytics FOR SELECT
    USING (
        auth.uid() IN (
            SELECT author_id FROM medical_cases WHERE id = case_id
        )
        OR EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid()
            AND (role = 'admin' OR role = 'moderator')
        )
    );

CREATE POLICY "System can update case analytics"
    ON case_analytics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update case analytics"
    ON case_analytics FOR UPDATE
    USING (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_case_analytics_updated_at
    BEFORE UPDATE ON case_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 