import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { db } from '@/config/database';
import { config } from '@/config';
import logger from '@/lib/logger';

export const auth = betterAuth({
  baseURL: config.auth.baseUrl,
  secret: config.auth.secret,
  
  // Configuration de la base de données avec Kysely (built-in support)
  database: db,

  // Configuration des sessions
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes de cache
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // Mise à jour quotidienne
  },

  // Configuration des cookies
  cookies: {
    prefix: 'nourx-auth',
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
  },

  // Configuration de l'authentification email/password
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url, token }) => {
      // Ici on utilisera notre service d'email pour envoyer le lien de reset
      logger.info('Password reset requested', { 
        userId: user.id, 
        email: user.email 
      });
      
      // TODO: Intégrer avec notre service d'email
      // await emailService.sendPasswordReset(user.email, user.name, url);
    },
    sendVerificationEmail: async ({ user, url, token }) => {
      // Ici on utilisera notre service d'email pour l'activation
      logger.info('Email verification requested', { 
        userId: user.id, 
        email: user.email 
      });
      
      // TODO: Intégrer avec notre service d'email  
      // await emailService.sendAccountActivation(user.email, user.name, url);
    },
  },

  // Configuration des rôles et permissions
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        input: true,
        output: true,
      },
      organizationId: {
        type: 'string',
        required: false,
        input: true,
        output: true,
      },
      isActive: {
        type: 'boolean',
        required: false,
        input: false,
        output: true,
      },
      lastLoginAt: {
        type: 'date',
        required: false,
        input: false,
        output: true,
      },
      failedLoginAttempts: {
        type: 'number',
        required: false,
        input: false,
        output: false,
      },
      lockedUntil: {
        type: 'date',
        required: false,
        input: false,
        output: false,
      },
    },
  },

  // Plugins
  plugins: [
    admin({
      adminUserId: async () => {
        // Récupérer l'ID du premier admin depuis la DB
        const adminUser = await db
          .selectFrom('user_admin')
          .select('id')
          .where('role', '=', 'admin')
          .where('is_active', '=', true)
          .executeTakeFirst();
        
        return adminUser?.id;
      },
    }),
  ],

  // Gestion des erreurs
  logger: {
    level: config.log.level as 'debug' | 'info' | 'warn' | 'error',
    log: (level, message, data) => {
      logger[level](message, data);
    },
  },

  // Hooks pour personnaliser le comportement
  hooks: {
    after: [
      {
        matcher: (ctx) => ctx.path === '/sign-in',
        handler: async (ctx) => {
          // Mettre à jour last_login_at et réinitialiser failed_attempts
          if (ctx.context.returned && ctx.context.user) {
            const userId = ctx.context.user.id;
            
            // Déterminer si c'est un admin ou un client
            const adminUser = await db
              .selectFrom('user_admin')
              .select('id')
              .where('id', '=', userId)
              .executeTakeFirst();

            if (adminUser) {
              await db
                .updateTable('user_admin')
                .set({
                  last_login_at: new Date(),
                  failed_login_attempts: 0,
                  locked_until: null,
                })
                .where('id', '=', userId)
                .execute();
            } else {
              await db
                .updateTable('user_client')
                .set({
                  last_login_at: new Date(),
                  failed_login_attempts: 0,
                  locked_until: null,
                })
                .where('id', '=', userId)
                .execute();
            }

            logger.info('User signed in successfully', { userId });
          }
        },
      },
      {
        matcher: (ctx) => ctx.path === '/sign-in' && ctx.context.returned?.error,
        handler: async (ctx) => {
          // Gérer les tentatives de connexion échouées
          const email = ctx.body?.email;
          
          if (email && typeof email === 'string') {
            // Chercher dans les deux tables
            const adminUser = await db
              .selectFrom('user_admin')
              .select(['id', 'failed_login_attempts', 'locked_until'])
              .where('email', '=', email)
              .executeTakeFirst();

            const clientUser = await db
              .selectFrom('user_client')
              .select(['id', 'failed_login_attempts', 'locked_until'])
              .where('email', '=', email)
              .executeTakeFirst();

            const user = adminUser || clientUser;
            const table = adminUser ? 'user_admin' : 'user_client';

            if (user) {
              const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
              const maxAttempts = config.security.maxLoginAttempts;

              let updateData: any = {
                failed_login_attempts: newFailedAttempts,
              };

              // Verrouiller le compte si trop de tentatives
              if (newFailedAttempts >= maxAttempts) {
                updateData.locked_until = new Date(
                  Date.now() + config.security.lockoutDurationMs
                );
              }

              await db
                .updateTable(table as any)
                .set(updateData)
                .where('id', '=', user.id)
                .execute();

              logger.warn('Failed login attempt', { 
                userId: user.id, 
                email, 
                attempts: newFailedAttempts,
                locked: newFailedAttempts >= maxAttempts,
              });
            }
          }
        },
      },
    ],
  },

  // Configuration avancée
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: config.NODE_ENV === 'production',
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
});

export default auth;

