import pkg from 'pg';
const { Pool } = pkg;

// Audit action types
export const AUDIT_ACTIONS = {
  // Authentication actions
  LOGIN_SUCCESS: 'auth:login_success',
  LOGIN_FAILED: 'auth:login_failed',
  LOGIN_LOCKED: 'auth:login_locked',
  LOGOUT: 'auth:logout',
  PASSWORD_RESET_REQUESTED: 'auth:password_reset_requested',
  PASSWORD_RESET_SUCCESS: 'auth:password_reset_success',
  PASSWORD_RESET_FAILED: 'auth:password_reset_failed',
  ACCOUNT_ACTIVATED: 'auth:account_activated',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  TOKEN_REVOKED: 'auth:token_revoked',
  
  // User management actions
  USER_CREATED: 'user:created',
  USER_UPDATED: 'user:updated',
  USER_DELETED: 'user:deleted',
  USER_DISABLED: 'user:disabled',
  USER_ENABLED: 'user:enabled',
  ROLE_CHANGED: 'user:role_changed',
  
  // Organization actions
  ORG_CREATED: 'organization:created',
  ORG_UPDATED: 'organization:updated',
  ORG_DELETED: 'organization:deleted',
  
  // Project actions
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_STATUS_CHANGED: 'project:status_changed',
  
  // Document actions
  DOCUMENT_UPLOADED: 'document:uploaded',
  DOCUMENT_DOWNLOADED: 'document:downloaded',
  DOCUMENT_DELETED: 'document:deleted',
  DOCUMENT_SHARED: 'document:shared',
  
  // Security actions
  PERMISSION_DENIED: 'security:permission_denied',
  SUSPICIOUS_ACTIVITY: 'security:suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'security:rate_limit_exceeded',
  
  // System actions
  DATA_EXPORT: 'system:data_export',
  ADMIN_ACCESS: 'system:admin_access',
  CONFIG_CHANGED: 'system:config_changed'
};

// Risk levels for audit events
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Define risk levels for each action
const ACTION_RISK_MAPPING = {
  [AUDIT_ACTIONS.LOGIN_SUCCESS]: RISK_LEVELS.LOW,
  [AUDIT_ACTIONS.LOGIN_FAILED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.LOGIN_LOCKED]: RISK_LEVELS.HIGH,
  [AUDIT_ACTIONS.LOGOUT]: RISK_LEVELS.LOW,
  [AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.PASSWORD_RESET_FAILED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.ACCOUNT_ACTIVATED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.TOKEN_REFRESHED]: RISK_LEVELS.LOW,
  [AUDIT_ACTIONS.TOKEN_REVOKED]: RISK_LEVELS.MEDIUM,
  
  [AUDIT_ACTIONS.USER_CREATED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.USER_UPDATED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.USER_DELETED]: RISK_LEVELS.HIGH,
  [AUDIT_ACTIONS.USER_DISABLED]: RISK_LEVELS.HIGH,
  [AUDIT_ACTIONS.USER_ENABLED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.ROLE_CHANGED]: RISK_LEVELS.HIGH,
  
  [AUDIT_ACTIONS.ORG_CREATED]: RISK_LEVELS.HIGH,
  [AUDIT_ACTIONS.ORG_UPDATED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.ORG_DELETED]: RISK_LEVELS.CRITICAL,
  
  [AUDIT_ACTIONS.PROJECT_CREATED]: RISK_LEVELS.LOW,
  [AUDIT_ACTIONS.PROJECT_UPDATED]: RISK_LEVELS.LOW,
  [AUDIT_ACTIONS.PROJECT_DELETED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.PROJECT_STATUS_CHANGED]: RISK_LEVELS.LOW,
  
  [AUDIT_ACTIONS.DOCUMENT_UPLOADED]: RISK_LEVELS.LOW,
  [AUDIT_ACTIONS.DOCUMENT_DOWNLOADED]: RISK_LEVELS.LOW,
  [AUDIT_ACTIONS.DOCUMENT_DELETED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.DOCUMENT_SHARED]: RISK_LEVELS.MEDIUM,
  
  [AUDIT_ACTIONS.PERMISSION_DENIED]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY]: RISK_LEVELS.HIGH,
  [AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED]: RISK_LEVELS.MEDIUM,
  
  [AUDIT_ACTIONS.DATA_EXPORT]: RISK_LEVELS.HIGH,
  [AUDIT_ACTIONS.ADMIN_ACCESS]: RISK_LEVELS.MEDIUM,
  [AUDIT_ACTIONS.CONFIG_CHANGED]: RISK_LEVELS.HIGH
};

