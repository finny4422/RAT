import type { SQLiteDatabase } from 'expo-sqlite';

import { MigrationError } from '../errors';

import type { Migration } from './index';
import { getAppliedVersions, recordMigrationApplied } from './version';

function validateMigrationRegistry(migrations: Migration[]): void {
  if (migrations.length === 0) {
    throw new MigrationError('No migrations registered.');
  }

  const sorted = [...migrations].sort((a, b) => a.version - b.version);

  for (let index = 0; index < sorted.length; index += 1) {
    const expectedVersion = index + 1;

    if (sorted[index].version !== expectedVersion) {
      throw new MigrationError(
        `Invalid migration registry. Expected version ${expectedVersion}, found ${sorted[index].version}.`,
      );
    }
  }
}

/**
 * Splits a migration SQL script into executable statements.
 * Ignores empty segments and line comments.
 */
export function splitSqlStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) =>
      statement
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter((statement) => statement.length > 0);
}

async function executeMigrationSql(db: SQLiteDatabase, sql: string): Promise<void> {
  const statements = splitSqlStatements(sql);

  for (const statement of statements) {
    await db.execAsync(`${statement};`);
  }
}

async function applyMigration(db: SQLiteDatabase, migration: Migration): Promise<void> {
  await db.execAsync('BEGIN IMMEDIATE TRANSACTION;');

  try {
    await executeMigrationSql(db, migration.sql);
    await recordMigrationApplied(db, migration.version, migration.name);
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw new MigrationError(
      `Failed to apply migration ${migration.version} (${migration.name}).`,
      error,
    );
  }
}

export type MigrationRunResult = {
  appliedVersions: number[];
  skippedVersions: number[];
};

/**
 * Applies all pending migrations in ascending version order.
 * Already-applied migrations are skipped (upgrade path).
 * Migration SQL must be idempotent (CREATE IF NOT EXISTS, etc.).
 */
export async function runMigrations(
  db: SQLiteDatabase,
  migrations: Migration[],
): Promise<MigrationRunResult> {
  validateMigrationRegistry(migrations);

  const appliedSet = new Set(await getAppliedVersions(db));
  const appliedVersions: number[] = [];
  const skippedVersions: number[] = [];

  for (const migration of migrations) {
    if (appliedSet.has(migration.version)) {
      skippedVersions.push(migration.version);
      continue;
    }

    await applyMigration(db, migration);
    appliedSet.add(migration.version);
    appliedVersions.push(migration.version);
  }

  return { appliedVersions, skippedVersions };
}
