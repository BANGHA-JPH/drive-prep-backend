-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    device_id VARCHAR(32) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device_id ON refresh_tokens(device_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Create index for active tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens(user_id, revoked, expires_at) WHERE revoked = FALSE;

-- Add RLS (Row Level Security) policies
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own refresh tokens
CREATE POLICY "Users can view own refresh tokens" ON refresh_tokens
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own refresh tokens
CREATE POLICY "Users can insert own refresh tokens" ON refresh_tokens
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own refresh tokens
CREATE POLICY "Users can update own refresh tokens" ON refresh_tokens
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own refresh tokens
CREATE POLICY "Users can delete own refresh tokens" ON refresh_tokens
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW()
    WHERE expires_at < NOW() AND revoked = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run cleanup daily (optional)
-- This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-expired-refresh-tokens', '0 2 * * *', 'SELECT cleanup_expired_refresh_tokens();');
