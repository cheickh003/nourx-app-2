import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  RegisterSchema,
  CreateOrganizationSchema,
  CreateUserClientSchema,
  CreateTicketSchema,
  PaginationParamsSchema,
  validateEmail,
  validateUUID,
  createPasswordSchema,
} from '@nourx/shared';

describe('Shared Schemas Validation', () => {
  describe('Auth Schemas', () => {
    describe('LoginSchema', () => {
      it('should validate correct login data', () => {
        const validLogin = {
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        };

        const result = LoginSchema.safeParse(validLogin);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.email).toBe('test@example.com');
          expect(result.data.rememberMe).toBe(true);
        }
      });

      it('should reject invalid email', () => {
        const invalidLogin = {
          email: 'not-an-email',
          password: 'password123',
        };

        const result = LoginSchema.safeParse(invalidLogin);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('email');
        }
      });

      it('should normalize email to lowercase', () => {
        const login = {
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
        };

        const result = LoginSchema.safeParse(login);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.email).toBe('test@example.com');
        }
      });

      it('should default rememberMe to false', () => {
        const login = {
          email: 'test@example.com',
          password: 'password123',
        };

        const result = LoginSchema.safeParse(login);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.rememberMe).toBe(false);
        }
      });
    });

    describe('RegisterSchema', () => {
      it('should validate strong password', () => {
        const validRegister = {
          email: 'test@example.com',
          password: 'StrongP@ssw0rd',
          name: 'John Doe',
        };

        const result = RegisterSchema.safeParse(validRegister);
        expect(result.success).toBe(true);
      });

      it('should reject weak password', () => {
        const invalidRegister = {
          email: 'test@example.com',
          password: 'weak',
          name: 'John Doe',
        };

        const result = RegisterSchema.safeParse(invalidRegister);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const passwordError = result.error.issues.find(issue => issue.path.includes('password'));
          expect(passwordError).toBeDefined();
        }
      });

      it('should reject short name', () => {
        const invalidRegister = {
          email: 'test@example.com',
          password: 'StrongP@ssw0rd',
          name: 'A',
        };

        const result = RegisterSchema.safeParse(invalidRegister);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Organization Schemas', () => {
    describe('CreateOrganizationSchema', () => {
      it('should validate correct organization data', () => {
        const validOrg = {
          name: 'Test Company',
          siret: '12345678901234',
          address: '123 Test Street, Test City',
          contactEmail: 'contact@testcompany.com',
          contactPhone: '+33123456789',
        };

        const result = CreateOrganizationSchema.safeParse(validOrg);
        expect(result.success).toBe(true);
      });

      it('should reject invalid SIRET', () => {
        const invalidOrg = {
          name: 'Test Company',
          siret: '123', // Too short
        };

        const result = CreateOrganizationSchema.safeParse(invalidOrg);
        expect(result.success).toBe(false);
      });

      it('should accept empty SIRET', () => {
        const validOrg = {
          name: 'Test Company',
          siret: '',
        };

        const result = CreateOrganizationSchema.safeParse(validOrg);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email format', () => {
        const invalidOrg = {
          name: 'Test Company',
          contactEmail: 'not-an-email',
        };

        const result = CreateOrganizationSchema.safeParse(invalidOrg);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('User Schemas', () => {
    describe('CreateUserClientSchema', () => {
      it('should validate correct client user data', () => {
        const validUser = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'reader' as const,
          sendInvitation: true,
        };

        const result = CreateUserClientSchema.safeParse(validUser);
        expect(result.success).toBe(true);
      });

      it('should reject invalid organization ID', () => {
        const invalidUser = {
          organizationId: 'not-a-uuid',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'reader' as const,
        };

        const result = CreateUserClientSchema.safeParse(invalidUser);
        expect(result.success).toBe(false);
      });

      it('should default sendInvitation to true', () => {
        const user = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'reader' as const,
        };

        const result = CreateUserClientSchema.safeParse(user);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.sendInvitation).toBe(true);
        }
      });
    });
  });

  describe('Ticket Schemas', () => {
    describe('CreateTicketSchema', () => {
      it('should validate correct ticket data', () => {
        const validTicket = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test ticket title',
          description: 'This is a test ticket description with enough content.',
          priority: 'high' as const,
        };

        const result = CreateTicketSchema.safeParse(validTicket);
        expect(result.success).toBe(true);
      });

      it('should reject short title', () => {
        const invalidTicket = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Short',
          description: 'This is a test ticket description with enough content.',
        };

        const result = CreateTicketSchema.safeParse(invalidTicket);
        expect(result.success).toBe(false);
      });

      it('should reject short description', () => {
        const invalidTicket = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Valid title',
          description: 'Too short',
        };

        const result = CreateTicketSchema.safeParse(invalidTicket);
        expect(result.success).toBe(false);
      });

      it('should default priority to medium', () => {
        const ticket = {
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test ticket title',
          description: 'This is a test ticket description with enough content.',
        };

        const result = CreateTicketSchema.safeParse(ticket);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.priority).toBe('medium');
        }
      });
    });
  });

  describe('Validation Utils', () => {
    describe('PaginationParamsSchema', () => {
      it('should validate correct pagination params', () => {
        const validPagination = {
          page: 2,
          limit: 50,
        };

        const result = PaginationParamsSchema.safeParse(validPagination);
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.page).toBe(2);
          expect(result.data.limit).toBe(50);
        }
      });

      it('should use default values', () => {
        const result = PaginationParamsSchema.safeParse({});
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it('should reject invalid page number', () => {
        const invalidPagination = {
          page: 0,
        };

        const result = PaginationParamsSchema.safeParse(invalidPagination);
        expect(result.success).toBe(false);
      });

      it('should reject limit too high', () => {
        const invalidPagination = {
          limit: 101,
        };

        const result = PaginationParamsSchema.safeParse(invalidPagination);
        expect(result.success).toBe(false);
      });
    });

    describe('validateEmail', () => {
      it('should validate correct emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(validateEmail('not-an-email')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
      });
    });

    describe('validateUUID', () => {
      it('should validate correct UUIDs', () => {
        expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        expect(validateUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
      });

      it('should reject invalid UUIDs', () => {
        expect(validateUUID('not-a-uuid')).toBe(false);
        expect(validateUUID('123-456-789')).toBe(false);
        expect(validateUUID('')).toBe(false);
      });
    });

    describe('createPasswordSchema', () => {
      it('should create schema with default requirements', () => {
        const schema = createPasswordSchema();
        
        expect(schema.safeParse('StrongP@ssw0rd').success).toBe(true);
        expect(schema.safeParse('weak').success).toBe(false);
        expect(schema.safeParse('nouppercase1@').success).toBe(false);
        expect(schema.safeParse('NOLOWERCASE1@').success).toBe(false);
        expect(schema.safeParse('NoNumbers@').success).toBe(false);
        expect(schema.safeParse('NoSpecialChars1').success).toBe(false);
      });

      it('should create schema with custom requirements', () => {
        const schema = createPasswordSchema({
          minLength: 6,
          requireSpecialChars: false,
        });
        
        expect(schema.safeParse('Simple1').success).toBe(true);
        expect(schema.safeParse('short').success).toBe(false);
      });
    });
  });
});