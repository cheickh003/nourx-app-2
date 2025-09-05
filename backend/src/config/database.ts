import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from '@/types/database';
import { config } from './index';

// Pool de connexions PostgreSQL
export const pool = new Pool(config.database);

// Instance Kysely
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});

// Test de connexion
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Test simple de connectivité (indépendant du schéma)
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    // 3D000 = database does not exist
    const code = (error as any)?.code;
    if (code === '3D000') {
      console.warn(`Database "${config.database.database}" not found. Attempting to create it...`);
      try {
        await ensureDatabaseExists();
        // Retester la connectivité
        await pool.query('SELECT 1');
        console.info(`Database "${config.database.database}" created and connection successful.`);
        return true;
      } catch (createErr) {
        console.error('Failed to create database:', createErr);
        return false;
      }
    }

    console.error('Database connection test failed:', error);
    return false;
  }
}

// Fermeture propre de la base de données
export async function closeDatabaseConnection(): Promise<void> {
  await db.destroy();
  await pool.end();
}

// Helper pour les transactions
export const withTransaction = async <T>(
  callback: (trx: Kysely<Database>) => Promise<T>
): Promise<T> => {
  return await db.transaction().execute(callback);
};

export default db;

// Assure l'existence de la base de données de l'application en se connectant à la DB "postgres"
async function ensureDatabaseExists(): Promise<void> {
  const { host, port, user, password, database } = config.database as any;
  const adminPool = new Pool({ host, port, user, password, database: 'postgres' });
  try {
    const check = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (check.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await adminPool.end();
  }
}
