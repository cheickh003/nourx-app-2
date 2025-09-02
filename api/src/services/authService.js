import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pkg from 'pg';
const { Pool } = pkg;
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userType: z.enum(['admin', 'client'], { required_error: 'User type is required' })
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  userType: z.enum(['admin', 'client'])
});

const activateAccountSchema = z.object({
  token: z.string().min(1, 'Activation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
});

// Constants
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 12; // Higher rounds for better security

class AuthService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Validate user credentials and handle account lockout
   * @param {Object} loginData - {email, password, userType}
   * @returns {Object} User data if valid, null if invalid
   */
  async validateLogin(loginData) {
    try {
      // Validate input data
      const validatedData = loginSchema.parse(loginData);
      const { email, password, userType } = validatedData;

      // Get user from appropriate table
      const tableName = userType === 'admin' ? 'user_admin' : 'user_client';
      const user = await this.getUserByEmail(email, tableName);

      if (!user) {
        // Always return same response time to prevent email enumeration
        await this.simulatePasswordCheck();
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const lockoutExpiresAt = new Date(user.locked_until);
        return { 
          success: false, 
          error: 'Account temporarily locked due to too many failed attempts',
          lockoutExpiresAt 
        };
      }

      // Check if account is active
      if (!user.active) {
        return { 
          success: false, 
          error: userType === 'client' ? 'Account not activated' : 'Account disabled'
        };
      }

      // For client users, check if password is set (account activated)
      if (userType === 'client' && !user.password_hash) {
        return { 
          success: false, 
          error: 'Account not activated. Please check your email for activation instructions.'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        await this.handleFailedLoginAttempt(user.id, tableName);
        return { success: false, error: 'Invalid credentials' };
      }

      // Reset failed attempts and update last login
      await this.handleSuccessfulLogin(user.id, tableName);

      // Return user data (excluding sensitive information)
      const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        userType,
        active: user.active,
        ...(userType === 'client' && { organizationId: user.organization_id })
      };

      return { success: true, user: userData };

    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          error: 'Invalid input data',
          validationErrors: error.errors 
        };
      }
      
      console.error('Login validation error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Generate secure password reset token
   * @param {string} email - User email
   * @param {string} userType - admin or client
   * @returns {Object} Success status and token info
   */
  async generatePasswordResetToken(email, userType) {
    try {
      const tableName = userType === 'admin' ? 'user_admin' : 'user_client';
      const user = await this.getUserByEmail(email, tableName);

      if (!user) {
        // Still return success to prevent email enumeration
        return { success: true };
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      const query = userType === 'admin' 
        ? `UPDATE user_admin SET password_reset_token = $1, password_reset_expires_at = $2 WHERE id = $3`
        : `UPDATE user_client SET password_reset_token = $1, password_reset_expires_at = $2 WHERE id = $3`;

      await this.pool.query(query, [token, expiresAt, user.id]);

      return { 
        success: true, 
        token, 
        expiresAt,
        userEmail: user.email,
        userId: user.id 
      };

    } catch (error) {
      console.error('Password reset token generation error:', error);
      return { success: false, error: 'Failed to generate reset token' };
    }
  }

  /**
   * Reset user password with token
   * @param {Object} resetData - {token, password, userType}
   * @returns {Object} Success status
   */
  async resetPassword(resetData) {
    try {
      const validatedData = resetPasswordSchema.parse(resetData);
      const { token, password, userType } = validatedData;

      const tableName = userType === 'admin' ? 'user_admin' : 'user_client';
      
      // Find user with valid token
      const query = userType === 'admin'
        ? `SELECT * FROM user_admin WHERE password_reset_token = $1 AND password_reset_expires_at > NOW() AND active = true`
        : `SELECT * FROM user_client WHERE password_reset_token = $1 AND password_reset_expires_at > NOW() AND active = true`;

      const result = await this.pool.query(query, [token]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Invalid or expired reset token' };
      }

      const user = result.rows[0];

      // Hash new password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Update password and clear reset token
      const updateQuery = userType === 'admin'
        ? `UPDATE user_admin SET password_hash = $1, password_reset_token = NULL, 
           password_reset_expires_at = NULL, failed_login_attempts = 0, 
           locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
        : `UPDATE user_client SET password_hash = $1, password_reset_token = NULL, 
           password_reset_expires_at = NULL, failed_login_attempts = 0, 
           locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2`;

      await this.pool.query(updateQuery, [passwordHash, user.id]);

      return { 
        success: true, 
        userId: user.id,
        userEmail: user.email 
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          error: 'Invalid reset data',
          validationErrors: error.errors 
        };
      }
      
      console.error('Password reset error:', error);
      return { success: false, error: 'Password reset failed' };
    }
  }

  /**
   * Activate client account with token
   * @param {Object} activationData - {token, password}
   * @returns {Object} Success status and user data
   */
  async activateAccount(activationData) {
    try {
      const validatedData = activateAccountSchema.parse(activationData);
      const { token, password } = validatedData;

      // Find client with valid invitation token
      const query = `
        SELECT uc.*, o.name as organization_name 
        FROM user_client uc 
        JOIN organizations o ON uc.organization_id = o.id 
        WHERE uc.invitation_token = $1 AND uc.invitation_expires_at > NOW() 
        AND uc.active = true AND uc.password_hash IS NULL
      `;

      const result = await this.pool.query(query, [token]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Invalid or expired activation token' };
      }

      const user = result.rows[0];

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Activate account
      const updateQuery = `
        UPDATE user_client SET 
          password_hash = $1, 
          invitation_token = NULL, 
          invitation_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `;

      await this.pool.query(updateQuery, [passwordHash, user.id]);

      const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        userType: 'client',
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        active: user.active
      };

      return { 
        success: true, 
        user: userData 
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          error: 'Invalid activation data',
          validationErrors: error.errors 
        };
      }
      
      console.error('Account activation error:', error);
      return { success: false, error: 'Account activation failed' };
    }
  }

  /**
   * Get user by email from specified table
   * @param {string} email - User email
   * @param {string} tableName - user_admin or user_client
   * @returns {Object|null} User data or null
   */
  async getUserByEmail(email, tableName) {
    try {
      const query = `SELECT * FROM ${tableName} WHERE email = $1`;
      const result = await this.pool.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }

  /**
   * Get user by ID from specified table
   * @param {string} userId - User ID
   * @param {string} tableName - user_admin or user_client
   * @returns {Object|null} User data or null
   */
  async getUserById(userId, tableName) {
    try {
      const baseQuery = `SELECT * FROM ${tableName} WHERE id = $1 AND active = true`;
      
      let query = baseQuery;
      if (tableName === 'user_client') {
        query = `
          SELECT uc.*, o.name as organization_name 
          FROM user_client uc 
          JOIN organizations o ON uc.organization_id = o.id 
          WHERE uc.id = $1 AND uc.active = true
        `;
      }

      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  /**
   * Handle failed login attempt
   * @param {string} userId - User ID
   * @param {string} tableName - user_admin or user_client
   */
  async handleFailedLoginAttempt(userId, tableName) {
    try {
      const query = `
        UPDATE ${tableName} SET 
          failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= $1 THEN $2::timestamp
            ELSE NULL 
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;

      const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await this.pool.query(query, [MAX_FAILED_ATTEMPTS, lockUntil, userId]);
    } catch (error) {
      console.error('Handle failed login attempt error:', error);
    }
  }

  /**
   * Handle successful login
   * @param {string} userId - User ID
   * @param {string} tableName - user_admin or user_client
   */
  async handleSuccessfulLogin(userId, tableName) {
    try {
      const query = `
        UPDATE ${tableName} SET 
          failed_login_attempts = 0,
          locked_until = NULL,
          last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await this.pool.query(query, [userId]);
    } catch (error) {
      console.error('Handle successful login error:', error);
    }
  }

  /**
   * Simulate password checking to prevent timing attacks
   */
  async simulatePasswordCheck() {
    // Create a fake hash to simulate bcrypt comparison time
    const fakeHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.with.constant.time';
    await bcrypt.compare('dummy-password', fakeHash);
  }

  /**
   * Hash password with secure parameters
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Hex token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default AuthService;