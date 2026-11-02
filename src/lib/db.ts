import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const isVercel = Boolean(process.env.VERCEL);
  let dbPath: string;

  if (isVercel) {
    // Vercel serverless functions have a read-only root, only /tmp is writable
    const tmpDir = '/tmp';
    dbPath = path.join(tmpDir, 'bth_esports.db');

    const sourceDb = path.join(process.cwd(), 'data', 'bth_esports.db');
    if (!fs.existsSync(dbPath) && fs.existsSync(sourceDb)) {
      try {
        fs.copyFileSync(sourceDb, dbPath);
      } catch (err) {
        console.warn('Failed to copy seeded db to /tmp, will initialize from schema:', err);
      }
    }
  } else {
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    dbPath = path.join(dbDir, 'bth_esports.db');
  }

  dbInstance = new DatabaseSync(dbPath);

  // Initialize PRAGMAs
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  try {
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  } catch {
    // Ignore if WAL mode is not supported on certain storage
  }

  // Read and execute schema if needed
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    dbInstance.exec(schemaSql);
  }

  return dbInstance;
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
  const db = getDb();
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return {
    changes: Number(result.changes),
    lastInsertRowid: result.lastInsertRowid,
  };
}

export function transaction<T>(callback: () => T): T {
  const db = getDb();
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = callback();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
