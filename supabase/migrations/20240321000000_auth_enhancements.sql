-- Add MFA-related columns to auth.users
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];

-- Create session management table
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token)
);

-- Create SSO providers table
CREATE TABLE IF NOT EXISTS auth.sso_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user SSO connections table
CREATE TABLE IF NOT EXISTS auth.user_sso_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES auth.sso_providers(id) ON DELETE CASCADE,
    provider_user_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON auth.sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sso_connections_user_id ON auth.user_sso_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sso_connections_provider_id ON auth.user_sso_connections(provider_id);

-- Add RLS policies
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.user_sso_connections ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view own sessions"
    ON auth.sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON auth.sessions FOR DELETE
    USING (auth.uid() = user_id);

-- SSO providers policies (admin only)
CREATE POLICY "Only admins can manage SSO providers"
    ON auth.sso_providers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id AND role = 'admin'
        )
    );

-- User SSO connections policies
CREATE POLICY "Users can view own SSO connections"
    ON auth.user_sso_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own SSO connections"
    ON auth.user_sso_connections FOR ALL
    USING (auth.uid() = user_id); 