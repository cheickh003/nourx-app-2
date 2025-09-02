import { z } from 'zod';
import crypto from 'crypto';
import pool, { transaction } from '../config/database.js';
import AuthService from '../services/authService.js';
import AuditService, { AUDIT_ACTIONS } from '../services/auditService.js';

// Initialize services
const authService = new AuthService(pool);
const auditService = new AuditService(pool);

// Validation schemas
const organizationCreateSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(255, 'Organization name must be less than 255 characters'),
  rc_or_rccm: z.string().trim().max(50, 'RC/RCCM must be less than 50 characters').optional().nullable(),
  address: z.string().trim().optional().nullable(),
  billing_email: z.string().email('Invalid email format').optional().nullable()
});

const organizationUpdateSchema = organizationCreateSchema.partial();

const userCreateSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['owner', 'manager', 'reader'], { 
    required_error: 'Role must be owner, manager, or reader' 
  })
});

const userRoleUpdateSchema = z.object({
  role: z.enum(['owner', 'manager', 'reader'], { 
    required_error: 'Role must be owner, manager, or reader' 
  })
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Helper functions
const getRequestMetadata = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get('User-Agent'),
  actorId: req.user?.id,
  actorType: req.user?.userType
});

const checkOrganizationPermission = async (userId, userType, organizationId, requiredRoles = ['owner', 'manager']) => {
  if (userType === 'admin') {
    return true;
  }
  
  if (userType === 'client') {
    const user = await authService.getUserById(userId, 'user_client');
    if (!user || user.organization_id !== organizationId) {
      return false;
    }
    return requiredRoles.includes(user.role);
  }
  
  return false;
};

const generateInvitationToken = () => crypto.randomBytes(32).toString('hex');

const sendInvitationEmail = async (email, token, organizationName) => {
  // Email sending will be implemented in email service
  // For now, we'll queue it in email_outbox
  const query = `
    INSERT INTO email_outbox (to_email, subject, html_content, text_content, payload_json)
    VALUES ($1, $2, $3, $4, $5)
  `;
  
  const subject = `Invitation to join ${organizationName} on NOURX`;
  const htmlContent = `
    <h2>You've been invited to join ${organizationName}</h2>
    <p>Click the link below to activate your account:</p>
    <a href="${process.env.FRONTEND_URL}/activate?token=${token}">Activate Account</a>
    <p>This link will expire in 7 days.</p>
  `;
  const textContent = `You've been invited to join ${organizationName}. Activate your account: ${process.env.FRONTEND_URL}/activate?token=${token}`;
  
  await pool.query(query, [email, subject, htmlContent, textContent, JSON.stringify({ token, organizationName })]);
};

// =============================================================================
// ORGANIZATIONS CRUD
// =============================================================================

/**
 * Get all organizations with pagination and filtering
 * @route GET /api/accounts/organizations
 * @access Private/Admin
 */
export const getOrganizations = async (req, res) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;
    const metadata = getRequestMetadata(req);

    let whereClause = '';
    const queryParams = [];
    let paramCounter = 1;

    if (search) {
      whereClause = `WHERE (name ILIKE $${paramCounter} OR billing_email ILIKE $${paramCounter} OR rc_or_rccm ILIKE $${paramCounter})`;
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM organizations ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get organizations with user counts
    const query = `
      SELECT 
        o.*,
        COUNT(uc.id) as user_count,
        COUNT(CASE WHEN uc.active = true THEN 1 END) as active_user_count,
        COUNT(p.id) as project_count
      FROM organizations o
      LEFT JOIN user_client uc ON o.id = uc.organization_id AND uc.deleted_at IS NULL
      LEFT JOIN projects p ON o.id = p.organization_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);
    const result = await pool.query(query, queryParams);

    // Log audit event
    await auditService.logEvent({
      action: AUDIT_ACTIONS.ADMIN_ACCESS,
      actorAdminId: metadata.actorId,
      targetType: 'organizations',
      details: { action: 'list', filters: { search, sortBy, sortOrder, page, limit } },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid query parameters',
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to retrieve organizations' });
  }
};

/**
 * Create new organization
 * @route POST /api/accounts/organizations
 * @access Private/Admin
 */
export const createOrganization = async (req, res) => {
  try {
    const validatedData = organizationCreateSchema.parse(req.body);
    const metadata = getRequestMetadata(req);

    const result = await transaction(async (client) => {
      // Create organization
      const query = `
        INSERT INTO organizations (name, rc_or_rccm, address, billing_email)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        validatedData.name,
        validatedData.rc_or_rccm || null,
        validatedData.address || null,
        validatedData.billing_email || null
      ];

      const orgResult = await client.query(query, values);
      const organization = orgResult.rows[0];

      return organization;
    });

    // Log audit event
    await auditService.logEvent({
      action: AUDIT_ACTIONS.ORG_CREATED,
      actorAdminId: metadata.actorId,
      targetType: 'organization',
      targetId: result.id,
      details: { 
        organizationName: result.name,
        data: validatedData 
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Organization created successfully'
    });

  } catch (error) {
    console.error('Create organization error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to create organization' });
  }
};

