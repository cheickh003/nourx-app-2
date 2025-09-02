import pool from '../config/database.js';
import JwtService from '../services/jwtService.js';
import AuditService, { AUDIT_ACTIONS } from '../services/auditService.js';
import { AuthenticationError, AuthorizationError } from './errorHandler.js';

// Initialize services
const jwtService = new JwtService(pool);
const auditService = new AuditService(pool);

// Get user from database
const getUserById = async (userId, userType) => {
  let userQuery;
  
  if (userType === 'admin') {
    userQuery = `
      SELECT id, email, role, active, last_login_at, failed_login_attempts, locked_until
      FROM user_admin 
      WHERE id = $1 AND active = true
    `;
  } else {
    userQuery = `
      SELECT uc.id, uc.organization_id, uc.email, uc.role, uc.active, 
             uc.last_login_at, uc.failed_login_attempts, uc.locked_until,
             uc.deleted_at, o.name as organization_name
      FROM user_client uc
      JOIN organizations o ON uc.organization_id = o.id
      WHERE uc.id = $1 AND uc.active = true AND uc.deleted_at IS NULL
    `;
  }
  
  const result = await pool.query(userQuery, [userId]);
  return result.rows[0];
};

// Main authentication middleware
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        details: {
          reason: 'Missing authorization header',
          endpoint: req.originalUrl,
          method: req.method
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      throw new AuthenticationError('Access token is required');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token using JwtService
    const decoded = await jwtService.verifyAccessToken(token);
    
    if (!decoded) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        details: {
          reason: 'Invalid JWT token',
          endpoint: req.originalUrl,
          method: req.method
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      throw new AuthenticationError('Invalid token');
    }
    
    if (decoded.expired) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        details: {
          reason: 'Expired JWT token',
          endpoint: req.originalUrl,
          method: req.method
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      throw new AuthenticationError('Token has expired');
    }
    
    // Get user from database
    const user = await getUserById(decoded.userId, decoded.userType);
    
    if (!user) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        details: {
          reason: 'Token for non-existent or inactive user',
          endpoint: req.originalUrl,
          method: req.method,
          userId: decoded.userId,
          userType: decoded.userType
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      throw new AuthenticationError('User no longer exists or is inactive');
    }
    
    // Check if user account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        actorAdminId: decoded.userType === 'admin' ? user.id : null,
        actorClientId: decoded.userType === 'client' ? user.id : null,
        details: {
          reason: 'Access attempt by locked account',
          endpoint: req.originalUrl,
          method: req.method,
          lockExpires: user.locked_until
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      throw new AuthenticationError('Account is temporarily locked');
    }
    
    // Add user to request object
    req.user = {
      userId: user.id, // Use userId to match JWT payload
      id: user.id, // Keep for backward compatibility
      email: user.email,
      role: user.role,
      userType: decoded.userType,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      // Log unexpected authentication errors
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        details: {
          reason: 'Unexpected authentication error',
          error: error.message,
          endpoint: req.originalUrl,
          method: req.method
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      next(new AuthenticationError('Authentication failed'));
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await jwtService.verifyAccessToken(token);
    
    if (decoded && !decoded.expired) {
      const user = await getUserById(decoded.userId, decoded.userType);
      
      if (user && user.active && (!user.locked_until || new Date(user.locked_until) <= new Date())) {
        req.user = {
          userId: user.id,
          id: user.id,
          email: user.email,
          role: user.role,
          userType: decoded.userType,
          organizationId: user.organization_id,
          organizationName: user.organization_name,
          iat: decoded.iat,
          exp: decoded.exp
        };
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};