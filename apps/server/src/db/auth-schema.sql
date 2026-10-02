CREATE TABLE IF NOT EXISTS login_attempts (
  clientIp TEXT PRIMARY KEY,
  windowStart INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_windowStart ON login_attempts(windowStart);
CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt);
