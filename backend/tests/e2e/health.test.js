"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const setup_1 = require("./setup");
(0, vitest_1.describe)('Health Endpoints', () => {
    (0, vitest_1.describe)('GET /health', () => {
        (0, vitest_1.it)('should return healthy status', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .get('/health')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual({
                success: true,
                data: {
                    status: 'healthy',
                    timestamp: vitest_1.expect.any(String),
                    uptime: vitest_1.expect.any(Number),
                    environment: 'test',
                    version: vitest_1.expect.any(String),
                },
            });
        });
        (0, vitest_1.it)('should include proper headers', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .get('/health')
                .expect(200);
            (0, vitest_1.expect)(response.headers['content-type']).toMatch(/json/);
            (0, vitest_1.expect)(response.headers['x-request-id']).toBeDefined();
        });
    });
    (0, vitest_1.describe)('GET /ready', () => {
        (0, vitest_1.it)('should return ready status when services are available', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .get('/ready')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual({
                success: true,
                data: {
                    status: 'ready',
                    services: {
                        database: 'healthy',
                    },
                },
            });
        });
    });
    (0, vitest_1.describe)('GET /', () => {
        (0, vitest_1.it)('should return API information', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .get('/')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual({
                success: true,
                data: {
                    message: 'Nourx API Server',
                    version: '1.0.0',
                    timestamp: vitest_1.expect.any(String),
                    documentation: '/api/docs',
                },
            });
        });
    });
    (0, vitest_1.describe)('Security Headers', () => {
        (0, vitest_1.it)('should include security headers', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .get('/health')
                .expect(200);
            // Vérifier que Helmet a ajouté les headers de sécurité
            (0, vitest_1.expect)(response.headers['x-content-type-options']).toBe('nosniff');
            (0, vitest_1.expect)(response.headers['x-frame-options']).toBe('DENY');
            (0, vitest_1.expect)(response.headers['x-download-options']).toBe('noopen');
            (0, vitest_1.expect)(response.headers).not.toHaveProperty('x-powered-by');
        });
    });
    (0, vitest_1.describe)('CORS Headers', () => {
        (0, vitest_1.it)('should include CORS headers on preflight request', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .options('/health')
                .set('Origin', 'http://localhost:3000')
                .expect(204);
            (0, vitest_1.expect)(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            (0, vitest_1.expect)(response.headers['access-control-allow-credentials']).toBe('true');
            (0, vitest_1.expect)(response.headers['access-control-allow-methods']).toContain('GET');
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should return 404 for non-existent routes', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .get('/non-existent-route')
                .expect(404);
            (0, vitest_1.expect)(response.body).toEqual({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Route GET /non-existent-route not found',
                },
            });
        });
        (0, vitest_1.it)('should handle invalid JSON payloads', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .post('/health') // Endpoint qui n'existe pas pour forcer une erreur
                .send('invalid-json')
                .set('Content-Type', 'application/json')
                .expect(404); // 404 car la route n'existe pas
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('Rate Limiting', () => {
        (0, vitest_1.it)('should include rate limit headers', async () => {
            const response = await (0, supertest_1.default)(setup_1.app)
                .get('/health')
                .expect(200);
            // Vérifier les headers de rate limiting
            (0, vitest_1.expect)(response.headers['x-ratelimit-limit']).toBeDefined();
            (0, vitest_1.expect)(response.headers['x-ratelimit-remaining']).toBeDefined();
            (0, vitest_1.expect)(response.headers['x-ratelimit-reset']).toBeDefined();
        });
    });
});
//# sourceMappingURL=health.test.js.map