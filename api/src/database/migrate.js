import { readFile } from 'fs/promises';
import path from 'path';
import url from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Resolve a default init SQL directory: prefer INIT_SQL_DIR, else ../database/init
const resolveInitDir = () => {
  if (process.env.INIT_SQL_DIR) return path.resolve(process.env.INIT_SQL_DIR);

  // Running from api working dir typically
  const cwdGuess = path.resolve(process.cwd(), '../database/init');
  // Fallback to path relative to this file
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const fileGuess = path.resolve(__dirname, '../../../database/init');
  // Prefer cwdGuess by default; both may exist in local dev vs container
  return cwdGuess || fileGuess;
};

const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'nourx',
    user: process.env.DB_USER || 'nourx_user',
    password: process.env.DB_PASSWORD || 'nourx_password'
  };
};

const runSqlFile = async (client, filePath) => {
  const sql = await readFile(filePath, 'utf8');
  await client.query(sql);
  console.log(`Applied: ${path.basename(filePath)}`);
};

const main = async () => {
  const initDir = resolveInitDir();
  const schemaFile = path.join(initDir, '01-schema.sql');

  const client = new Client(getDbConfig());
  try {
    await client.connect();
    console.log('Connected to database');

    await runSqlFile(client, schemaFile);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
};

main();

