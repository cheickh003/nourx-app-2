import dotenv from 'dotenv';
import { beforeAll, afterAll, beforeEach } from 'vitest';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
});

beforeEach(async () => {
});