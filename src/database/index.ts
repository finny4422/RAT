export {
  bootstrapDatabase,
  getDatabase,
  isDatabaseReady,
  shutdownDatabase,
} from './bootstrap';
export type { BootstrapResult } from './bootstrap';

export {
  closeConnection,
  configureDatabase,
  DATABASE_NAME,
  getConnection,
  isConnectionOpen,
  openConnection,
} from './connectionManager';

export {
  DATABASE_VERSION,
  migrations,
  runMigrations,
  splitSqlStatements,
  getAppliedMigrations,
  getAppliedVersions,
  getLatestAppliedVersion,
  recordMigrationApplied,
  verifyDatabaseVersion,
} from './migrations';
export type { AppliedMigration, Migration, MigrationRunResult } from './migrations';

export { DatabaseError, MigrationError } from './errors';
export * from './schema';
