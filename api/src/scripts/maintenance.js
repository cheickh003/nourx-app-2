#!/usr/bin/env node

/**
 * NOURX API Maintenance Script
 * Handles periodic cleanup tasks for security and performance
 */

import dotenv from 'dotenv';
import pool from '../config/database.js';
import JwtService from '../services/jwtService.js';
import AuditService from '../services/auditService.js';

dotenv.config();

// Initialize services
const jwtService = new JwtService(pool);
const auditService = new AuditService(pool);

// Maintenance tasks
const MaintenanceTasks = {
  /**
   * Clean up expired JWT refresh tokens
   */
  async cleanupExpiredTokens() {
    console.log('🧹 Starting cleanup of expired JWT tokens...');
    try {
      const deletedCount = await jwtService.cleanupExpiredTokens();
      console.log(`✅ Cleaned up ${deletedCount} expired JWT tokens`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired tokens:', error);
      return 0;
    }
  },

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupAuditLogs(retentionDays = 365) {
    console.log(`🧹 Starting cleanup of audit logs older than ${retentionDays} days...`);
    try {
      const deletedCount = await auditService.cleanupOldLogs(retentionDays);
      console.log(`✅ Cleaned up ${deletedCount} old audit log entries`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up audit logs:', error);
      return 0;
    }
  },

  /**
   * Generate security summary report
   */
  async generateSecurityReport(days = 7) {
    console.log(`📊 Generating security report for the last ${days} days...`);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const summary = await auditService.getSecuritySummary({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      console.log('\n📋 SECURITY SUMMARY REPORT');
      console.log('='.repeat(50));
      console.log(`Period: ${startDate.toDateString()} - ${endDate.toDateString()}`);
      console.log(`Total Events: ${summary.total_events}`);
      console.log(`Failed Logins: ${summary.failed_logins}`);
      console.log(`Locked Accounts: ${summary.locked_accounts}`);
      console.log(`High Risk Events: ${summary.high_risk_events}`);
      console.log(`Suspicious Activities: ${summary.suspicious_activities}`);
      console.log(`Rate Limit Violations: ${summary.rate_limit_violations}`);
      console.log(`Unique IP Addresses: ${summary.unique_ips}`);
      console.log(`Active Users: ${summary.active_users}`);
      
      // Alert for concerning activity
      if (summary.high_risk_events > 10) {
        console.log('\n🚨 WARNING: High number of high-risk security events detected!');
      }
      if (summary.failed_logins > 50) {
        console.log('\n🚨 WARNING: High number of failed login attempts detected!');
      }
      if (summary.suspicious_activities > 5) {
        console.log('\n🚨 WARNING: Multiple suspicious activities detected!');
      }
      
      console.log('='.repeat(50));
      return summary;
    } catch (error) {
      console.error('❌ Error generating security report:', error);
      return null;
    }
  },

  /**
   * Reset locked user accounts that are past their lockout period
   */
  async resetExpiredLockouts() {
    console.log('🔓 Resetting expired account lockouts...');
    try {
      const adminQuery = `
        UPDATE user_admin 
        SET locked_until = NULL, failed_login_attempts = 0
        WHERE locked_until IS NOT NULL AND locked_until < NOW()
        RETURNING id, email
      `;
      
      const clientQuery = `
        UPDATE user_client 
        SET locked_until = NULL, failed_login_attempts = 0
        WHERE locked_until IS NOT NULL AND locked_until < NOW()
        RETURNING id, email, organization_id
      `;
      
      const [adminResult, clientResult] = await Promise.all([
        pool.query(adminQuery),
        pool.query(clientQuery)
      ]);
      
      const totalUnlocked = adminResult.rowCount + clientResult.rowCount;
      console.log(`✅ Unlocked ${totalUnlocked} accounts (${adminResult.rowCount} admin, ${clientResult.rowCount} client)`);
      
      return {
        total: totalUnlocked,
        admin: adminResult.rowCount,
        client: clientResult.rowCount
      };
    } catch (error) {
      console.error('❌ Error resetting expired lockouts:', error);
      return { total: 0, admin: 0, client: 0 };
    }
  },

  /**
   * Check database health and performance
   */
  async checkDatabaseHealth() {
    console.log('🏥 Checking database health...');
    try {
      // Check connection
      const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      console.log(`✅ Database connection: OK (${connectionTest.rows[0].pg_version})`);
      
      // Check table sizes
      const sizeQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;
      
      const sizeResult = await pool.query(sizeQuery);
      console.log('\n📊 Top 10 Largest Tables:');
      sizeResult.rows.forEach(row => {
        console.log(`  ${row.tablename}: ${row.size}`);
      });
      
      // Check for long-running queries
      const longQueriesQuery = `
        SELECT 
          query,
          state,
          NOW() - query_start as duration
        FROM pg_stat_activity 
        WHERE state != 'idle' 
        AND query_start < NOW() - INTERVAL '30 seconds'
        ORDER BY query_start
      `;
      
      const longQueriesResult = await pool.query(longQueriesQuery);
      if (longQueriesResult.rows.length > 0) {
        console.log(`\n⚠️  Found ${longQueriesResult.rows.length} long-running queries`);
      } else {
        console.log('\n✅ No long-running queries detected');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }
};

// Main maintenance runner
async function runMaintenance(tasks = []) {
  console.log('🚀 Starting NOURX API maintenance...');
  console.log(`📅 ${new Date().toISOString()}\n`);
  
  const results = {};
  
  try {
    // Default tasks if none specified
    if (tasks.length === 0) {
      tasks = ['cleanup-tokens', 'reset-lockouts', 'security-report', 'db-health'];
    }
    
    if (tasks.includes('cleanup-tokens')) {
      results.tokenCleanup = await MaintenanceTasks.cleanupExpiredTokens();
    }
    
    if (tasks.includes('cleanup-logs')) {
      const retentionDays = process.env.AUDIT_RETENTION_DAYS || 365;
      results.logCleanup = await MaintenanceTasks.cleanupAuditLogs(parseInt(retentionDays));
    }
    
    if (tasks.includes('reset-lockouts')) {
      results.lockoutReset = await MaintenanceTasks.resetExpiredLockouts();
    }
    
    if (tasks.includes('security-report')) {
      const reportDays = process.env.SECURITY_REPORT_DAYS || 7;
      results.securityReport = await MaintenanceTasks.generateSecurityReport(parseInt(reportDays));
    }
    
    if (tasks.includes('db-health')) {
      results.dbHealth = await MaintenanceTasks.checkDatabaseHealth();
    }
    
    console.log('\n✅ Maintenance completed successfully!');
    return results;
    
  } catch (error) {
    console.error('\n❌ Maintenance failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
NOURX API Maintenance Script

Usage:
  node maintenance.js [tasks...]

Available tasks:
  cleanup-tokens    Clean up expired JWT refresh tokens
  cleanup-logs      Clean up old audit logs (respects AUDIT_RETENTION_DAYS env)
  reset-lockouts    Reset expired account lockouts
  security-report   Generate security summary report (respects SECURITY_REPORT_DAYS env)
  db-health         Check database health and performance

Examples:
  node maintenance.js                           # Run default tasks
  node maintenance.js cleanup-tokens            # Only cleanup tokens
  node maintenance.js security-report db-health # Only security report and DB health

Environment Variables:
  AUDIT_RETENTION_DAYS    Days to keep audit logs (default: 365)
  SECURITY_REPORT_DAYS    Days for security report (default: 7)
    `);
    process.exit(0);
  }
  
  const tasks = args.length > 0 ? args : [];
  runMaintenance(tasks);
}

export default MaintenanceTasks;