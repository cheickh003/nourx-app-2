-- Add refresh tokens table for JWT token management
-- Migration: 002_add_refresh_tokens.sql

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID UNIQUE NOT NULL, -- The jti claim from JWT
    user_id UUID NOT NULL,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('admin', 'client')),
    token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the actual token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    remember_me BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_refresh_tokens_token_id ON refresh_tokens(token_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, user_type);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at) WHERE revoked_at IS NULL;

-- Add foreign key constraints with proper cascade behavior
-- Note: We use conditional constraints since user could be in either table
CREATE OR REPLACE FUNCTION validate_refresh_token_user() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_type = 'admin' THEN
        IF NOT EXISTS (SELECT 1 FROM user_admin WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'Invalid admin user_id';
        END IF;
    ELSIF NEW.user_type = 'client' THEN
        IF NOT EXISTS (SELECT 1 FROM user_client WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'Invalid client user_id';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_refresh_token_user_trigger
    BEFORE INSERT OR UPDATE ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION validate_refresh_token_user();

-- Add updated_at trigger
CREATE TRIGGER update_refresh_tokens_updated_at 
    BEFORE UPDATE ON refresh_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();