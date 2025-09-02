import { AuthorizationError } from './errorHandler.js';
import { logSecurityEvent } from './logger.js';

// Role hierarchy for permissions
const ROLE_HIERARCHY = {
  admin: {
    admin: ['admin', 'manager', 'agent'],
    client: ['owner', 'manager', 'reader']
  },
  client: {
    owner: ['owner', 'manager', 'reader'],
    manager: ['manager', 'reader'],
    reader: ['reader']
  }
};

// Check if user has required role
const hasRole = (userRole, userType, requiredRoles) => {
  // If no specific roles required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  
  // Check direct role match
  if (requiredRoles.includes(userRole)) {
    return true;
  }
  
  // Check user type match (admin vs client)
  if (requiredRoles.includes(userType)) {
    return true;
  }
  
  // Check hierarchy-based permissions
  const hierarchy = ROLE_HIERARCHY[userType];
  if (hierarchy && hierarchy[userRole]) {
    return requiredRoles.some(role => hierarchy[userRole].includes(role));
  }
  
  return false;
};

// Check if user can access organization data
const canAccessOrganization = (user, organizationId) => {
  // Admin users can access any organization
  if (user.userType === 'admin') {
    return true;
  }
  
  // Client users can only access their own organization
  if (user.userType === 'client') {
    return user.organizationId === organizationId;
  }
  
  return false;
};

// Role-based authorization middleware
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        requestId: req.requestId,
        requiredRoles: allowedRoles
      });
      
      return next(new AuthorizationError('Authentication required'));
    }
    
    // Check role permissions
    if (!hasRole(req.user.role, req.user.userType, allowedRoles)) {
      logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        requestId: req.requestId,
        userId: req.user.id,
        userType: req.user.userType,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      
      return next(new AuthorizationError('Insufficient permissions'));
    }
    
    next();
  };
};

// Organization access control middleware
export const requireOrganizationAccess = (organizationIdParam = 'organization_id') => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }
    
    // Get organization ID from params, body, or query
    const organizationId = req.params[organizationIdParam] || 
                          req.params.orgId || 
                          req.body.organization_id || 
                          req.query.organization_id;
    
    if (!organizationId) {
      return next(new AuthorizationError('Organization ID required'));
    }
    
    // Check organization access
    if (!canAccessOrganization(req.user, organizationId)) {
      logSecurityEvent('UNAUTHORIZED_ORGANIZATION_ACCESS', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        requestId: req.requestId,
        userId: req.user.id,
        userType: req.user.userType,
        userOrganizationId: req.user.organizationId,
        requestedOrganizationId: organizationId
      });
      
      return next(new AuthorizationError('Access denied to this organization'));
    }
    
    next();
  };
};

// Owner/Manager only middleware (for client users)
export const requireOwnerOrManager = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }
  
  // Admin users have full access
  if (req.user.userType === 'admin') {
    return next();
  }
  
  // Client users must be owner or manager
  if (req.user.userType === 'client' && !['owner', 'manager'].includes(req.user.role)) {
    logSecurityEvent('INSUFFICIENT_CLIENT_PERMISSIONS', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      requestId: req.requestId,
      userId: req.user.id,
      userRole: req.user.role,
      organizationId: req.user.organizationId
    });
    
    return next(new AuthorizationError('Owner or Manager role required'));
  }
  
  next();
};

// Check if user can modify another user
export const canModifyUser = (currentUser, targetUserId, targetUserType, targetUserRole) => {
  // Admin users can modify any user
  if (currentUser.userType === 'admin') {
    return true;
  }
  
  // Client users can only modify users in their organization
  if (currentUser.userType === 'client') {
    // Can't modify admin users
    if (targetUserType === 'admin') {
      return false;
    }
    
    // Only owners can modify other users
    if (currentUser.role !== 'owner') {
      return false;
    }
    
    // Can't modify other owners (except themselves)
    if (targetUserRole === 'owner' && currentUser.id !== targetUserId) {
      return false;
    }
    
    return true;
  }
  
  return false;
};