/**
 * Versioned migration runner.
 *
 * How it works:
 *  1. Creates a `schema_migrations` table on first run to track applied files.
 *  2. Reads every *.sql file from `./migrations/` in ascending filename order.
 *  3. Skips files already recorded in `schema_migrations`.
 *  4. Runs each pending file inside its own transaction — a failure rolls back
 *     that file only and aborts the process so nothing is left half-applied.
 *
 * Adding a new migration:
 *  Create `backend/src/db/migrations/NNN_description.sql` where NNN is the
 *  next three-digit number (e.g. 002_add_notifications.sql). The next deploy
 *  picks it up automatically.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

try {
  // 1. Bootstrap the tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 2. Load which migrations have already run
  const { rows: applied } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename',
  );
  const appliedSet = new Set(applied.map((r) => r.filename));

  // 3. Find all .sql files in migrations/, sorted ascending
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const pending = files.filter((f) => !appliedSet.has(f));

  if (pending.length === 0) {
    console.log('[migrate] Database is up to date. Nothing to run.');
  } else {
    console.log(`[migrate] ${pending.length} pending migration(s): ${pending.join(', ')}`);

    // 4. Run each pending migration in its own transaction
    for (const filename of pending) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`[migrate] ✓ Applied ${filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate] ✗ Failed on ${filename}:`, err);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log('[migrate] All migrations applied successfully.');
  }
} finally {
  await pool.end();
}
