"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const shared_1 = require("@nourx/shared");
(0, vitest_1.describe)('Shared Schemas Validation', () => {
    (0, vitest_1.describe)('Auth Schemas', () => {
        (0, vitest_1.describe)('LoginSchema', () => {
            (0, vitest_1.it)('should validate correct login data', () => {
                const validLogin = {
                    email: 'test@example.com',
                    password: 'password123',
                    rememberMe: true,
                };
                const result = shared_1.LoginSchema.safeParse(validLogin);
                (0, vitest_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, vitest_1.expect)(result.data.email).toBe('test@example.com');
                    (0, vitest_1.expect)(result.data.rememberMe).toBe(true);
                }
            });
            (0, vitest_1.it)('should reject invalid email', () => {
                const invalidLogin = {
                    email: 'not-an-email',
                    password: 'password123',
                };
                const result = shared_1.LoginSchema.safeParse(invalidLogin);
                (0, vitest_1.expect)(result.success).toBe(false);
                if (!result.success) {
                    (0, vitest_1.expect)(result.error.issues[0]?.message).toContain('email');
                }
            });
            (0, vitest_1.it)('should normalize email to lowercase', () => {
                const login = {
                    email: 'TEST@EXAMPLE.COM',
                    password: 'password123',
                };
                const result = shared_1.LoginSchema.safeParse(login);
                (0, vitest_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, vitest_1.expect)(result.data.email).toBe('test@example.com');
                }
            });
            (0, vitest_1.it)('should default rememberMe to false', () => {
                const login = {
                    email: 'test@example.com',
                    password: 'password123',
                };
                const result = shared_1.LoginSchema.safeParse(login);
                (0, vitest_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, vitest_1.expect)(result.data.rememberMe).toBe(false);
                }
            });
        });
        (0, vitest_1.describe)('RegisterSchema', () => {
            (0, vitest_1.it)('should validate strong password', () => {
                const validRegister = {
                    email: 'test@example.com',
                    password: 'StrongP@ssw0rd',
                    name: 'John Doe',
                };
                const result = shared_1.RegisterSchema.safeParse(validRegister);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should reject weak password', () => {
                const invalidRegister = {
                    email: 'test@example.com',
                    password: 'weak',
                    name: 'John Doe',
                };
                const result = shared_1.RegisterSchema.safeParse(invalidRegister);
                (0, vitest_1.expect)(result.success).toBe(false);
                if (!result.success) {
                    const passwordError = result.error.issues.find(issue => issue.path.includes('password'));
                    (0, vitest_1.expect)(passwordError).toBeDefined();
                }
            });
            (0, vitest_1.it)('should reject short name', () => {
                const invalidRegister = {
                    email: 'test@example.com',
                    password: 'StrongP@ssw0rd',
                    name: 'A',
                };
                const result = shared_1.RegisterSchema.safeParse(invalidRegister);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('Organization Schemas', () => {
        (0, vitest_1.describe)('CreateOrganizationSchema', () => {
            (0, vitest_1.it)('should validate correct organization data', () => {
                const validOrg = {
                    name: 'Test Company',
                    siret: '12345678901234',
                    address: '123 Test Street, Test City',
                    contactEmail: 'contact@testcompany.com',
                    contactPhone: '+33123456789',
                };
                const result = shared_1.CreateOrganizationSchema.safeParse(validOrg);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should reject invalid SIRET', () => {
                const invalidOrg = {
                    name: 'Test Company',
                    siret: '123', // Too short
                };
                const result = shared_1.CreateOrganizationSchema.safeParse(invalidOrg);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
            (0, vitest_1.it)('should accept empty SIRET', () => {
                const validOrg = {
                    name: 'Test Company',
                    siret: '',
                };
                const result = shared_1.CreateOrganizationSchema.safeParse(validOrg);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should reject invalid email format', () => {
                const invalidOrg = {
                    name: 'Test Company',
                    contactEmail: 'not-an-email',
                };
                const result = shared_1.CreateOrganizationSchema.safeParse(invalidOrg);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('User Schemas', () => {
        (0, vitest_1.describe)('CreateUserClientSchema', () => {
            (0, vitest_1.it)('should validate correct client user data', () => {
                const validUser = {
                    organizationId: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'user@example.com',
                    name: 'John Doe',
                    role: 'reader',
                    sendInvitation: true,
                };
                const result = shared_1.CreateUserClientSchema.safeParse(validUser);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should reject invalid organization ID', () => {
                const invalidUser = {
                    organizationId: 'not-a-uuid',
                    email: 'user@example.com',
                    name: 'John Doe',
                    role: 'reader',
                };
                const result = shared_1.CreateUserClientSchema.safeParse(invalidUser);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
            (0, vitest_1.it)('should default sendInvitation to true', () => {
                const user = {
                    organizationId: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'user@example.com',
                    name: 'John Doe',
                    role: 'reader',
                };
                const result = shared_1.CreateUserClientSchema.safeParse(user);
                (0, vitest_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, vitest_1.expect)(result.data.sendInvitation).toBe(true);
                }
            });
        });
    });
    (0, vitest_1.describe)('Ticket Schemas', () => {
        (0, vitest_1.describe)('CreateTicketSchema', () => {
            (0, vitest_1.it)('should validate correct ticket data', () => {
                const validTicket = {
                    organizationId: '123e4567-e89b-12d3-a456-426614174000',
                    title: 'Test ticket title',
                    description: 'This is a test ticket description with enough content.',
                    priority: 'high',
                };
                const result = shared_1.CreateTicketSchema.safeParse(validTicket);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should reject short title', () => {
                const invalidTicket = {
                    organizationId: '123e4567-e89b-12d3-a456-426614174000',
                    title: 'Short',
                    description: 'This is a test ticket description with enough content.',
                };
                const result = shared_1.CreateTicketSchema.safeParse(invalidTicket);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
            (0, vitest_1.it)('should reject short description', () => {
                const invalidTicket = {
                    organizationId: '123e4567-e89b-12d3-a456-426614174000',
                    title: 'Valid title',
                    description: 'Too short',
                };
                const result = shared_1.CreateTicketSchema.safeParse(invalidTicket);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
            (0, vitest_1.it)('should default priority to medium', () => {
                const ticket = {
                    organizationId: '123e4567-e89b-12d3-a456-426614174000',
                    title: 'Test ticket title',
                    description: 'This is a test ticket description with enough content.',
                };
                const result = shared_1.CreateTicketSchema.safeParse(ticket);
                (0, vitest_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, vitest_1.expect)(result.data.priority).toBe('medium');
                }
            });
        });
    });
    (0, vitest_1.describe)('Validation Utils', () => {
        (0, vitest_1.describe)('PaginationParamsSchema', () => {
            (0, vitest_1.it)('should validate correct pagination params', () => {
                const validPagination = {
                    page: 2,
                    limit: 50,
                };
                const result = shared_1.PaginationParamsSchema.safeParse(validPagination);
                (0, vitest_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, vitest_1.expect)(result.data.page).toBe(2);
                    (0, vitest_1.expect)(result.data.limit).toBe(50);
                }
            });
            (0, vitest_1.it)('should use default values', () => {
                const result = shared_1.PaginationParamsSchema.safeParse({});
                (0, vitest_1.expect)(result.success).toBe(true);
                if (result.success) {
                    (0, vitest_1.expect)(result.data.page).toBe(1);
                    (0, vitest_1.expect)(result.data.limit).toBe(20);
                }
            });
            (0, vitest_1.it)('should reject invalid page number', () => {
                const invalidPagination = {
                    page: 0,
                };
                const result = shared_1.PaginationParamsSchema.safeParse(invalidPagination);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
            (0, vitest_1.it)('should reject limit too high', () => {
                const invalidPagination = {
                    limit: 101,
                };
                const result = shared_1.PaginationParamsSchema.safeParse(invalidPagination);
                (0, vitest_1.expect)(result.success).toBe(false);
            });
        });
        (0, vitest_1.describe)('validateEmail', () => {
            (0, vitest_1.it)('should validate correct emails', () => {
                (0, vitest_1.expect)((0, shared_1.validateEmail)('test@example.com')).toBe(true);
                (0, vitest_1.expect)((0, shared_1.validateEmail)('user.name+tag@example.co.uk')).toBe(true);
            });
            (0, vitest_1.it)('should reject invalid emails', () => {
                (0, vitest_1.expect)((0, shared_1.validateEmail)('not-an-email')).toBe(false);
                (0, vitest_1.expect)((0, shared_1.validateEmail)('@example.com')).toBe(false);
                (0, vitest_1.expect)((0, shared_1.validateEmail)('test@')).toBe(false);
            });
        });
        (0, vitest_1.describe)('validateUUID', () => {
            (0, vitest_1.it)('should validate correct UUIDs', () => {
                (0, vitest_1.expect)((0, shared_1.validateUUID)('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
                (0, vitest_1.expect)((0, shared_1.validateUUID)('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
            });
            (0, vitest_1.it)('should reject invalid UUIDs', () => {
                (0, vitest_1.expect)((0, shared_1.validateUUID)('not-a-uuid')).toBe(false);
                (0, vitest_1.expect)((0, shared_1.validateUUID)('123-456-789')).toBe(false);
                (0, vitest_1.expect)((0, shared_1.validateUUID)('')).toBe(false);
            });
        });
        (0, vitest_1.describe)('createPasswordSchema', () => {
            (0, vitest_1.it)('should create schema with default requirements', () => {
                const schema = (0, shared_1.createPasswordSchema)();
                (0, vitest_1.expect)(schema.safeParse('StrongP@ssw0rd').success).toBe(true);
                (0, vitest_1.expect)(schema.safeParse('weak').success).toBe(false);
                (0, vitest_1.expect)(schema.safeParse('nouppercase1@').success).toBe(false);
                (0, vitest_1.expect)(schema.safeParse('NOLOWERCASE1@').success).toBe(false);
                (0, vitest_1.expect)(schema.safeParse('NoNumbers@').success).toBe(false);
                (0, vitest_1.expect)(schema.safeParse('NoSpecialChars1').success).toBe(false);
            });
            (0, vitest_1.it)('should create schema with custom requirements', () => {
                const schema = (0, shared_1.createPasswordSchema)({
                    minLength: 6,
                    requireSpecialChars: false,
                });
                (0, vitest_1.expect)(schema.safeParse('Simple1').success).toBe(true);
                (0, vitest_1.expect)(schema.safeParse('short').success).toBe(false);
            });
        });
    });
});
//# sourceMappingURL=schemas.test.js.map