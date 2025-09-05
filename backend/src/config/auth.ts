import { betterAuth } from 'better-auth';
import { pool } from '@/config/database';
import { PostgresDialect } from 'kysely';

// Dev-only minimal Better Auth config without DB adapter.
// Accepts any email with password 'password' and assigns role by email.
export const auth: any = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-key-change-in-production',
  // Allow requests coming from the frontend origin (Next.js) and the backend itself (useful in dev)
  trustedOrigins: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  ],
  // Branché sur Postgres via pool; Better Auth gère sa propre schema (users/accounts/sessions)
  database: {
    dialect: new PostgresDialect({ pool }) as any,
    type: 'postgres' as any,
  } as any,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Optionnel: auto sign-in après sign-up
    autoSignIn: true,
  },
  session: {
    // Stockage en DB par défaut; cookie cache activé
    cookieCache: { enabled: true, maxAge: 60 * 60 * 24 * 7 },
  },
} as any);

export type Auth = typeof auth;