/**
 * Get organization by ID with detailed information
 * @route GET /api/accounts/organizations/:id
 * @access Private/Admin
 */
export const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = getRequestMetadata(req);

    // Get organization with detailed stats
    const query = `
      SELECT 
        o.*,
        COUNT(uc.id) as user_count,
        COUNT(CASE WHEN uc.active = true THEN 1 END) as active_user_count,
        COUNT(CASE WHEN uc.role = 'owner' THEN 1 END) as owner_count,
        COUNT(CASE WHEN uc.role = 'manager' THEN 1 END) as manager_count,
        COUNT(CASE WHEN uc.role = 'reader' THEN 1 END) as reader_count,
        COUNT(p.id) as project_count,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_project_count,
        COUNT(t.id) as ticket_count,
        COUNT(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 END) as open_ticket_count
      FROM organizations o
      LEFT JOIN user_client uc ON o.id = uc.organization_id AND uc.deleted_at IS NULL
      LEFT JOIN projects p ON o.id = p.organization_id
      LEFT JOIN tickets t ON o.id = t.organization_id
      WHERE o.id = $1
      GROUP BY o.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Organization not found' 
      });
    }

    const organization = result.rows[0];

    // Get recent users
    const usersQuery = `
      SELECT id, email, role, active, last_login_at, created_at
      FROM user_client 
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const usersResult = await pool.query(usersQuery, [id]);

    // Get recent projects
    const projectsQuery = `
      SELECT id, name, status, created_at
      FROM projects
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const projectsResult = await pool.query(projectsQuery, [id]);

    // Log audit event
    await auditService.logEvent({
      action: AUDIT_ACTIONS.ADMIN_ACCESS,
      actorAdminId: metadata.actorId,
      targetType: 'organization',
      targetId: id,
      details: { action: 'view_details' },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: {
        ...organization,
        recent_users: usersResult.rows,
        recent_projects: projectsResult.rows
      }
    });

  } catch (error) {
    console.error('Get organization by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve organization' });
  }
};

/**
 * Update organization
 * @route PATCH /api/accounts/organizations/:id
 * @access Private/Admin
 */
export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = organizationUpdateSchema.parse(req.body);
    const metadata = getRequestMetadata(req);

    // Check if organization exists and get current data
    const currentQuery = 'SELECT * FROM organizations WHERE id = $1';
    const currentResult = await pool.query(currentQuery, [id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Organization not found' 
      });
    }

    const currentOrg = currentResult.rows[0];

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== currentOrg[key]) {
        updateFields.push(`${key} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No changes detected' 
      });
    }

    const updateQuery = `
      UPDATE organizations 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(updateQuery, values);
    const updatedOrg = result.rows[0];

    // Log audit event
    await auditService.logEvent({
      action: AUDIT_ACTIONS.ORG_UPDATED,
      actorAdminId: metadata.actorId,
      targetType: 'organization',
      targetId: id,
      details: { 
        organizationName: updatedOrg.name,
        changes: validatedData,
        previousData: currentOrg
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: updatedOrg,
      message: 'Organization updated successfully'
    });

  } catch (error) {
    console.error('Update organization error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to update organization' });
  }
};

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * Get organization users with pagination and filtering
 * @route GET /api/accounts/organizations/:orgId/users
 * @access Private/Admin or Organization Owner/Manager
 */
export const getOrganizationUsers = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { page = 1, limit = 20, search, role, active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const metadata = getRequestMetadata(req);

    // Check permissions
    const hasPermission = await checkOrganizationPermission(
      metadata.actorId, 
      metadata.actorType, 
      orgId
    );
    
    if (!hasPermission) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        actorId: metadata.actorId,
        actorType: metadata.actorType,
        details: { resource: 'organization_users', organizationId: orgId },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
      
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    // Build filter conditions
    const whereConditions = ['uc.organization_id = $1', 'uc.deleted_at IS NULL'];
    const queryParams = [orgId];
    let paramCounter = 2;

    if (search) {
      whereConditions.push(`uc.email ILIKE $${paramCounter}`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    if (role) {
      whereConditions.push(`uc.role = $${paramCounter}`);
      queryParams.push(role);
      paramCounter++;
    }

    if (active !== undefined) {
      whereConditions.push(`uc.active = $${paramCounter}`);
      queryParams.push(active === 'true');
      paramCounter++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM user_client uc 
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get users
    const query = `
      SELECT 
        uc.id,
        uc.email,
        uc.role,
        uc.active,
        uc.disabled_reason,
        uc.last_login_at,
        uc.created_at,
        uc.updated_at,
        o.name as organization_name
      FROM user_client uc
      JOIN organizations o ON uc.organization_id = o.id
      WHERE ${whereClause}
      ORDER BY uc.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(parseInt(limit), offset);
    const result = await pool.query(query, queryParams);

    // Log audit event
    await auditService.logEvent({
      action: AUDIT_ACTIONS.ADMIN_ACCESS,
      actorAdminId: metadata.actorType === 'admin' ? metadata.actorId : null,
      actorClientId: metadata.actorType === 'client' ? metadata.actorId : null,
      targetType: 'organization_users',
      targetId: orgId,
      details: { action: 'list', filters: { search, role, active } },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: (parseInt(page) * parseInt(limit)) < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve organization users' });
  }
};

