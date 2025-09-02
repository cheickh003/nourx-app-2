import pool from '../config/database.js';
import AuthService from '../services/authService.js';
import JwtService from '../services/jwtService.js';
import AuditService, { AUDIT_ACTIONS } from '../services/auditService.js';

// Initialize services
const authService = new AuthService(pool);
const jwtService = new JwtService(pool);
const auditService = new AuditService(pool);

/**
 * Helper function to get client IP address
 */
const getClientIp = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Helper function to get user agent
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user (admin or client)
 * @access Public
 */
export const login = async (req, res) => {
  try {
    const { email, password, userType, rememberMe = false } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Validate login credentials
    const loginResult = await authService.validateLogin({ email, password, userType });

    if (!loginResult.success) {
      // Log failed login attempt
      await auditService.logAuthEvent({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        userId: null,
        userType,
        email,
        success: false,
        reason: loginResult.error,
        ipAddress,
        userAgent
      });

      // Handle account lockout
      if (loginResult.error.includes('locked')) {
        await auditService.logAuthEvent({
          action: AUDIT_ACTIONS.LOGIN_LOCKED,
          userId: null,
          userType,
          email,
          success: false,
          reason: 'Account locked due to too many failed attempts',
          ipAddress,
          userAgent
        });

        return res.status(423).json({
          error: loginResult.error,
          lockoutExpiresAt: loginResult.lockoutExpiresAt
        });
      }

      return res.status(401).json({
        error: loginResult.error,
        ...(loginResult.validationErrors && { validationErrors: loginResult.validationErrors })
      });
    }

    const user = loginResult.user;

    // Generate JWT tokens
    const tokenResult = await jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      userType,
      organizationId: user.organizationId
    }, rememberMe);

    // Log successful login
    await auditService.logAuthEvent({
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      userId: user.id,
      userType,
      email: user.email,
      success: true,
      reason: 'Successful authentication',
      ipAddress,
      userAgent,
      sessionId: tokenResult.refreshToken.substring(0, 10) // First 10 chars as session identifier
    });

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', tokenResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 days or 7 days
    });

    res.status(200).json({
      success: true,
      user,
      accessToken: tokenResult.accessToken,
      expiresAt: tokenResult.accessTokenExpiresAt,
      tokenType: tokenResult.tokenType
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Log system error
    await auditService.logSecurityEvent({
      action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
      details: { error: error.message, endpoint: '/api/auth/login' },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(500).json({
      error: 'Authentication service temporarily unavailable'
    });
  }
};

/**
 * @route POST /api/auth/logout
 * @desc Logout user and revoke refresh token
 * @access Private
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    let userId = null;
    let userType = null;

    if (refreshToken) {
      // Verify and revoke refresh token
      const decoded = await jwtService.verifyRefreshToken(refreshToken);
      if (decoded && !decoded.expired) {
        userId = decoded.userId;
        userType = decoded.userType;
        await jwtService.revokeRefreshToken(decoded.jti);
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    // Log logout event
    if (userId) {
      await auditService.logAuthEvent({
        action: AUDIT_ACTIONS.LOGOUT,
        userId,
        userType,
        email: req.user?.email,
        success: true,
        reason: 'User logout',
        ipAddress,
        userAgent
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed'
    });
  }
};

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required'
      });
    }

    // Refresh the token
    const refreshResult = await jwtService.refreshAccessToken(refreshToken);

    if (!refreshResult.success) {
      // Log failed token refresh
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        details: { 
          error: refreshResult.error, 
          endpoint: '/api/auth/refresh',
          reason: 'Invalid refresh token used'
        },
        ipAddress,
        userAgent
      });

      // Clear invalid refresh token cookie
      res.clearCookie('refreshToken');
      
      return res.status(401).json({
        error: refreshResult.error
      });
    }

    const tokens = refreshResult.tokens;

    // If token was rotated, set new refresh token cookie
    if (refreshResult.rotated) {
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.refreshTokenExpiresAt.getTime() - Date.now()
      });
    }

    // Log successful token refresh
    const decoded = await jwtService.verifyAccessToken(tokens.accessToken);
    if (decoded) {
      await auditService.logAuthEvent({
        action: AUDIT_ACTIONS.TOKEN_REFRESHED,
        userId: decoded.userId,
        userType: decoded.userType,
        email: decoded.email,
        success: true,
        reason: refreshResult.rotated ? 'Token rotated' : 'Token refreshed',
        ipAddress,
        userAgent
      });
    }

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      expiresAt: tokens.accessTokenExpiresAt,
      tokenType: tokens.tokenType,
      rotated: refreshResult.rotated
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed'
    });
  }
};

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Generate password reset token
    const resetResult = await authService.generatePasswordResetToken(email, userType);

    if (resetResult.success && resetResult.token) {
      // Log password reset request
      await auditService.logAuthEvent({
        action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
        userId: resetResult.userId,
        userType,
        email: resetResult.userEmail,
        success: true,
        reason: 'Password reset requested',
        ipAddress,
        userAgent
      });

      // TODO: Send email with reset token
      // This would integrate with email service
      console.log(`Password reset token for ${email}: ${resetResult.token}`);
    }

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset service temporarily unavailable'
    });
  }
};

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password, userType } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Reset password
    const resetResult = await authService.resetPassword({ token, password, userType });

    if (!resetResult.success) {
      // Log failed password reset
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.PASSWORD_RESET_FAILED,
        details: { 
          error: resetResult.error,
          userType,
          reason: 'Invalid or expired reset token'
        },
        ipAddress,
        userAgent
      });

      return res.status(400).json({
        error: resetResult.error,
        ...(resetResult.validationErrors && { validationErrors: resetResult.validationErrors })
      });
    }

    // Log successful password reset
    await auditService.logAuthEvent({
      action: AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS,
      userId: resetResult.userId,
      userType,
      email: resetResult.userEmail,
      success: true,
      reason: 'Password successfully reset',
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed'
    });
  }
};

/**
 * @route POST /api/auth/activate
 * @desc Activate user account with token
 * @access Public
 */
export const activateAccount = async (req, res) => {
  try {
    const { token, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Activate account
    const activationResult = await authService.activateAccount({ token, password });

    if (!activationResult.success) {
      return res.status(400).json({
        error: activationResult.error,
        ...(activationResult.validationErrors && { validationErrors: activationResult.validationErrors })
      });
    }

    const user = activationResult.user;

    // Generate JWT tokens for the newly activated user
    const tokenResult = await jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      organizationId: user.organizationId
    });

    // Log successful account activation
    await auditService.logAuthEvent({
      action: AUDIT_ACTIONS.ACCOUNT_ACTIVATED,
      userId: user.id,
      userType: user.userType,
      email: user.email,
      success: true,
      reason: 'Account activated and password set',
      ipAddress,
      userAgent
    });

    // Set refresh token cookie
    res.cookie('refreshToken', tokenResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Account activated successfully',
      user,
      accessToken: tokenResult.accessToken,
      expiresAt: tokenResult.accessTokenExpiresAt,
      tokenType: tokenResult.tokenType
    });

  } catch (error) {
    console.error('Account activation error:', error);
    res.status(500).json({
      error: 'Account activation failed'
    });
  }
};

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    // The user info is already available from the auth middleware
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Get fresh user data from database
    const tableName = req.user.userType === 'admin' ? 'user_admin' : 'user_client';
    const user = await authService.getUserById(req.user.userId, tableName);

    if (!user || !user.active) {
      return res.status(401).json({
        error: 'User account inactive'
      });
    }

    // Return user data (excluding sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      userType: req.user.userType,
      active: user.active,
      lastLoginAt: user.last_login_at,
      ...(req.user.userType === 'client' && { 
        organizationId: user.organization_id,
        organizationName: user.organization_name 
      })
    };

    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user information'
    });
  }
};