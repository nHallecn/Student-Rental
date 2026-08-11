import { Pool } from 'pg';
import { env } from '../config/env.js';

let pool: Pool | undefined;

export function getPool() {
  pool ??= new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === 'production' ? 20 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
  return pool;
}

export async function closePool() {
  if (pool) await pool.end();
  pool = undefined;
}

