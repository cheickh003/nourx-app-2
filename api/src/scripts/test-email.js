#!/usr/bin/env node

/**
 * Email Service Testing Script
 * Test all email functionality
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import EmailService from '../services/emailService.js';
import EmailTemplateService from '../services/emailTemplateService.js';
import pkg from 'pg';
const { Pool } = pkg;
import winston from 'winston';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5
});

async function main() {
  try {
    console.log('🧪 NOURX Email Service Testing');
    console.log('===============================\n');

    const emailService = new EmailService(pool, logger);
    const templateService = new EmailTemplateService(pool, logger);

    // Test database connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection successful\n');

    // Initialize templates
    console.log('📝 Initializing email templates...');
    await templateService.initializeDefaultTemplates();
    console.log('✅ Templates initialized\n');

    // Test email service initialization
    console.log('📧 Initializing email service...');
    await emailService.initializeTransporter();
    
    if (emailService.isConfigured) {
      console.log('✅ Email service configured and ready');
    } else {
      console.log('⚠️  Email service not configured (development mode)');
    }
    console.log();

    // Test template rendering
    console.log('🎨 Testing template rendering...');
    const testTemplate = await templateService.getTemplate('user_invitation');
    if (testTemplate) {
      const rendered = templateService.renderTemplateContent(testTemplate, {
        userEmail: 'test@example.com',
        organizationName: 'Test Corp',
        activationLink: 'https://app.nourx.fr/activate?token=test123',
        expiresAt: '25/12/2024',
        supportEmail: 'support@nourx.fr'
      });
      console.log('✅ Template rendering successful');
      console.log(`   Subject: ${rendered.subject}`);
    } else {
      console.log('❌ Template not found');
    }
    console.log();

    // Test command line arguments
    const testType = process.argv[2];
    const testEmail = process.argv[3] || 'test@example.com';

    if (!testType) {
      console.log('Available tests:');
      console.log('  node src/scripts/test-email.js invitation [email]');
      console.log('  node src/scripts/test-email.js reset [email]');
      console.log('  node src/scripts/test-email.js welcome [email]');
      console.log('  node src/scripts/test-email.js admin-notification');
      console.log('  node src/scripts/test-email.js queue-status');
      console.log('  node src/scripts/test-email.js all [email]');
      process.exit(0);
    }

    switch (testType) {
      case 'invitation':
        await testUserInvitation(emailService, testEmail);
        break;
      case 'reset':
        await testPasswordReset(emailService, testEmail);
        break;
      case 'welcome':
        await testAccountActivation(emailService, testEmail);
        break;
      case 'admin-notification':
        await testAdminNotification(emailService);
        break;
      case 'queue-status':
        await testQueueStatus(emailService);
        break;
      case 'all':
        await testAllEmails(emailService, testEmail);
        break;
      default:
        console.log('❌ Unknown test type:', testType);
        process.exit(1);
    }

    await pool.end();
    console.log('\n✅ Testing completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function testUserInvitation(emailService, email) {
  console.log(`📨 Testing user invitation email to ${email}...`);
  
  const emailId = await emailService.sendUserInvitation(
    email,
    'Test Organization',
    'test-invitation-token-123'
  );
  
  console.log(`✅ Invitation email queued with ID: ${emailId}`);
}

async function testPasswordReset(emailService, email) {
  console.log(`🔒 Testing password reset email to ${email}...`);
  
  const emailId = await emailService.sendPasswordReset(
    email,
    'test-reset-token-456'
  );
  
  console.log(`✅ Password reset email queued with ID: ${emailId}`);
}

async function testAccountActivation(emailService, email) {
  console.log(`🎉 Testing account activation email to ${email}...`);
  
  const emailId = await emailService.sendAccountActivated(
    email,
    'Test User',
    'Test Organization'
  );
  
  console.log(`✅ Account activation email queued with ID: ${emailId}`);
}

async function testAdminNotification(emailService) {
  console.log('👨‍💼 Testing admin notification...');
  
  const emailIds = await emailService.sendAdminNotification(
    'Test Notification',
    'This is a test admin notification from the email service testing script.',
    ['admin@nourx.fr'] // Test with single admin email
  );
  
  console.log(`✅ Admin notification emails queued: ${emailIds.length} emails`);
}

async function testQueueStatus(emailService) {
  console.log('📊 Checking email queue status...');
  
  const stats = await emailService.getEmailStats(7);
  
  if (stats.length === 0) {
    console.log('📭 Email queue is empty');
  } else {
    console.log('📧 Email queue status:');
    stats.forEach(stat => {
      console.log(`   ${stat.date}: ${stat.status} = ${stat.count}`);
    });
  }
  
  const failedEmails = await emailService.getFailedEmails(5);
  if (failedEmails.length > 0) {
    console.log('\n❌ Recent failed emails:');
    failedEmails.forEach((email, i) => {
      console.log(`   ${i + 1}. ${email.to_email} - ${email.subject}`);
      console.log(`      Error: ${email.last_error}`);
      console.log(`      Attempts: ${email.attempts}`);
    });
  }
}

async function testAllEmails(emailService, email) {
  console.log(`🧪 Running all email tests for ${email}...`);
  console.log('='.repeat(50));
  
  await testUserInvitation(emailService, email);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testPasswordReset(emailService, email);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testAccountActivation(emailService, email);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testAdminNotification(emailService);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📊 Final queue status:');
  await testQueueStatus(emailService);
}

// Test template validation and preview
async function testTemplatePreview() {
  const templateService = new EmailTemplateService(pool, logger);
  
  console.log('🎨 Testing template preview...');
  
  const preview = await templateService.previewTemplate('user_invitation', 'fr', {
    userEmail: 'preview@example.com',
    organizationName: 'Preview Corp',
    activationLink: 'https://app.nourx.fr/activate?token=preview123',
    expiresAt: '31/12/2024',
    supportEmail: 'support@nourx.fr'
  });
  
  console.log('✅ Template preview generated');
  console.log(`   Subject: ${preview.rendered.subject}`);
  console.log(`   HTML length: ${preview.rendered.html.length} chars`);
  console.log(`   Text length: ${preview.rendered.text.length} chars`);
}

// Advanced testing functions
if (process.argv.includes('--template-preview')) {
  testTemplatePreview().then(() => {
    pool.end();
    console.log('✅ Template preview test completed');
  }).catch(error => {
    console.error('❌ Template preview test failed:', error);
    process.exit(1);
  });
} else {
  main();
}