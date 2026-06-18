import type { SQLiteDatabase } from 'expo-sqlite';

import { migrations, DATABASE_VERSION } from './migrations';
import { SCHEMA_MIGRATIONS_TABLE } from './schema';

const DATABASE_NAME = 'routine_tracker.db';

let database: SQLiteDatabase | null = null;

async function configureDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');
}

async function getAppliedVersions(db: SQLiteDatabase): Promise<number[]> {
  const tableExists = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [SCHEMA_MIGRATIONS_TABLE],
  );

  if (!tableExists) {
    return [];
  }

  const rows = await db.getAllAsync<{ version: number }>(
    `SELECT version FROM ${SCHEMA_MIGRATIONS_TABLE} ORDER BY version ASC`,
  );

  return rows.map((row) => row.version);
}

async function applyMigration(
  db: SQLiteDatabase,
  version: number,
  name: string,
  sql: string,
): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION;');

  try {
    await db.execAsync(sql);
    await db.runAsync(
      `INSERT INTO ${SCHEMA_MIGRATIONS_TABLE} (version, name, applied_at) VALUES (?, ?, ?)`,
      [version, name, new Date().toISOString()],
    );
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

async function runPendingMigrations(db: SQLiteDatabase): Promise<void> {
  const applied = new Set(await getAppliedVersions(db));

  for (const migration of migrations) {
    if (applied.has(migration.version)) {
      continue;
    }

    await applyMigration(db, migration.version, migration.name, migration.sql);
  }
}

export async function initializeDatabase(
  openDatabase: (name: string) => Promise<SQLiteDatabase>,
): Promise<SQLiteDatabase> {
  if (database) {
    return database;
  }

  const db = await openDatabase(DATABASE_NAME);
  await configureDatabase(db);
  await runPendingMigrations(db);

  const applied = await getAppliedVersions(db);
  const latestApplied = applied.length > 0 ? Math.max(...applied) : 0;

  if (latestApplied !== DATABASE_VERSION) {
    throw new Error(
      `Database migration incomplete. Expected version ${DATABASE_VERSION}, got ${latestApplied}.`,
    );
  }

  database = db;
  return database;
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }

  return database;
}

export async function closeDatabase(): Promise<void> {
  database = null;
}
