import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'kysely';
import {
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
  TestEmailTemplateInput,
  RenderEmailTemplateInput,
  EmailTemplateFilters,
  ValidateTemplateVariablesInput,
  EmailTemplate,
  EmailTemplateList,
  EmailTemplateStats,
  RenderedEmailTemplate,
  TemplateValidationResult,
} from '@nourx/shared';
import type { RequestContext } from '@/types/context';
import { withTransaction } from '@/lib/transaction';
import { AuditAction } from '@/types/audit';
import { auditService } from './audit.service';
import { emailOutboxService } from './emailOutbox.service';

export class EmailTemplateService {
  // Template variable regex to find {{variable}} patterns
  private readonly VARIABLE_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

  async createTemplate(input: CreateEmailTemplateInput, context: RequestContext): Promise<EmailTemplate> {
    const validated = await CreateEmailTemplateInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      const id = uuidv4();
      const now = new Date().toISOString();

      // Check if template name already exists
      const existingTemplate = await trx
        .selectFrom('email_templates')
        .select('id')
        .where('organization_id', '=', context.organizationId!)
        .where('name', '=', validated.name)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (existingTemplate) {
        throw new AppError('Template name already exists', 409);
      }

      // Validate template content and variables
      const validationResult = await this.validateTemplateContent(
        validated.htmlContent,
        validated.textContent || '',
        validated.subject,
        validated.variables
      );

      if (!validationResult.isValid) {
        throw new AppError(`Template validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`, 400);
      }

      // Create template
      await trx.insertInto('email_templates').values({
        id,
        organization_id: context.organizationId!,
        name: validated.name,
        subject: validated.subject,
        html_content: validated.htmlContent,
        text_content: validated.textContent,
        is_active: validated.isActive,
        category: validated.category,
        description: validated.description,
        usage_count: 0,
        created_by: context.userId,
        created_at: now,
        updated_at: now,
      }).execute();

      // Create template variables
      for (const variable of validated.variables) {
        await trx.insertInto('email_template_variables').values({
          id: uuidv4(),
          template_id: id,
          name: variable.name,
          type: variable.type,
          description: variable.description,
          required: variable.required,
          default_value: variable.defaultValue,
          example: variable.example,
        }).execute();
      }

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.EMAIL_TEMPLATE_CREATED,
        resourceType: 'email_template',
        resourceId: id,
        details: {
          name: validated.name,
          category: validated.category,
          variableCount: validated.variables.length,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return await this.getTemplateById(id, context.organizationId!, trx);
    });

