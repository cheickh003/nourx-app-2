import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pkg from 'pg';
const { Pool } = pkg;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
const REMEMBER_ME_EXPIRY = '30d';   // 30 days for remember me

class JwtService {
  constructor(pool) {
    this.pool = pool;
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets must be configured in environment variables');
    }
  }

  /**
   * Generate access and refresh token pair
   * @param {Object} payload - User data for token payload
   * @param {boolean} rememberMe - Whether to use extended expiry
   * @returns {Object} Token pair and expiration info
   */
  async generateTokenPair(payload, rememberMe = false) {
    try {
      // Create access token payload
      const accessPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        userType: payload.userType,
        organizationId: payload.organizationId || null,
        type: 'access'
      };

      // Create refresh token payload
      const refreshPayload = {
        userId: payload.userId,
        userType: payload.userType,
        type: 'refresh',
        jti: crypto.randomUUID() // Unique token ID for revocation
      };

      // Generate tokens
      const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'nourx-api',
        audience: 'nourx-app'
      });

      const refreshTokenExpiry = rememberMe ? REMEMBER_ME_EXPIRY : REFRESH_TOKEN_EXPIRY;
      const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
        expiresIn: refreshTokenExpiry,
        issuer: 'nourx-api',
        audience: 'nourx-app'
      });

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + this.parseExpiry(refreshTokenExpiry));

      await this.storeRefreshToken({
        tokenId: refreshPayload.jti,
        userId: payload.userId,
        userType: payload.userType,
        token: refreshToken,
        expiresAt,
        rememberMe
      });

      return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: new Date(Date.now() + this.parseExpiry(ACCESS_TOKEN_EXPIRY)),
        refreshTokenExpiresAt: expiresAt,
        tokenType: 'Bearer'
      };

    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate tokens');
    }
  }

  /**
   * Verify and decode access token
   * @param {string} token - Access token
   * @returns {Object} Decoded payload or null
   */
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'nourx-api',
        audience: 'nourx-app'
      });

      if (decoded.type !== 'access') {
        return null;
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { expired: true };
      }
      return null;
    }
  }

  /**
   * Verify and decode refresh token
   * @param {string} token - Refresh token
   * @returns {Object} Decoded payload or null
   */
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'nourx-api',
        audience: 'nourx-app'
      });

      if (decoded.type !== 'refresh') {
        return null;
      }

      // Check if token exists and is valid in database
      const isValid = await this.isRefreshTokenValid(decoded.jti, decoded.userId);
      if (!isValid) {
        return null;
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { expired: true };
      }
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Current refresh token
   * @returns {Object} New token pair or error
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);
      
      if (!decoded) {
        return { success: false, error: 'Invalid refresh token' };
      }

      if (decoded.expired) {
        return { success: false, error: 'Refresh token expired' };
      }

      // Get user data
      const tableName = decoded.userType === 'admin' ? 'user_admin' : 'user_client';
      const user = await this.getUserById(decoded.userId, tableName);

      if (!user || !user.active) {
        // Revoke the refresh token if user is inactive
        await this.revokeRefreshToken(decoded.jti);
        return { success: false, error: 'User account inactive' };
      }

      // Check if we need to rotate the refresh token (do it periodically for security)
      const tokenInfo = await this.getRefreshTokenInfo(decoded.jti);
      const shouldRotate = this.shouldRotateToken(tokenInfo);

      let newTokenPair;
      
      if (shouldRotate) {
        // Generate completely new token pair
        const payload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          userType: decoded.userType,
          organizationId: user.organization_id
        };
        
        newTokenPair = await this.generateTokenPair(payload, tokenInfo.remember_me);
        
        // Revoke old refresh token
        await this.revokeRefreshToken(decoded.jti);
      } else {
        // Just generate new access token
        const accessPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          userType: decoded.userType,
          organizationId: user.organization_id || null,
          type: 'access'
        };

        const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
          expiresIn: ACCESS_TOKEN_EXPIRY,
          issuer: 'nourx-api',
          audience: 'nourx-app'
        });

        newTokenPair = {
          accessToken,
          refreshToken, // Keep the same refresh token
          accessTokenExpiresAt: new Date(Date.now() + this.parseExpiry(ACCESS_TOKEN_EXPIRY)),
          refreshTokenExpiresAt: new Date(tokenInfo.expires_at),
          tokenType: 'Bearer'
        };

        // Update last used timestamp
        await this.updateRefreshTokenUsage(decoded.jti);
      }

      return { 
        success: true, 
        tokens: newTokenPair,
        rotated: shouldRotate 
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }

  /**
   * Revoke refresh token
   * @param {string} tokenId - Token ID (jti)
   * @returns {boolean} Success status
   */
  async revokeRefreshToken(tokenId) {
    try {
      const query = 'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_id = $1 AND revoked_at IS NULL';
      await this.pool.query(query, [tokenId]);
      return true;
    } catch (error) {
      console.error('Token revocation error:', error);
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {string} userId - User ID
   * @param {string} userType - admin or client
   * @returns {boolean} Success status
   */
  async revokeAllUserTokens(userId, userType) {
    try {
      const query = `
        UPDATE refresh_tokens 
        SET revoked_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND user_type = $2 AND revoked_at IS NULL
      `;
      await this.pool.query(query, [userId, userType]);
      return true;
    } catch (error) {
      console.error('All tokens revocation error:', error);
      return false;
    }
  }

  /**
   * Store refresh token in database
   * @param {Object} tokenData - Token information
   */
  async storeRefreshToken(tokenData) {
    const query = `
      INSERT INTO refresh_tokens (token_id, user_id, user_type, token_hash, expires_at, remember_me, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `;
    
    // Hash the token for storage (don't store plain tokens)
    const tokenHash = crypto.createHash('sha256').update(tokenData.token).digest('hex');
    
    await this.pool.query(query, [
      tokenData.tokenId,
      tokenData.userId,
      tokenData.userType,
      tokenHash,
      tokenData.expiresAt,
      tokenData.rememberMe
    ]);
  }

  /**
   * Check if refresh token is valid
   * @param {string} tokenId - Token ID
   * @param {string} userId - User ID
   * @returns {boolean} Validity status
   */
  async isRefreshTokenValid(tokenId, userId) {
    try {
      const query = `
        SELECT 1 FROM refresh_tokens 
        WHERE token_id = $1 AND user_id = $2 AND expires_at > CURRENT_TIMESTAMP 
        AND revoked_at IS NULL
      `;
      const result = await this.pool.query(query, [tokenId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get refresh token information
   * @param {string} tokenId - Token ID
   * @returns {Object|null} Token info
   */
  async getRefreshTokenInfo(tokenId) {
    try {
      const query = `
        SELECT * FROM refresh_tokens 
        WHERE token_id = $1 AND revoked_at IS NULL
      `;
      const result = await this.pool.query(query, [tokenId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Get token info error:', error);
      return null;
    }
  }

  /**
   * Update refresh token last used timestamp
   * @param {string} tokenId - Token ID
   */
  async updateRefreshTokenUsage(tokenId) {
    try {
      const query = `
        UPDATE refresh_tokens 
        SET last_used_at = CURRENT_TIMESTAMP 
        WHERE token_id = $1
      `;
      await this.pool.query(query, [tokenId]);
    } catch (error) {
      console.error('Update token usage error:', error);
    }
  }

  /**
   * Determine if token should be rotated based on security policy
   * @param {Object} tokenInfo - Token information
   * @returns {boolean} Should rotate
   */
  shouldRotateToken(tokenInfo) {
    if (!tokenInfo) return true;
    
    const now = new Date();
    const created = new Date(tokenInfo.created_at);
    const lastUsed = tokenInfo.last_used_at ? new Date(tokenInfo.last_used_at) : created;
    
    // Rotate if token is older than 24 hours and has been used
    const isOld = (now - created) > (24 * 60 * 60 * 1000);
    
    // Rotate if not used in last 7 days
    const isStale = (now - lastUsed) > (7 * 24 * 60 * 60 * 1000);
    
    return isOld || isStale;
  }

  /**
   * Get user by ID for token operations
   * @param {string} userId - User ID
   * @param {string} tableName - Table name
   * @returns {Object|null} User data
   */
  async getUserById(userId, tableName) {
    try {
      const query = `SELECT * FROM ${tableName} WHERE id = $1`;
      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Parse expiry string to milliseconds
   * @param {string} expiry - Expiry string (e.g., '15m', '7d')
   * @returns {number} Milliseconds
   */
  parseExpiry(expiry) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiry format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    
    return value * units[unit];
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  async cleanupExpiredTokens() {
    try {
      const query = `
        DELETE FROM refresh_tokens 
        WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
      `;
      const result = await this.pool.query(query);
      console.log(`Cleaned up ${result.rowCount} expired tokens`);
      return result.rowCount;
    } catch (error) {
      console.error('Token cleanup error:', error);
      return 0;
    }
  }
}

export default JwtService;