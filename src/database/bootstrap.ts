import type { SQLiteDatabase } from 'expo-sqlite';

import {
  closeConnection,
  getConnection,
  isConnectionOpen,
  openConnection,
} from './connectionManager';
import { logDbLifecycle } from './dbLifecycle';
import { DatabaseError } from './errors';
import { DATABASE_VERSION, migrations } from './migrations';
import { runMigrations } from './migrations/runner';
import { verifyDatabaseVersion } from './migrations/version';

let bootstrapPromise: Promise<BootstrapResult> | null = null;
let bootstrapResult: BootstrapResult | null = null;
let refreshPromise: Promise<BootstrapResult> | null = null;

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
    logDbLifecycle('bootstrap: start');
    bootstrapPromise = performBootstrap()
      .then((result) => {
        bootstrapResult = result;
        logDbLifecycle('bootstrap: complete');
        return result;
      })
      .catch(async (error) => {
        bootstrapPromise = null;
        logDbLifecycle('bootstrap: failed', {
          message: error instanceof Error ? error.message : String(error),
        });
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

/** Resets bootstrap state and closes the connection. Intended for tests or app teardown. */
export async function shutdownDatabase(): Promise<void> {
  logDbLifecycle('shutdown: requested');
  bootstrapPromise = null;
  bootstrapResult = null;
  await closeConnection();
}

/**
 * Reopens the DB connection. Only for rare recovery (e.g. tests).
 * Normal app flows should keep the singleton connection open — WAL handles cross-context reads.
 */
export async function refreshDatabaseConnection(): Promise<BootstrapResult> {
  if (refreshPromise) {
    logDbLifecycle('refresh: waiting for in-flight refresh');
    return refreshPromise;
  }

  logDbLifecycle('refresh: requested');

  refreshPromise = (async () => {
    await shutdownDatabase();
    return bootstrapDatabase();
  })().finally(() => {
    refreshPromise = null;
    logDbLifecycle('refresh: complete');
  });

  return refreshPromise;
}
