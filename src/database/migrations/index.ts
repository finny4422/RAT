import { readMigration001 } from './001_initial_schema';

export const DATABASE_VERSION = 1;

export type Migration = {
  version: number;
  name: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: readMigration001(),
  },
];

export { runMigrations, splitSqlStatements } from './runner';
export type { MigrationRunResult } from './runner';
export {
  getAppliedMigrations,
  getAppliedVersions,
  getLatestAppliedVersion,
  recordMigrationApplied,
  verifyDatabaseVersion,
} from './version';
export type { AppliedMigration } from './version';
