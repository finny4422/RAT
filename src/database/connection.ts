import type { SQLiteDatabase } from 'expo-sqlite';

let database: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }

  return database;
}

export async function initializeDatabase(): Promise<SQLiteDatabase> {
  // Database initialization will be implemented in a future phase.
  throw new Error('Not implemented');
}

export async function closeDatabase(): Promise<void> {
  database = null;
}
