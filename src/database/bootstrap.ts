import type { SQLiteDatabase } from 'expo-sqlite';

import {
  closeConnection,
  getConnection,
  isConnectionOpen,
  openConnection,
} from './connectionManager';
import { DatabaseError } from './errors';
import { DATABASE_VERSION, migrations } from './migrations';
import { runMigrations } from './migrations/runner';
import { verifyDatabaseVersion } from './migrations/version';

let bootstrapPromise: Promise<BootstrapResult> | null = null;
let bootstrapResult: BootstrapResult | null = null;

export type BootstrapResult = {
  database: SQLiteDatabase;
  appliedVersions: number[];
  skippedVersions: number[];
  isFirstInstall: boolean;
};

/**
 * Bootstraps the SQLite database:
 * 1. Open connection
 * 2. Enable foreign keys + WAL
 * 3. Apply pending migrations
 * 4. Verify final schema version
 */
export async function bootstrapDatabase(): Promise<BootstrapResult> {
  if (bootstrapResult) {
    return bootstrapResult;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = performBootstrap()
      .then((result) => {
        bootstrapResult = result;
        return result;
      })
      .catch(async (error) => {
        bootstrapPromise = null;
        await closeConnection();
        throw error;
      });
  }

  return bootstrapPromise;
}

async function performBootstrap(): Promise<BootstrapResult> {
  const database = await openConnection();
  const migrationResult = await runMigrations(database, migrations);
  await verifyDatabaseVersion(database, DATABASE_VERSION);

  return {
    database,
    appliedVersions: migrationResult.appliedVersions,
    skippedVersions: migrationResult.skippedVersions,
    isFirstInstall:
      migrationResult.appliedVersions.length > 0 && migrationResult.skippedVersions.length === 0,
  };
}

/** Returns the bootstrapped database connection. */
export function getDatabase(): SQLiteDatabase {
  if (!bootstrapResult) {
    throw new DatabaseError('Database not bootstrapped. Call bootstrapDatabase() first.');
  }

  return getConnection();
}

/** Returns true after bootstrapDatabase() has completed successfully. */
export function isDatabaseReady(): boolean {
  return bootstrapResult !== null && isConnectionOpen();
}

/** Resets bootstrap state and closes the connection. */
export async function shutdownDatabase(): Promise<void> {
  bootstrapPromise = null;
  bootstrapResult = null;
  await closeConnection();
}

/**
 * Closes and reopens the DB connection so reads see writes from other JS contexts
 * (e.g. widget headless completion while the app process stays alive).
 */
export async function refreshDatabaseConnection(): Promise<BootstrapResult> {
  await shutdownDatabase();
  return bootstrapDatabase();
}