/**
 * Create client user and send invitation
 * @route POST /api/accounts/organizations/:orgId/users
 * @access Private/Admin or Organization Owner
 */
export const createClientUser = async (req, res) => {
  try {
    const { orgId } = req.params;
    const validatedData = userCreateSchema.parse(req.body);
    const metadata = getRequestMetadata(req);

    // Check permissions (only owners can create users, or admins)
    const hasPermission = await checkOrganizationPermission(
      metadata.actorId, 
      metadata.actorType, 
      orgId, 
      ['owner'] // Only owners can invite users
    );
    
    if (!hasPermission) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        actorId: metadata.actorId,
        actorType: metadata.actorType,
        details: { resource: 'create_user', organizationId: orgId },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
      
      return res.status(403).json({ 
        success: false, 
        error: 'Only organization owners can invite new users' 
      });
    }

    const result = await transaction(async (client) => {
      // Check if organization exists
      const orgQuery = 'SELECT name FROM organizations WHERE id = $1';
      const orgResult = await client.query(orgQuery, [orgId]);
      
      if (orgResult.rows.length === 0) {
        throw new Error('Organization not found');
      }
      
      const organizationName = orgResult.rows[0].name;

      // Check if user already exists
      const existingQuery = 'SELECT id, active, deleted_at FROM user_client WHERE organization_id = $1 AND email = $2';
      const existingResult = await client.query(existingQuery, [orgId, validatedData.email]);
      
      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        if (existing.deleted_at) {
          throw new Error('User with this email was previously deleted');
        } else if (existing.active) {
          throw new Error('User with this email already exists and is active');
        } else {
          throw new Error('User with this email already exists but is inactive');
        }
      }

      // Generate invitation token
      const invitationToken = generateInvitationToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create user
      const createQuery = `
        INSERT INTO user_client (
          organization_id, email, role, active, 
          invitation_token, invitation_expires_at
        )
        VALUES ($1, $2, $3, true, $4, $5)
        RETURNING id, email, role, active, created_at
      `;

      const userResult = await client.query(createQuery, [
        orgId,
        validatedData.email.toLowerCase(),
        validatedData.role,
        invitationToken,
        expiresAt
      ]);

      const user = userResult.rows[0];

      // Send invitation email
      await sendInvitationEmail(validatedData.email, invitationToken, organizationName);

      return { user, organizationName, invitationToken };
    });

    // Log audit event
    await auditService.logUserEvent({
      action: AUDIT_ACTIONS.USER_CREATED,
      actorId: metadata.actorId,
      actorType: metadata.actorType,
      targetUserId: result.user.id,
      targetUserType: 'client',
      changes: {
        email: validatedData.email,
        role: validatedData.role,
        organizationId: orgId,
        invitationSent: true
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.status(201).json({
      success: true,
      data: {
        ...result.user,
        organization_name: result.organizationName,
        invitation_sent: true
      },
      message: 'User created and invitation sent successfully'
    });

  } catch (error) {
    console.error('Create client user error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      });
    }
    if (error.message.includes('already exists') || error.message.includes('not found')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

/**
 * Activate client user
 * @route PATCH /api/accounts/organizations/:orgId/users/:userId/activate
 * @access Private/Admin
 */
export const activateClientUser = async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const metadata = getRequestMetadata(req);

    const result = await transaction(async (client) => {
      // Get user
      const userQuery = `
        SELECT uc.*, o.name as organization_name
        FROM user_client uc
        JOIN organizations o ON uc.organization_id = o.id
        WHERE uc.id = $1 AND uc.organization_id = $2 AND uc.deleted_at IS NULL
      `;
      const userResult = await client.query(userQuery, [userId, orgId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      
      if (user.active) {
        throw new Error('User is already active');
      }

      // Activate user
      const updateQuery = `
        UPDATE user_client 
        SET active = true, disabled_reason = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, role, active
      `;
      
      const updateResult = await client.query(updateQuery, [userId]);
      return { user: updateResult.rows[0], organizationName: user.organization_name };
    });

    // Log audit event
    await auditService.logUserEvent({
      action: AUDIT_ACTIONS.USER_ENABLED,
      actorId: metadata.actorId,
      actorType: metadata.actorType,
      targetUserId: userId,
      targetUserType: 'client',
      changes: { active: true, disabled_reason: null },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: result.user,
      message: 'User activated successfully'
    });

  } catch (error) {
    console.error('Activate client user error:', error);
    if (error.message === 'User not found' || error.message === 'User is already active') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to activate user' });
  }
};

/**
 * Deactivate client user
 * @route PATCH /api/accounts/organizations/:orgId/users/:userId/deactivate
 * @access Private/Admin
 */
export const deactivateClientUser = async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const { reason } = req.body;
    const metadata = getRequestMetadata(req);

    const result = await transaction(async (client) => {
      // Get user
      const userQuery = `
        SELECT uc.*, o.name as organization_name
        FROM user_client uc
        JOIN organizations o ON uc.organization_id = o.id
        WHERE uc.id = $1 AND uc.organization_id = $2 AND uc.deleted_at IS NULL
      `;
      const userResult = await client.query(userQuery, [userId, orgId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      
      if (!user.active) {
        throw new Error('User is already inactive');
      }

      // Deactivate user
      const updateQuery = `
        UPDATE user_client 
        SET active = false, disabled_reason = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, role, active, disabled_reason
      `;
      
      const updateResult = await client.query(updateQuery, [reason, userId]);
      return { user: updateResult.rows[0], organizationName: user.organization_name };
    });

    // Log audit event
    await auditService.logUserEvent({
      action: AUDIT_ACTIONS.USER_DISABLED,
      actorId: metadata.actorId,
      actorType: metadata.actorType,
      targetUserId: userId,
      targetUserType: 'client',
      changes: { active: false, disabled_reason: reason },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: result.user,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate client user error:', error);
    if (error.message === 'User not found' || error.message === 'User is already inactive') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to deactivate user' });
  }
};

/**
 * Soft delete client user
 * @route DELETE /api/accounts/organizations/:orgId/users/:userId
 * @access Private/Admin
 */
export const deleteClientUser = async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const { reason } = req.body;
    const metadata = getRequestMetadata(req);

    const result = await transaction(async (client) => {
      // Get user
      const userQuery = `
        SELECT uc.*, o.name as organization_name
        FROM user_client uc
        JOIN organizations o ON uc.organization_id = o.id
        WHERE uc.id = $1 AND uc.organization_id = $2 AND uc.deleted_at IS NULL
      `;
      const userResult = await client.query(userQuery, [userId, orgId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found or already deleted');
      }
      
      const user = userResult.rows[0];

      // Soft delete user
      const deleteQuery = `
        UPDATE user_client 
        SET 
          deleted_at = CURRENT_TIMESTAMP,
          active = false,
          disabled_reason = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, role, deleted_at
      `;
      
      const deleteResult = await client.query(deleteQuery, [reason, userId]);
      return { user: deleteResult.rows[0], organizationName: user.organization_name };
    });

    // Log audit event
    await auditService.logUserEvent({
      action: AUDIT_ACTIONS.USER_DELETED,
      actorId: metadata.actorId,
      actorType: metadata.actorType,
      targetUserId: userId,
      targetUserType: 'client',
      changes: { deleted_at: result.user.deleted_at, reason },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: result.user,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete client user error:', error);
    if (error.message === 'User not found or already deleted') {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

/**
 * Send password reset email for client user
 * @route POST /api/accounts/organizations/:orgId/users/:userId/reset-password
 * @access Private/Admin or Organization Owner
 */
export const resetClientUserPassword = async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const metadata = getRequestMetadata(req);

    // Check permissions
    const hasPermission = await checkOrganizationPermission(
      metadata.actorId, 
      metadata.actorType, 
      orgId, 
      ['owner'] // Only owners can reset passwords
    );
    
    if (!hasPermission) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        actorId: metadata.actorId,
        actorType: metadata.actorType,
        details: { resource: 'reset_password', userId, organizationId: orgId },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
      
      return res.status(403).json({ 
        success: false, 
        error: 'Only organization owners can reset user passwords' 
      });
    }

    const result = await transaction(async (client) => {
      // Get user
      const userQuery = `
        SELECT uc.*, o.name as organization_name
        FROM user_client uc
        JOIN organizations o ON uc.organization_id = o.id
        WHERE uc.id = $1 AND uc.organization_id = $2 AND uc.deleted_at IS NULL AND uc.active = true
      `;
      const userResult = await client.query(userQuery, [userId, orgId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found or inactive');
      }
      
      const user = userResult.rows[0];

      // Generate reset token using authService
      const resetResult = await authService.generatePasswordResetToken(user.email, 'client');
      
      if (!resetResult.success) {
        throw new Error('Failed to generate reset token');
      }

      return { user, resetToken: resetResult.token, organizationName: user.organization_name };
    });

    // Log audit event
    await auditService.logUserEvent({
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      actorId: metadata.actorId,
      actorType: metadata.actorType,
      targetUserId: userId,
      targetUserType: 'client',
      changes: { password_reset_requested: true },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    // Send reset email (queue in email_outbox)
    const subject = 'Password Reset for NOURX Account';
    const htmlContent = `
      <h2>Password Reset Request</h2>
      <p>A password reset has been requested for your account at ${result.organizationName}.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${result.resetToken}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please contact your administrator.</p>
    `;
    const textContent = `Password reset requested. Reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${result.resetToken}`;
    
    await pool.query(
      'INSERT INTO email_outbox (to_email, subject, html_content, text_content, payload_json) VALUES ($1, $2, $3, $4, $5)',
      [result.user.email, subject, htmlContent, textContent, JSON.stringify({ resetToken: result.resetToken, userId })]
    );

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Reset client user password error:', error);
    if (error.message === 'User not found or inactive') {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to send password reset email' });
  }
};

/**
 * Update client user role
 * @route PATCH /api/accounts/organizations/:orgId/users/:userId/role
 * @access Private/Admin or Organization Owner
 */
export const updateClientUserRole = async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const validatedData = userRoleUpdateSchema.parse(req.body);
    const metadata = getRequestMetadata(req);

    // Check permissions
    const hasPermission = await checkOrganizationPermission(
      metadata.actorId, 
      metadata.actorType, 
      orgId, 
      ['owner'] // Only owners can change roles
    );
    
    if (!hasPermission) {
      await auditService.logSecurityEvent({
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        actorId: metadata.actorId,
        actorType: metadata.actorType,
        details: { resource: 'update_role', userId, organizationId: orgId },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
      
      return res.status(403).json({ 
        success: false, 
        error: 'Only organization owners can change user roles' 
      });
    }

    const result = await transaction(async (client) => {
      // Get user
      const userQuery = `
        SELECT uc.*, o.name as organization_name
        FROM user_client uc
        JOIN organizations o ON uc.organization_id = o.id
        WHERE uc.id = $1 AND uc.organization_id = $2 AND uc.deleted_at IS NULL
      `;
      const userResult = await client.query(userQuery, [userId, orgId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      const previousRole = user.role;
      
      if (previousRole === validatedData.role) {
        throw new Error('User already has this role');
      }

      // Update user role
      const updateQuery = `
        UPDATE user_client 
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, role, active
      `;
      
      const updateResult = await client.query(updateQuery, [validatedData.role, userId]);
      return { 
        user: updateResult.rows[0], 
        organizationName: user.organization_name,
        previousRole 
      };
    });

    // Log audit event
    await auditService.logUserEvent({
      action: AUDIT_ACTIONS.ROLE_CHANGED,
      actorId: metadata.actorId,
      actorType: metadata.actorType,
      targetUserId: userId,
      targetUserType: 'client',
      changes: { 
        previousRole: result.previousRole, 
        newRole: validatedData.role 
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    res.json({
      success: true,
      data: result.user,
      message: `User role updated from ${result.previousRole} to ${validatedData.role}`
    });

  } catch (error) {
    console.error('Update client user role error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input data',
        details: error.errors 
      });
    }
    if (error.message === 'User not found' || error.message === 'User already has this role') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
};