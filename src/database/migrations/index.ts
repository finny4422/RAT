export const DATABASE_VERSION = 1;

export type Migration = {
  version: number;
  name: string;
};

export const migrations: Migration[] = [
  { version: 1, name: 'initial_schema' },
];

export async function runMigrations(): Promise<void> {
  // Migration execution will be implemented in a future phase.
  throw new Error('Not implemented');
}
