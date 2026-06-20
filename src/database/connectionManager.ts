import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { DatabaseError } from './errors';
import { logDbLifecycle } from './dbLifecycle';

export const DATABASE_NAME = 'routine_tracker.db';

let database: SQLiteDatabase | null = null;
let opening: Promise<SQLiteDatabase> | null = null;
let isClosing = false;

/**
 * Applies required SQLite pragmas for the application.
 * Must run on every new connection before queries.
 */
export async function configureDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);
}

async function createConnection(): Promise<SQLiteDatabase> {
  try {
    logDbLifecycle('open: creating connection');
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await configureDatabase(db);
    logDbLifecycle('open: connection ready');
    return db;
  } catch (error) {
    throw new DatabaseError('Failed to open SQLite database.', error);
  }
}

/**
 * Opens the singleton database connection or returns the existing one.
 */
export async function openConnection(): Promise<SQLiteDatabase> {
  if (database) {
    return database;
  }

  if (!opening) {
    opening = createConnection().finally(() => {
      opening = null;
    });
  }

  database = await opening;
  return database;
}

/**
 * Returns the open connection. Throws if bootstrap has not completed.
 */
export function getConnection(): SQLiteDatabase {
  if (!database) {
    throw new DatabaseError('Database not ready. Call bootstrapDatabase() first.');
  }

  return database;
}

/** Returns true when a connection is open and configured. */
export function isConnectionOpen(): boolean {
  return database !== null;
}

/**
 * Closes the database connection and clears the singleton.
 * Safe to call multiple times; ignores already-closed handles.
 */
export async function closeConnection(): Promise<void> {
  if (!database || isClosing) {
    return;
  }

  isClosing = true;
  const closingHandle = database;

  try {
    logDbLifecycle('close: closing connection');
    await closingHandle.closeAsync();
    logDbLifecycle('close: connection closed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('closed resource') || message.includes('Access to closed')) {
      logDbLifecycle('close: connection already closed (ignored)', { message });
    } else {
      logDbLifecycle('close: failed', { message });
      throw error;
    }
  } finally {
    if (database === closingHandle) {
      database = null;
    }
    opening = null;
    isClosing = false;
  }
}
