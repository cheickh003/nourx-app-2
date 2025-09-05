"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDbPool = exports.app = void 0;
const vitest_1 = require("vitest");
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
const app_1 = require("@/app");
// Charger les variables d'environnement de test
(0, dotenv_1.config)({ path: '.env.test' });
let app;
let testDbPool;
(0, vitest_1.beforeAll)(async () => {
    console.log('🧪 Setting up E2E test environment...');
    // Créer l'application Express pour les tests
    exports.app = app = (0, app_1.createApp)();
    // Créer le pool de connexions pour les tests
    exports.testDbPool = testDbPool = new pg_1.Pool({
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
    }
    catch (error) {
        console.error('❌ Failed to connect to test database:', error);
        throw error;
    }
});
(0, vitest_1.afterAll)(async () => {
    console.log('🧹 Cleaning up E2E test environment...');
    if (testDbPool) {
        await testDbPool.end();
    }
});
(0, vitest_1.beforeEach)(async () => {
    // Clean up test data before each test
    // Cette approche est simple mais pour des tests plus complexes,
    // on pourrait utiliser des transactions ou truncate
});
(0, vitest_1.afterEach)(async () => {
    // Clean up après chaque test si nécessaire
});
//# sourceMappingURL=setup.js.map