const path = require('path');
require('dotenv').config();

const config = {
  user: process.env.POSTGRES_USER || 'nourx',
  password: process.env.POSTGRES_PASSWORD || 'nourx_dev_password', 
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5434'),
  database: process.env.POSTGRES_DB || 'nourx_app',
  
  // Configuration migrations
  migrationsTable: 'pgmigrations',
  dir: path.resolve(__dirname, '../migrations'),
  checkOrder: true,
  verbose: true,
  
  // Configuration SSL si en production
  ...(process.env.NODE_ENV === 'production' && {
    ssl: {
      rejectUnauthorized: false
    }
  })
};

module.exports = config;
