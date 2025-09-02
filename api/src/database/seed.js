import { readFile } from 'fs/promises';
import path from 'path';
import url from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

const resolveInitDir = () => {
  if (process.env.INIT_SQL_DIR) return path.resolve(process.env.INIT_SQL_DIR);

  const cwdGuess = path.resolve(process.cwd(), '../database/init');
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const fileGuess = path.resolve(__dirname, '../../../database/init');
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
  console.log(`Seeded: ${path.basename(filePath)}`);
};

const main = async () => {
  const initDir = resolveInitDir();
  const seedFile = path.join(initDir, '02-seed.sql');

  const client = new Client(getDbConfig());
  try {
    await client.connect();
    console.log('Connected to database');

    await runSqlFile(client, seedFile);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
};

main();

