import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { createApp } from '@/app';
import { Express } from 'express';

// Charger les variables d'environnement de test
config({ path: '.env.test' });

let app: Express;
let testDbPool: Pool;

beforeAll(async () => {
  console.log('🧪 Setting up E2E test environment...');

  // Créer l'application Express pour les tests
  app = createApp();

  // Créer le pool de connexions pour les tests
  testDbPool = new Pool({
    host: process.env.POSTGRES_TEST_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_TEST_PORT || '5433'),
    user: process.env.POSTGRES_TEST_USER || 'nourx_test',
    password: process.env.POSTGRES_TEST_PASSWORD || 'test_password',
    database: process.env.POSTGRES_TEST_DB || 'nourx_app_test',
  });

  // Tester la connexion
  try {
    await testDbPool.query('SELECT NOW()');
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...');
  
  if (testDbPool) {
    await testDbPool.end();
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  // Cette approche est simple mais pour des tests plus complexes,
  // on pourrait utiliser des transactions ou truncate
});

afterEach(async () => {
  // Clean up après chaque test si nécessaire
});

// Export pour utilisation dans les tests
export { app, testDbPool };