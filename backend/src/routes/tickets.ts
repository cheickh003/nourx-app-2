import { Router } from 'express';
import multer from 'multer';
import { AppError } from '@/lib/errors';
import { requireAuth } from '@/middleware/auth';
import { requireRoles } from '@/middleware/roles';
import { validateRequest } from '@/middleware/validation';
import { createRateLimit } from '@/middleware/rateLimiting';
import { ticketService } from '@/services/ticket.service';
import { ticketCategoryService } from '@/services/ticketCategory.service';
import { ticketReplyService } from '@/services/ticketReply.service';
import { macroService } from '@/services/macro.service';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  TicketFiltersSchema,
  CreateTicketCategorySchema,
  UpdateTicketCategorySchema,
  TicketCategoryFiltersSchema,
  CreateTicketReplySchema,
  UpdateTicketReplySchema,
  TicketReplyFiltersSchema,
  ExecuteMacroSchema,
  TestMacroSchema,
} from '@nourx/shared';
import type { AuthRequest } from '@/types/auth';
import logger from '@/lib/logger';

const router = Router();

// Rate limiting
const ticketRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each organization to 100 requests per windowMs
  keyGenerator: (req: AuthRequest) => req.auth?.organizationId || req.ip,
});

const replyRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit reply creation
  keyGenerator: (req: AuthRequest) => req.auth?.organizationId || req.ip,
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types and images
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type ${file.mimetype} is not allowed`, 400));
    }
  },
});

// Apply auth and rate limiting to all routes
router.use(requireAuth);
router.use(ticketRateLimit);

// =============================================================================
// TICKET ROUTES
// =============================================================================

/**
 * @route   POST /api/tickets
 * @desc    Create a new ticket
 * @access  Private (Agent+)
 */
router.post(
  '/',
  requireRoles(['agent', 'admin']),
  validateRequest(CreateTicketSchema),
  async (req: AuthRequest, res) => {
    try {
      const ticket = await ticketService.createTicket(req.body, req.auth!);
      
      logger.info('Ticket created via API', {
        ticketId: ticket.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      logger.error('Failed to create ticket', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/tickets
 * @desc    Get tickets with filtering and pagination
 * @access  Private (Agent+)
 */
router.get(
  '/',
  requireRoles(['agent', 'admin']),
  validateRequest(TicketFiltersSchema, 'query'),
  async (req: AuthRequest, res) => {
    try {
      const tickets = await ticketService.getTickets(
        req.query as any,
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error: any) {
      logger.error('Failed to get tickets', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/tickets/stats
 * @desc    Get ticket statistics
 * @access  Private (Agent+)
 */
router.get(
  '/stats',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const stats = await ticketService.getTicketStats(req.auth!.organizationId!);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get ticket stats', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get a specific ticket by ID
 * @access  Private (Agent+)
 */
router.get(
  '/:id',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const ticket = await ticketService.getTicketById(
        req.params.id,
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      logger.error('Failed to get ticket', {
        ticketId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update a ticket
 * @access  Private (Agent+)
 */
router.put(
  '/:id',
  requireRoles(['agent', 'admin']),
  validateRequest(UpdateTicketSchema),
  async (req: AuthRequest, res) => {
    try {
      const ticket = await ticketService.updateTicket(
        req.params.id,
        req.body,
        req.auth!
      );

      logger.info('Ticket updated via API', {
        ticketId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      logger.error('Failed to update ticket', {
        ticketId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tickets/:id/status
 * @desc    Change ticket status
 * @access  Private (Agent+)
 */
router.post(
  '/:id/status',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const { status, resolution } = req.body;
      
      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const ticket = await ticketService.changeTicketStatus(
        req.params.id,
        status,
        req.auth!,
        resolution
      );

      logger.info('Ticket status changed via API', {
        ticketId: req.params.id,
        newStatus: status,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      logger.error('Failed to change ticket status', {
        ticketId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Delete a ticket (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  requireRoles(['admin']),
  async (req: AuthRequest, res) => {
    try {
      await ticketService.deleteTicket(
        req.params.id,
        req.auth!.organizationId!,
        req.auth!
      );

      logger.info('Ticket deleted via API', {
        ticketId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Ticket deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete ticket', {
        ticketId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// TICKET REPLIES ROUTES
// =============================================================================

/**
 * @route   GET /api/tickets/:ticketId/replies
 * @desc    Get replies for a ticket
 * @access  Private (Agent+)
 */
router.get(
  '/:ticketId/replies',
  requireRoles(['agent', 'admin']),
  validateRequest(TicketReplyFiltersSchema, 'query'),
  async (req: AuthRequest, res) => {
    try {
      const replies = await ticketReplyService.getRepliesByTicket(
        req.params.ticketId,
        req.query as any,
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: replies,
      });
    } catch (error: any) {
      logger.error('Failed to get ticket replies', {
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tickets/:ticketId/replies
 * @desc    Add a reply to a ticket
 * @access  Private (Agent+)
 */
router.post(
  '/:ticketId/replies',
  replyRateLimit,
  requireRoles(['agent', 'admin']),
  upload.array('attachments', 5),
  validateRequest(CreateTicketReplySchema),
  async (req: AuthRequest, res) => {
    try {
      let replyData = {
        ...req.body,
        ticketId: req.params.ticketId,
      };

      // Handle file attachments if any
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Process files for storage
        replyData.attachments = req.files.map((file: any) => ({
          filename: file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          buffer: file.buffer,
        }));
      }

      const reply = await ticketReplyService.createReply(replyData, req.auth!);

      logger.info('Ticket reply created via API', {
        replyId: reply.id,
        ticketId: req.params.ticketId,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        data: reply,
      });
    } catch (error: any) {
      logger.error('Failed to create ticket reply', {
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   PUT /api/tickets/:ticketId/replies/:replyId
 * @desc    Update a ticket reply
 * @access  Private (Agent+, Own replies only)
 */
router.put(
  '/:ticketId/replies/:replyId',
  requireRoles(['agent', 'admin']),
  validateRequest(UpdateTicketReplySchema),
  async (req: AuthRequest, res) => {
    try {
      const reply = await ticketReplyService.updateReply(
        req.params.replyId,
        req.body,
        req.auth!
      );

      logger.info('Ticket reply updated via API', {
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: reply,
      });
    } catch (error: any) {
      logger.error('Failed to update ticket reply', {
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   DELETE /api/tickets/:ticketId/replies/:replyId
 * @desc    Delete a ticket reply
 * @access  Private (Agent+, Own replies only)
 */
router.delete(
  '/:ticketId/replies/:replyId',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      await ticketReplyService.deleteReply(
        req.params.replyId,
        req.auth!.organizationId!,
        req.auth!
      );

      logger.info('Ticket reply deleted via API', {
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Reply deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete ticket reply', {
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tickets/:ticketId/replies/:replyId/attachments
 * @desc    Add attachment to a reply
 * @access  Private (Agent+)
 */
router.post(
  '/:ticketId/replies/:replyId/attachments',
  requireRoles(['agent', 'admin']),
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const attachment = await ticketReplyService.addAttachment(
        req.params.replyId,
        {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
        },
        req.auth!
      );

      logger.info('Reply attachment added via API', {
        attachmentId: attachment.id,
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (error: any) {
      logger.error('Failed to add reply attachment', {
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   DELETE /api/tickets/:ticketId/replies/:replyId/attachments/:attachmentId
 * @desc    Remove attachment from a reply
 * @access  Private (Agent+)
 */
router.delete(
  '/:ticketId/replies/:replyId/attachments/:attachmentId',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      await ticketReplyService.removeAttachment(
        req.params.attachmentId,
        req.auth!
      );

      logger.info('Reply attachment removed via API', {
        attachmentId: req.params.attachmentId,
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Attachment removed successfully',
      });
    } catch (error: any) {
      logger.error('Failed to remove reply attachment', {
        attachmentId: req.params.attachmentId,
        replyId: req.params.replyId,
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// TICKET CATEGORIES ROUTES
// =============================================================================

/**
 * @route   GET /api/tickets/categories
 * @desc    Get ticket categories
 * @access  Private (Agent+)
 */
router.get(
  '/categories',
  requireRoles(['agent', 'admin']),
  validateRequest(TicketCategoryFiltersSchema, 'query'),
  async (req: AuthRequest, res) => {
    try {
      const categories = await ticketCategoryService.getCategories(
        req.query as any,
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Failed to get ticket categories', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/tickets/categories/active
 * @desc    Get active ticket categories
 * @access  Private (Agent+)
 */
router.get(
  '/categories/active',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const categories = await ticketCategoryService.getActiveCategories(
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Failed to get active ticket categories', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/tickets/categories/stats
 * @desc    Get ticket category statistics
 * @access  Private (Admin only)
 */
router.get(
  '/categories/stats',
  requireRoles(['admin']),
  async (req: AuthRequest, res) => {
    try {
      const stats = await ticketCategoryService.getCategoryStats(
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get ticket category stats', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tickets/categories
 * @desc    Create a new ticket category
 * @access  Private (Admin only)
 */
router.post(
  '/categories',
  requireRoles(['admin']),
  validateRequest(CreateTicketCategorySchema),
  async (req: AuthRequest, res) => {
    try {
      const category = await ticketCategoryService.createCategory(req.body, req.auth!);

      logger.info('Ticket category created via API', {
        categoryId: category.id,
        name: category.name,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Failed to create ticket category', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/tickets/categories/:id
 * @desc    Get a specific ticket category by ID
 * @access  Private (Agent+)
 */
router.get(
  '/categories/:id',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const category = await ticketCategoryService.getCategoryById(
        req.params.id,
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Failed to get ticket category', {
        categoryId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   PUT /api/tickets/categories/:id
 * @desc    Update a ticket category
 * @access  Private (Admin only)
 */
router.put(
  '/categories/:id',
  requireRoles(['admin']),
  validateRequest(UpdateTicketCategorySchema),
  async (req: AuthRequest, res) => {
    try {
      const category = await ticketCategoryService.updateCategory(
        req.params.id,
        req.body,
        req.auth!
      );

      logger.info('Ticket category updated via API', {
        categoryId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Failed to update ticket category', {
        categoryId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tickets/categories/:id/toggle
 * @desc    Toggle ticket category active status
 * @access  Private (Admin only)
 */
router.post(
  '/categories/:id/toggle',
  requireRoles(['admin']),
  async (req: AuthRequest, res) => {
    try {
      const category = await ticketCategoryService.toggleCategoryStatus(
        req.params.id,
        req.auth!
      );

      logger.info('Ticket category status toggled via API', {
        categoryId: req.params.id,
        newStatus: category.isActive,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Failed to toggle ticket category status', {
        categoryId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tickets/categories/reorder
 * @desc    Reorder ticket categories
 * @access  Private (Admin only)
 */
router.post(
  '/categories/reorder',
  requireRoles(['admin']),
  async (req: AuthRequest, res) => {
    try {
      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        throw new AppError('categoryOrders must be an array', 400);
      }

      await ticketCategoryService.reorderCategories(categoryOrders, req.auth!);

      logger.info('Ticket categories reordered via API', {
        categoryCount: categoryOrders.length,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Categories reordered successfully',
      });
    } catch (error: any) {
      logger.error('Failed to reorder ticket categories', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   DELETE /api/tickets/categories/:id
 * @desc    Delete a ticket category
 * @access  Private (Admin only)
 */
router.delete(
  '/categories/:id',
  requireRoles(['admin']),
  async (req: AuthRequest, res) => {
    try {
      await ticketCategoryService.deleteCategory(
        req.params.id,
        req.auth!.organizationId!,
        req.auth!
      );

      logger.info('Ticket category deleted via API', {
        categoryId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete ticket category', {
        categoryId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// MACRO EXECUTION ROUTES
// =============================================================================

/**
 * @route   POST /api/tickets/:ticketId/execute-macro
 * @desc    Execute a macro on a ticket
 * @access  Private (Agent+)
 */
router.post(
  '/:ticketId/execute-macro',
  requireRoles(['agent', 'admin']),
  validateRequest(ExecuteMacroSchema),
  async (req: AuthRequest, res) => {
    try {
      const executionData = {
        ...req.body,
        ticketId: req.params.ticketId,
      };

      const execution = await macroService.executeMacro(executionData, req.auth!);

      logger.info('Macro executed on ticket via API', {
        executionId: execution.id,
        macroId: req.body.macroId,
        ticketId: req.params.ticketId,
        status: execution.status,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: execution,
      });
    } catch (error: any) {
      logger.error('Failed to execute macro on ticket', {
        macroId: req.body.macroId,
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tickets/:ticketId/test-macro
 * @desc    Test a macro on a ticket (dry run)
 * @access  Private (Agent+)
 */
router.post(
  '/:ticketId/test-macro',
  requireRoles(['agent', 'admin']),
  validateRequest(TestMacroSchema),
  async (req: AuthRequest, res) => {
    try {
      const testData = {
        ...req.body,
        ticketId: req.params.ticketId,
      };

      const execution = await macroService.testMacro(testData, req.auth!);

      logger.info('Macro tested on ticket via API', {
        macroId: req.body.macroId,
        ticketId: req.params.ticketId,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: execution,
      });
    } catch (error: any) {
      logger.error('Failed to test macro on ticket', {
        macroId: req.body.macroId,
        ticketId: req.params.ticketId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

export default router;