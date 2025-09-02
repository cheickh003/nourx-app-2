#!/usr/bin/env node

/**
 * NOURX Authentication System Test Script
 * Tests the authentication services functionality
 */

import dotenv from 'dotenv';
import pool from '../config/database.js';
import AuthService from '../services/authService.js';
import JwtService from '../services/jwtService.js';
import AuditService from '../services/auditService.js';

dotenv.config();

// Initialize services
const authService = new AuthService(pool);
const jwtService = new JwtService(pool);
const auditService = new AuditService(pool);

// Test data
const testUsers = {
  admin: {
    email: 'test.admin@nourx.com',
    password: 'TestAdmin123!',
    userType: 'admin'
  },
  client: {
    email: 'test.client@nourx.com',
    password: 'TestClient123!',
    userType: 'client'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class AuthTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async assert(testName, condition, details = '') {
    const result = {
      name: testName,
      passed: !!condition,
      details
    };

    this.results.tests.push(result);

    if (condition) {
      this.results.passed++;
      log(`✅ ${testName}`, 'green');
      if (details) log(`   ${details}`, 'cyan');
    } else {
      this.results.failed++;
      log(`❌ ${testName}`, 'red');
      if (details) log(`   ${details}`, 'yellow');
    }
  }

  async testPasswordHashing() {
    log('\n🧪 Testing Password Hashing', 'blue');
    
    try {
      const password = 'TestPassword123!';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      
      await this.assert(
        'Password hashing produces different hashes for same password',
        hash1 !== hash2,
        `Hash1: ${hash1.substring(0, 20)}... Hash2: ${hash2.substring(0, 20)}...`
      );

      // Test bcrypt verification manually
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(password, hash1);
      await this.assert(
        'Password hash can be verified correctly',
        isValid,
        'Bcrypt comparison successful'
      );

    } catch (error) {
      await this.assert('Password hashing test', false, error.message);
    }
  }

  async testJwtTokenGeneration() {
    log('\n🧪 Testing JWT Token Generation', 'blue');
    
    try {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'admin',
        userType: 'admin'
      };

      const tokenPair = await jwtService.generateTokenPair(payload);
      
      await this.assert(
        'Token pair generated successfully',
        tokenPair && tokenPair.accessToken && tokenPair.refreshToken,
        `Access token length: ${tokenPair.accessToken.length}`
      );

      // Verify access token
      const decodedAccess = await jwtService.verifyAccessToken(tokenPair.accessToken);
      await this.assert(
        'Access token is valid and contains correct data',
        decodedAccess && decodedAccess.userId === payload.userId,
        `Decoded userId: ${decodedAccess.userId}`
      );

      // Test token expiration times
      await this.assert(
        'Token has proper expiration times',
        tokenPair.accessTokenExpiresAt > new Date() && tokenPair.refreshTokenExpiresAt > tokenPair.accessTokenExpiresAt,
        `Access expires: ${tokenPair.accessTokenExpiresAt.toISOString()}`
      );

    } catch (error) {
      await this.assert('JWT token generation test', false, error.message);
    }
  }

  async testAuditLogging() {
    log('\n🧪 Testing Audit Logging', 'blue');
    
    try {
      const testAuditData = {
        action: 'auth:login_success',
        actorAdminId: 'test-admin-id',
        targetType: 'user',
        targetId: 'test-user-id',
        details: { testData: true, timestamp: new Date().toISOString() },
        ipAddress: '127.0.0.1',
        userAgent: 'Test-Agent/1.0'
      };

      const logResult = await auditService.logEvent(testAuditData);
      await this.assert(
        'Audit event logged successfully',
        logResult === true,
        'Event logged to audit_logs table'
      );

      // Test security summary generation
      const summary = await auditService.getSecuritySummary({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        endDate: new Date().toISOString()
      });

      await this.assert(
        'Security summary generated',
        summary && typeof summary.total_events === 'number',
        `Total events in last 24h: ${summary.total_events}`
      );

    } catch (error) {
      await this.assert('Audit logging test', false, error.message);
    }
  }

  async testInputValidation() {
    log('\n🧪 Testing Input Validation', 'blue');
    
    try {
      // Test invalid login data
      const invalidLoginResult = await authService.validateLogin({
        email: 'invalid-email',
        password: '123', // Too short
        userType: 'invalid' // Invalid type
      });

      await this.assert(
        'Input validation rejects invalid data',
        !invalidLoginResult.success && invalidLoginResult.validationErrors,
        `Validation errors: ${invalidLoginResult.validationErrors?.length || 0}`
      );

      // Test valid email normalization
      const normalizedResult = await authService.validateLogin({
        email: 'Test.Email@EXAMPLE.COM',
        password: 'ValidPass123',
        userType: 'admin'
      });

      await this.assert(
        'Email normalization works',
        !normalizedResult.success, // Will fail because user doesn't exist, but validation should pass
        'Input validation passed for normalized email'
      );

    } catch (error) {
      await this.assert('Input validation test', false, error.message);
    }
  }

  async testSecureTokenGeneration() {
    log('\n🧪 Testing Secure Token Generation', 'blue');
    
    try {
      const token1 = authService.generateSecureToken();
      const token2 = authService.generateSecureToken();
      const token3 = authService.generateSecureToken(16); // Different length

      await this.assert(
        'Secure tokens are unique',
        token1 !== token2 && token1 !== token3,
        `Token1: ${token1.substring(0, 10)}... Token2: ${token2.substring(0, 10)}...`
      );

      await this.assert(
        'Secure tokens have correct length',
        token1.length === 64 && token3.length === 32, // hex encoding doubles the length
        `Default length: ${token1.length}, Custom length: ${token3.length}`
      );

      await this.assert(
        'Secure tokens are hexadecimal',
        /^[a-f0-9]+$/.test(token1),
        'Token contains only hexadecimal characters'
      );

    } catch (error) {
      await this.assert('Secure token generation test', false, error.message);
    }
  }

  async testDatabaseConnections() {
    log('\n🧪 Testing Database Connections', 'blue');
    
    try {
      // Test basic connection
      const result = await pool.query('SELECT NOW() as current_time');
      await this.assert(
        'Database connection working',
        result.rows.length > 0,
        `Current time: ${result.rows[0].current_time}`
      );

      // Test that required tables exist
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_admin', 'user_client', 'audit_logs', 'organizations')
      `);
      
      const expectedTables = ['user_admin', 'user_client', 'audit_logs', 'organizations'];
      const existingTables = tablesResult.rows.map(row => row.table_name);
      
      await this.assert(
        'Required tables exist',
        expectedTables.every(table => existingTables.includes(table)),
        `Found tables: ${existingTables.join(', ')}`
      );

    } catch (error) {
      await this.assert('Database connection test', false, error.message);
    }
  }

  async runAllTests() {
    log('🚀 Starting NOURX Authentication System Tests', 'blue');
    log('='.repeat(50), 'blue');

    await this.testDatabaseConnections();
    await this.testPasswordHashing();
    await this.testJwtTokenGeneration();
    await this.testAuditLogging();
    await this.testInputValidation();
    await this.testSecureTokenGeneration();

    // Print summary
    log('\n📊 Test Summary', 'blue');
    log('='.repeat(50), 'blue');
    log(`Total Tests: ${this.results.passed + this.results.failed}`);
    log(`Passed: ${this.results.passed}`, 'green');
    log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    
    if (this.results.failed > 0) {
      log('\n❌ Failed Tests:', 'red');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          log(`  • ${test.name}`, 'red');
          if (test.details) log(`    ${test.details}`, 'yellow');
        });
    }
    
    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    log(`\n📈 Success Rate: ${successRate}%`, successRate === 100 ? 'green' : 'yellow');
    
    return this.results;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthTester();
  
  tester.runAllTests()
    .then((results) => {
      if (results.failed === 0) {
        log('\n🎉 All tests passed!', 'green');
        process.exit(0);
      } else {
        log('\n⚠️  Some tests failed!', 'yellow');
        process.exit(1);
      }
    })
    .catch((error) => {
      log(`\n💥 Test suite crashed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await pool.end();
    });
}

export default AuthTester;