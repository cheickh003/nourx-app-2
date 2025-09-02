-- Add risk_level column to audit_logs table
-- Migration: 003_add_risk_level_to_audit_logs.sql

ALTER TABLE audit_logs 
ADD COLUMN risk_level VARCHAR(20) NOT NULL DEFAULT 'medium' 
CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

-- Create index for risk level filtering
CREATE INDEX idx_audit_logs_risk_level ON audit_logs(risk_level);

-- Create combined index for high-priority monitoring
CREATE INDEX idx_audit_logs_high_risk ON audit_logs(risk_level, created_at) 
WHERE risk_level IN ('high', 'critical');