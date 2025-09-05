import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server
  PORT: parseInt(process.env.PORT || '3001'),
  HOST: process.env.HOST || 'localhost',
  
  // Database
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5434'),
    user: process.env.POSTGRES_USER || 'nourx',
    password: process.env.POSTGRES_PASSWORD || 'nourx_dev_password',
    database: process.env.POSTGRES_DB || 'nourx_app',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Authentication
  auth: {
    secret: process.env.BETTER_AUTH_SECRET || 'your-32-character-secret-key-here',
    baseUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    },
    from: {
      name: process.env.SMTP_FROM_NAME || 'Nourx Support',
      email: process.env.SMTP_FROM_EMAIL || 'support@nourx.com',
    },
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  // Logging
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    path: process.env.UPLOAD_PATH || './storage/uploads',
  },

  // Security
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDurationMs: parseInt(process.env.LOCKOUT_DURATION_MS || '1800000'), // 30 minutes
  },

  // SLA
  sla: {
    defaultResponseHours: parseInt(process.env.DEFAULT_TICKET_SLA_RESPONSE || '8'),
    defaultResolutionHours: parseInt(process.env.DEFAULT_TICKET_SLA_RESOLUTION || '48'),
  },

  // Redis Cache
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    ttlDefault: parseInt(process.env.REDIS_TTL_DEFAULT || '3600'),
  },

  // AWS S3 Storage
  s3: {
    region: process.env.AWS_REGION || 'eu-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    buckets: {
      documents: process.env.S3_BUCKET_DOCUMENTS || 'nourx-dev-documents',
      deliverables: process.env.S3_BUCKET_DELIVERABLES || 'nourx-dev-deliverables',
      backups: process.env.S3_BUCKET_BACKUPS || 'nourx-dev-backups',
    },
    presignedUrlExpiry: parseInt(process.env.S3_PRESIGNED_URL_EXPIRY || '3600'),
  },

  // Backup System
  backup: {
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    path: process.env.BACKUP_PATH || './backups',
    s3Enabled: process.env.BACKUP_S3_ENABLED === 'true',
    cronSchedule: process.env.BACKUP_CRON_SCHEDULE || '0 2 * * *',
  },

  // Storage Configuration
  storage: {
    provider: process.env.STORAGE_PROVIDER as 'local' | 's3' || 'local',
    fallback: process.env.STORAGE_FALLBACK === 'true',
    basePath: process.env.FILE_STORAGE_PATH || './storage',
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3001/api/files',
  },

  // Monitoring & Observability
  monitoring: {
    enabled: process.env.METRICS_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN || '',
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  },

  // Health Checks
  healthCheck: {
    dbTimeout: parseInt(process.env.HEALTH_CHECK_DB_TIMEOUT || '5000'),
    redisTimeout: parseInt(process.env.HEALTH_CHECK_REDIS_TIMEOUT || '3000'),
  },

  // Default Admin (for initialization)
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@nourx.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123!',
    name: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
  },
} as const;

export default config;
