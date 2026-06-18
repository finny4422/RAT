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
