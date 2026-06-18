import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_MIGRATIONS_COLUMNS, SCHEMA_MIGRATIONS_TABLE } from '../schema';
import { MigrationError } from '../errors';

export type AppliedMigration = {
  version: number;
  name: string;
  appliedAt: string;
};

async function schemaMigrationsTableExists(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [SCHEMA_MIGRATIONS_TABLE],
  );

  return row !== null;
}

/**
 * Returns all migrations recorded in schema_migrations, ordered by version.
 * Returns an empty array on first install before migration 001 runs.
 */
export async function getAppliedMigrations(db: SQLiteDatabase): Promise<AppliedMigration[]> {
  if (!(await schemaMigrationsTableExists(db))) {
    return [];
  }

  return db.getAllAsync<AppliedMigration>(
    `SELECT
       ${SCHEMA_MIGRATIONS_COLUMNS.version} AS version,
       ${SCHEMA_MIGRATIONS_COLUMNS.name} AS name,
       ${SCHEMA_MIGRATIONS_COLUMNS.appliedAt} AS appliedAt
     FROM ${SCHEMA_MIGRATIONS_TABLE}
     ORDER BY ${SCHEMA_MIGRATIONS_COLUMNS.version} ASC`,
  );
}

/** Returns applied migration version numbers in ascending order. */
export async function getAppliedVersions(db: SQLiteDatabase): Promise<number[]> {
  const applied = await getAppliedMigrations(db);
  return applied.map((migration) => migration.version);
}

/** Returns the highest applied migration version, or 0 on first install. */
export async function getLatestAppliedVersion(db: SQLiteDatabase): Promise<number> {
  const versions = await getAppliedVersions(db);
  return versions.length > 0 ? Math.max(...versions) : 0;
}

/**
 * Records a successfully applied migration.
 * Uses INSERT OR IGNORE for idempotency if the version row already exists.
 */
export async function recordMigrationApplied(
  db: SQLiteDatabase,
  version: number,
  name: string,
): Promise<void> {
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO ${SCHEMA_MIGRATIONS_TABLE}
       (${SCHEMA_MIGRATIONS_COLUMNS.version}, ${SCHEMA_MIGRATIONS_COLUMNS.name}, ${SCHEMA_MIGRATIONS_COLUMNS.appliedAt})
     VALUES (?, ?, ?)`,
    [version, name, new Date().toISOString()],
  );

  if (result.changes === 0) {
    const existing = await db.getFirstAsync<{ version: number }>(
      `SELECT ${SCHEMA_MIGRATIONS_COLUMNS.version} AS version
       FROM ${SCHEMA_MIGRATIONS_TABLE}
       WHERE ${SCHEMA_MIGRATIONS_COLUMNS.version} = ?`,
      [version],
    );

    if (!existing) {
      throw new MigrationError(`Failed to record migration version ${version}.`);
    }
  }
}

/**
 * Verifies the database is at the expected migration version after bootstrap.
 */
export async function verifyDatabaseVersion(
  db: SQLiteDatabase,
  expectedVersion: number,
): Promise<void> {
  const latest = await getLatestAppliedVersion(db);

  if (latest !== expectedVersion) {
    throw new MigrationError(
      `Database migration incomplete. Expected version ${expectedVersion}, found ${latest}.`,
    );
  }
}
