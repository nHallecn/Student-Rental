import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getPool, closePool } from './pool.js';

const migrationUrl = new URL('../../db/migrations/001_initial.sql', import.meta.url);
const sql = await readFile(fileURLToPath(migrationUrl), 'utf8');

try {
  await getPool().query(sql);
  console.info('Database migration completed');
} finally {
  await closePool();
}