    logger.info('Email template created', {
      templateId: result.id,
      name: result.name,
      category: result.category,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getTemplateById(id: string, organizationId: string, trx?: Transaction<any>): Promise<EmailTemplate> {
    const query = (trx || db)
      .selectFrom('email_templates')
      .leftJoin('users as creator', 'email_templates.created_by', 'creator.id')
      .select([
        'email_templates.id',
        'email_templates.organization_id as organizationId',
        'email_templates.name',
        'email_templates.subject',
        'email_templates.html_content as htmlContent',
        'email_templates.text_content as textContent',
        'email_templates.is_active as isActive',
        'email_templates.category',
        'email_templates.description',
        'email_templates.usage_count as usageCount',
        'email_templates.last_used_at as lastUsedAt',
        'email_templates.created_by as createdBy',
        'creator.first_name as creatorFirstName',
        'creator.last_name as creatorLastName',
        'email_templates.created_at as createdAt',
        'email_templates.updated_at as updatedAt',
      ])
      .where('email_templates.id', '=', id)
      .where('email_templates.organization_id', '=', organizationId)
      .where('email_templates.deleted_at', 'is', null);

    const row = await query.executeTakeFirst();
    if (!row) {
      throw new AppError('Email template not found', 404);
    }

    // Get template variables
    const variables = await (trx || db)
      .selectFrom('email_template_variables')
      .select([
        'name',
        'type',
        'description',
        'required',
        'default_value as defaultValue',
        'example',
      ])
      .where('template_id', '=', id)
      .execute();

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      subject: row.subject,
      htmlContent: row.htmlContent,
      textContent: row.textContent,
      variables: variables.map(v => ({
        name: v.name,
        type: v.type as any,
        description: v.description,
        required: v.required,
        defaultValue: v.defaultValue,
        example: v.example,
      })),
      isActive: row.isActive,
      category: row.category,
      description: row.description,
      createdBy: row.createdBy,
      creatorName: row.creatorFirstName ? `${row.creatorFirstName} ${row.creatorLastName}`.trim() : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      usageCount: row.usageCount,
      lastUsedAt: row.lastUsedAt,
    };
  }

  async updateTemplate(id: string, input: UpdateEmailTemplateInput, context: RequestContext): Promise<EmailTemplate> {
    const validated = await UpdateEmailTemplateInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      // Get current template
      const currentTemplate = await this.getTemplateById(id, context.organizationId!, trx);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Track changes for audit
      const changes: Record<string, { from: any; to: any }> = {};

      if (validated.name !== undefined && validated.name !== currentTemplate.name) {
        // Check if new name already exists
        const existingTemplate = await trx
          .selectFrom('email_templates')
          .select('id')
          .where('organization_id', '=', context.organizationId!)
          .where('name', '=', validated.name)
          .where('id', '!=', id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst();

        if (existingTemplate) {
          throw new AppError('Template name already exists', 409);
        }

        updateData.name = validated.name;
        changes.name = { from: currentTemplate.name, to: validated.name };
      }

      if (validated.subject !== undefined && validated.subject !== currentTemplate.subject) {
        updateData.subject = validated.subject;
        changes.subject = { from: currentTemplate.subject, to: validated.subject };
      }

      if (validated.htmlContent !== undefined && validated.htmlContent !== currentTemplate.htmlContent) {
        updateData.html_content = validated.htmlContent;
        changes.htmlContent = { from: 'Updated', to: 'Updated' }; // Don't log full content
      }

      if (validated.textContent !== undefined && validated.textContent !== currentTemplate.textContent) {
        updateData.text_content = validated.textContent;
        changes.textContent = { from: 'Updated', to: 'Updated' }; // Don't log full content
      }

      if (validated.isActive !== undefined && validated.isActive !== currentTemplate.isActive) {
        updateData.is_active = validated.isActive;
        changes.isActive = { from: currentTemplate.isActive, to: validated.isActive };
      }

      if (validated.category !== undefined && validated.category !== currentTemplate.category) {
        updateData.category = validated.category;
        changes.category = { from: currentTemplate.category, to: validated.category };
      }

      if (validated.description !== undefined && validated.description !== currentTemplate.description) {
        updateData.description = validated.description;
        changes.description = { from: currentTemplate.description, to: validated.description };
      }

      // Validate template content if any content was changed
      if (updateData.html_content || updateData.text_content || updateData.subject) {
        const htmlContent = updateData.html_content || currentTemplate.htmlContent;
        const textContent = updateData.text_content || currentTemplate.textContent || '';
        const subject = updateData.subject || currentTemplate.subject;
        const variables = validated.variables || currentTemplate.variables;

        const validationResult = await this.validateTemplateContent(htmlContent, textContent, subject, variables);

        if (!validationResult.isValid) {
          throw new AppError(`Template validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`, 400);
        }
      }

      // Update template variables if provided
      if (validated.variables) {
        // Delete existing variables
        await trx
          .deleteFrom('email_template_variables')
          .where('template_id', '=', id)
          .execute();

        // Add new variables
        for (const variable of validated.variables) {
          await trx.insertInto('email_template_variables').values({
            id: uuidv4(),
            template_id: id,
            name: variable.name,
            type: variable.type,
            description: variable.description,
            required: variable.required,
            default_value: variable.defaultValue,
            example: variable.example,
          }).execute();
        }

        changes.variableCount = { from: currentTemplate.variables.length, to: validated.variables.length };
      }

      // Update template
      await trx
        .updateTable('email_templates')
        .set(updateData)
        .where('id', '=', id)
        .where('organization_id', '=', context.organizationId!)
        .where('deleted_at', 'is', null)
        .execute();

      // Log audit
      if (Object.keys(changes).length > 0) {
        await auditService.log({
          organizationId: context.organizationId!,
          userId: context.userId,
          action: AuditAction.EMAIL_TEMPLATE_UPDATED,
          resourceType: 'email_template',
          resourceId: id,
          details: { changes },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }, trx);
      }

      return await this.getTemplateById(id, context.organizationId!, trx);
    });

    logger.info('Email template updated', {
      templateId: id,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getTemplates(filters: EmailTemplateFilters, organizationId: string): Promise<EmailTemplateList> {
    const validated = await EmailTemplateFilters.parseAsync(filters);
    
    const { page = 1, limit = 20, ...filterParams } = validated;
    const offset = (page - 1) * limit;

    let query = db
      .selectFrom('email_templates')
      .select([
        'id',
        'organization_id as organizationId',
        'name',
        'subject',
        'is_active as isActive',
        'category',
        'description',
        'usage_count as usageCount',
        'last_used_at as lastUsedAt',
        'created_at as createdAt',
        'updated_at as updatedAt',
      ])
      .where('organization_id', '=', organizationId)
      .where('deleted_at', 'is', null);

    // Apply filters
    if (filterParams.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filterParams.search}%`),
          eb('description', 'ilike', `%${filterParams.search}%`),
          eb('subject', 'ilike', `%${filterParams.search}%`),
        ])
      );
    }

    if (filterParams.category) {
      query = query.where('category', '=', filterParams.category);
    }

    if (filterParams.isActive !== undefined) {
      query = query.where('is_active', '=', filterParams.isActive);
    }

    if (filterParams.createdAfter) {
      query = query.where('created_at', '>=', filterParams.createdAfter);
    }

    if (filterParams.createdBefore) {
      query = query.where('created_at', '<=', filterParams.createdBefore);
    }

    if (filterParams.hasUsage !== undefined) {
      if (filterParams.hasUsage) {
        query = query.where('usage_count', '>', 0);
      } else {
        query = query.where('usage_count', '=', 0);
      }
    }

    // Get total count
    const totalResult = await query.clearSelect().select(db.fn.count('id').as('count')).executeTakeFirst();
    const total = Number(totalResult?.count || 0);

    // Get paginated results
    const rows = await query
      .orderBy('usage_count', 'desc')
      .orderBy('updated_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    const templates = rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      subject: row.subject,
      isActive: row.isActive,
      category: row.category,
      description: row.description,
      usageCount: row.usageCount,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async renderTemplate(input: RenderEmailTemplateInput, organizationId: string): Promise<RenderedEmailTemplate> {
    const validated = await RenderEmailTemplateInput.parseAsync(input);

    const template = await this.getTemplateById(validated.templateId, organizationId);

    if (!template.isActive) {
      throw new AppError('Template is not active', 400);
    }

    // Check for missing required variables
    const providedVariables = Object.keys(validated.variables);
    const requiredVariables = template.variables.filter(v => v.required).map(v => v.name);
    const missingVariables = requiredVariables.filter(v => !providedVariables.includes(v));

    // Prepare variables with defaults
    const variablesWithDefaults = { ...validated.variables };
    for (const templateVar of template.variables) {
      if (!variablesWithDefaults[templateVar.name] && templateVar.defaultValue) {
        variablesWithDefaults[templateVar.name] = templateVar.defaultValue;
      }
    }

    let renderedSubject = '';
    let renderedHtml = '';
    let renderedText = '';

    // Render subject
    renderedSubject = this.replaceVariables(template.subject, variablesWithDefaults);

    // Render HTML content if requested
    if (validated.format === 'html' || validated.format === 'both') {
      renderedHtml = this.replaceVariables(template.htmlContent, variablesWithDefaults);
    }

    // Render text content if requested
    if (validated.format === 'text' || validated.format === 'both') {
      renderedText = template.textContent 
        ? this.replaceVariables(template.textContent, variablesWithDefaults)
        : '';
    }

    return {
      subject: renderedSubject,
      htmlContent: renderedHtml || undefined,
      textContent: renderedText || undefined,
      missingVariables,
    };
  }

  async testTemplate(input: TestEmailTemplateInput, context: RequestContext): Promise<void> {
    const validated = await TestEmailTemplateInput.parseAsync(input);

    // Render template
    const rendered = await this.renderTemplate({
      templateId: validated.templateId,
      variables: validated.variables,
      format: 'both',
    }, context.organizationId!);

    if (rendered.missingVariables.length > 0) {
      throw new AppError(
        `Missing required variables: ${rendered.missingVariables.join(', ')}`, 
        400
      );
    }

    // Send test email
    await emailOutboxService.enqueue({
      recipientEmail: validated.recipientEmail,
      recipientName: 'Test Recipient',
      subject: `[TEST] ${rendered.subject}`,
      htmlContent: rendered.htmlContent,
      textContent: rendered.textContent,
      organizationId: context.organizationId!,
    });

    // Log audit
    await auditService.log({
      organizationId: context.organizationId!,
      userId: context.userId,
      action: AuditAction.EMAIL_TEMPLATE_TESTED,
      resourceType: 'email_template',
      resourceId: validated.templateId,
      details: {
        recipientEmail: validated.recipientEmail,
        variableCount: Object.keys(validated.variables).length,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info('Email template tested', {
      templateId: validated.templateId,
      recipientEmail: validated.recipientEmail,
      organizationId: context.organizationId,
      userId: context.userId
    });
  }

  async getTemplateStats(organizationId: string): Promise<EmailTemplateStats> {
    const [
      totalResult,
      activeResult,
      categoryStats,
      mostUsedTemplates,
      recentTemplates,
    ] = await Promise.all([
      // Total templates
      db
        .selectFrom('email_templates')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Active templates
      db
        .selectFrom('email_templates')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('is_active', '=', true)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Templates by category
      db
        .selectFrom('email_templates')
        .select(['category', db.fn.count('id').as('count')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('category')
        .execute(),

      // Most used templates
      db
        .selectFrom('email_templates')
        .select(['id', 'name', 'usage_count'])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('usage_count', '>', 0)
        .orderBy('usage_count', 'desc')
        .limit(10)
        .execute(),

      // Recently created templates
      db
        .selectFrom('email_templates')
        .select(['id', 'name', 'created_at'])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .orderBy('created_at', 'desc')
        .limit(5)
        .execute(),
    ]);

    const byCategory = categoryStats.reduce((acc, row) => {
      acc[row.category] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total: Number(totalResult?.count || 0),
      active: Number(activeResult?.count || 0),
      byCategory,
      mostUsed: mostUsedTemplates.map(t => ({
        id: t.id,
        name: t.name,
        usageCount: t.usage_count,
      })),
      recentlyCreated: recentTemplates.map(t => ({
        id: t.id,
        name: t.name,
        createdAt: t.created_at,
      })),
    };
  }

  async validateTemplateVariables(input: ValidateTemplateVariablesInput): Promise<TemplateValidationResult> {
    const validated = await ValidateTemplateVariablesInput.parseAsync(input);

    return this.validateTemplateContent(
      validated.templateContent,
      '',
      validated.templateContent,
      validated.declaredVariables
    );
  }

  async deleteTemplate(id: string, organizationId: string, context: RequestContext): Promise<void> {
    await withTransaction(async (trx) => {
      // Check if template exists
      const template = await trx
        .selectFrom('email_templates')
        .select(['id', 'name', 'usage_count'])
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!template) {
        throw new AppError('Email template not found', 404);
      }

      // Check if template is in use
      if (template.usage_count > 0) {
        throw new AppError('Cannot delete template that has been used. Deactivate it instead.', 400);
      }

      // Soft delete
      const now = new Date().toISOString();
      await trx
        .updateTable('email_templates')
        .set({ deleted_at: now })
        .where('id', '=', id)
        .execute();

      // Delete template variables
      await trx
        .deleteFrom('email_template_variables')
        .where('template_id', '=', id)
        .execute();

      // Log audit
      await auditService.log({
        organizationId,
        userId: context.userId,
        action: AuditAction.EMAIL_TEMPLATE_DELETED,
        resourceType: 'email_template',
        resourceId: id,
        details: { templateName: template.name },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Email template deleted', {
      templateId: id,
      organizationId,
      userId: context.userId
    });
  }

  async incrementUsageCount(templateId: string, organizationId: string, trx?: Transaction<any>): Promise<void> {
    await (trx || db)
      .updateTable('email_templates')
      .set({
        usage_count: db.fn('usage_count', ['+', 1]),
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', templateId)
      .where('organization_id', '=', organizationId)
      .where('deleted_at', 'is', null)
      .execute();
  }

  private replaceVariables(content: string, variables: Record<string, any>): string {
    return content.replace(this.VARIABLE_REGEX, (match, variableName) => {
      const value = variables[variableName];
      return value !== undefined ? String(value) : match;
    });
  }

  private async validateTemplateContent(
    htmlContent: string,
    textContent: string,
    subject: string,
    declaredVariables: any[]
  ): Promise<TemplateValidationResult> {
    const errors: Array<{ type: 'syntax' | 'variable' | 'logic', message: string, line?: number, column?: number }> = [];
    
    // Find all variables used in content
    const foundVariables = new Set<string>();
    
    // Find variables in HTML content
    const htmlMatches = htmlContent.matchAll(this.VARIABLE_REGEX);
    for (const match of htmlMatches) {
      foundVariables.add(match[1]);
    }

    // Find variables in text content
    const textMatches = textContent.matchAll(this.VARIABLE_REGEX);
    for (const match of textMatches) {
      foundVariables.add(match[1]);
    }

    // Find variables in subject
    const subjectMatches = subject.matchAll(this.VARIABLE_REGEX);
    for (const match of subjectMatches) {
      foundVariables.add(match[1]);
    }

    const foundVariablesList = Array.from(foundVariables);
    const declaredVariableNames = declaredVariables.map(v => v.name);

    // Check for used but undeclared variables
    const missingDeclarations = foundVariablesList.filter(v => !declaredVariableNames.includes(v));
    
    // Check for declared but unused variables  
    const unusedDeclarations = declaredVariableNames.filter(v => !foundVariablesList.includes(v));

    // Add errors for missing declarations
    for (const variable of missingDeclarations) {
      errors.push({
        type: 'variable',
        message: `Variable '${variable}' is used but not declared`,
      });
    }

    // Basic HTML validation
    if (htmlContent) {
      // Check for unclosed tags (basic validation)
      const openTags = (htmlContent.match(/<[^/>][^>]*>/g) || []).length;
      const closeTags = (htmlContent.match(/<\/[^>]+>/g) || []).length;
      const selfClosingTags = (htmlContent.match(/<[^>]*\/>/g) || []).length;
      
      if (openTags !== closeTags + selfClosingTags) {
        errors.push({
          type: 'syntax',
          message: 'HTML content may have unclosed tags',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      foundVariables: foundVariablesList,
      missingDeclarations,
      unusedDeclarations,
      errors,
    };
  }
}

export const emailTemplateService = new EmailTemplateService();