class AuditService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Log an audit event
   * @param {Object} auditData - Audit event data
   * @returns {Promise<boolean>} Success status
   */
  async logEvent(auditData) {
    try {
      const {
        action,
        actorAdminId = null,
        actorClientId = null,
        targetType = null,
        targetId = null,
        details = {},
        ipAddress = null,
        userAgent = null,
        riskLevel = null
      } = auditData;

      // Validate required fields
      if (!action) {
        console.error('Audit log error: action is required');
        return false;
      }

      // Ensure we have either admin or client actor
      if (!actorAdminId && !actorClientId) {
        console.error('Audit log error: either actorAdminId or actorClientId is required');
        return false;
      }

      // Determine risk level if not provided
      const finalRiskLevel = riskLevel || ACTION_RISK_MAPPING[action] || RISK_LEVELS.MEDIUM;

      // Prepare audit log entry
      const query = `
        INSERT INTO audit_logs (
          actor_admin_id, 
          actor_client_id, 
          target_type, 
          target_id, 
          action, 
          details_json, 
          ip_address, 
          user_agent,
          risk_level,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING id
      `;

      const values = [
        actorAdminId,
        actorClientId,
        targetType,
        targetId,
        action,
        JSON.stringify(details),
        ipAddress,
        userAgent,
        finalRiskLevel
      ];

      const result = await this.pool.query(query, values);
      
      // For high-risk events, also log to console for immediate attention
      if (finalRiskLevel === RISK_LEVELS.HIGH || finalRiskLevel === RISK_LEVELS.CRITICAL) {
        console.warn(`HIGH-RISK AUDIT EVENT: ${action}`, {
          id: result.rows[0].id,
          actor: actorAdminId ? `admin:${actorAdminId}` : `client:${actorClientId}`,
          target: targetId ? `${targetType}:${targetId}` : targetType,
          ipAddress,
          details
        });
      }

      return true;

    } catch (error) {
      console.error('Audit logging error:', error);
      return false;
    }
  }

  /**
   * Log authentication event
   * @param {Object} authEventData - Authentication event data
   * @returns {Promise<boolean>} Success status
   */
  async logAuthEvent(authEventData) {
    const {
      action,
      userId,
      userType,
      email,
      success,
      reason,
      ipAddress,
      userAgent,
      sessionId = null
    } = authEventData;

    const details = {
      email,
      success,
      reason,
      sessionId,
      timestamp: new Date().toISOString()
    };

    const auditData = {
      action,
      actorAdminId: userType === 'admin' ? userId : null,
      actorClientId: userType === 'client' ? userId : null,
      targetType: 'user',
      targetId: userId,
      details,
      ipAddress,
      userAgent
    };

    return this.logEvent(auditData);
  }

  /**
   * Log user management event
   * @param {Object} userEventData - User event data
   * @returns {Promise<boolean>} Success status
   */
  async logUserEvent(userEventData) {
    const {
      action,
      actorId,
      actorType,
      targetUserId,
      targetUserType,
      changes = {},
      ipAddress,
      userAgent
    } = userEventData;

    const details = {
      changes,
      targetUserType,
      timestamp: new Date().toISOString()
    };

    const auditData = {
      action,
      actorAdminId: actorType === 'admin' ? actorId : null,
      actorClientId: actorType === 'client' ? actorId : null,
      targetType: 'user',
      targetId: targetUserId,
      details,
      ipAddress,
      userAgent
    };

    return this.logEvent(auditData);
  }

  /**
   * Log security event
   * @param {Object} securityEventData - Security event data
   * @returns {Promise<boolean>} Success status
   */
  async logSecurityEvent(securityEventData) {
    const {
      action,
      actorId = null,
      actorType = null,
      details = {},
      ipAddress,
      userAgent,
      riskLevel = RISK_LEVELS.HIGH
    } = securityEventData;

    const auditData = {
      action,
      actorAdminId: actorType === 'admin' ? actorId : null,
      actorClientId: actorType === 'client' ? actorId : null,
      targetType: 'security',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      riskLevel
    };

    return this.logEvent(auditData);
  }

  /**
   * Get audit logs with filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Audit logs and metadata
   */
  async getAuditLogs(filters = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        action = null,
        actorId = null,
        actorType = null,
        targetType = null,
        targetId = null,
        riskLevel = null,
        startDate = null,
        endDate = null,
        ipAddress = null
      } = filters;

      let whereConditions = [];
      let queryParams = [];
      let paramCounter = 1;

      // Build WHERE clause dynamically
      if (action) {
        whereConditions.push(`action = $${paramCounter++}`);
        queryParams.push(action);
      }

      if (actorId && actorType) {
        if (actorType === 'admin') {
          whereConditions.push(`actor_admin_id = $${paramCounter++}`);
        } else {
          whereConditions.push(`actor_client_id = $${paramCounter++}`);
        }
        queryParams.push(actorId);
      }

      if (targetType) {
        whereConditions.push(`target_type = $${paramCounter++}`);
        queryParams.push(targetType);
      }

      if (targetId) {
        whereConditions.push(`target_id = $${paramCounter++}`);
        queryParams.push(targetId);
      }

      if (riskLevel) {
        whereConditions.push(`risk_level = $${paramCounter++}`);
        queryParams.push(riskLevel);
      }

      if (startDate) {
        whereConditions.push(`created_at >= $${paramCounter++}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`created_at <= $${paramCounter++}`);
        queryParams.push(endDate);
      }

      if (ipAddress) {
        whereConditions.push(`ip_address = $${paramCounter++}`);
        queryParams.push(ipAddress);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM audit_logs 
        ${whereClause}
      `;

      const countResult = await this.pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get audit logs with user information
      const query = `
        SELECT 
          al.*,
          ua.email as actor_admin_email,
          uc.email as actor_client_email,
          o.name as client_organization_name
        FROM audit_logs al
        LEFT JOIN user_admin ua ON al.actor_admin_id = ua.id
        LEFT JOIN user_client uc ON al.actor_client_id = uc.id
        LEFT JOIN organizations o ON uc.organization_id = o.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramCounter++} OFFSET $${paramCounter++}
      `;

      queryParams.push(limit, offset);

      const result = await this.pool.query(query, queryParams);

      return {
        logs: result.rows,
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      };

    } catch (error) {
      console.error('Get audit logs error:', error);
      return {
        logs: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
        error: 'Failed to retrieve audit logs'
      };
    }
  }

  /**
   * Get security summary for dashboard
   * @param {Object} timeRange - Time range for summary
   * @returns {Promise<Object>} Security summary
   */
  async getSecuritySummary(timeRange = {}) {
    try {
      const { startDate = null, endDate = null } = timeRange;
      
      let whereConditions = [];
      let queryParams = [];
      let paramCounter = 1;

      if (startDate) {
        whereConditions.push(`created_at >= $${paramCounter++}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`created_at <= $${paramCounter++}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get security metrics
      const query = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN action LIKE 'auth:login_failed%' THEN 1 END) as failed_logins,
          COUNT(CASE WHEN action LIKE 'auth:login_locked%' THEN 1 END) as locked_accounts,
          COUNT(CASE WHEN risk_level = 'high' OR risk_level = 'critical' THEN 1 END) as high_risk_events,
          COUNT(CASE WHEN action = 'security:suspicious_activity' THEN 1 END) as suspicious_activities,
          COUNT(CASE WHEN action = 'security:rate_limit_exceeded' THEN 1 END) as rate_limit_violations,
          COUNT(DISTINCT ip_address) as unique_ips,
          COUNT(DISTINCT COALESCE(actor_admin_id, actor_client_id)) as active_users
        FROM audit_logs
        ${whereClause}
      `;

      const result = await this.pool.query(query, queryParams);
      const summary = result.rows[0];

      // Convert string numbers to integers
      Object.keys(summary).forEach(key => {
        summary[key] = parseInt(summary[key]) || 0;
      });

      return summary;

    } catch (error) {
      console.error('Security summary error:', error);
      return {
        total_events: 0,
        failed_logins: 0,
        locked_accounts: 0,
        high_risk_events: 0,
        suspicious_activities: 0,
        rate_limit_violations: 0,
        unique_ips: 0,
        active_users: 0,
        error: 'Failed to generate security summary'
      };
    }
  }

  /**
   * Clean up old audit logs (for data retention)
   * @param {number} retentionDays - Number of days to retain logs
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanupOldLogs(retentionDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Keep critical events longer
      const query = `
        DELETE FROM audit_logs 
        WHERE created_at < $1 
        AND risk_level NOT IN ('high', 'critical')
      `;

      const result = await this.pool.query(query, [cutoffDate]);
      
      console.log(`Cleaned up ${result.rowCount} old audit log entries`);
      return result.rowCount;

    } catch (error) {
      console.error('Audit log cleanup error:', error);
      return 0;
    }
  }
}

export default AuditService;