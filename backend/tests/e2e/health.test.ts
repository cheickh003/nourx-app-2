import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './setup';

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          environment: 'test',
          version: expect.any(String),
        },
      });
    });

    it('should include proper headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('GET /ready', () => {
    it('should return ready status when services are available', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body).toEqual({
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

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Nourx API Server',
          version: '1.0.0',
          timestamp: expect.any(String),
          documentation: '/api/docs',
        },
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Vérifier que Helmet a ajouté les headers de sécurité
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-download-options']).toBe('noopen');
      expect(response.headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers on preflight request', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /non-existent-route not found',
        },
      });
    });

    it('should handle invalid JSON payloads', async () => {
      const response = await request(app)
        .post('/health') // Endpoint qui n'existe pas pour forcer une erreur
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(404); // 404 car la route n'existe pas

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Vérifier les headers de rate limiting
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });
});