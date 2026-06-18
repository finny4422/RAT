export const SCHEMA_MIGRATIONS_TABLE = 'schema_migrations';

export const SCHEMA_MIGRATIONS_COLUMNS = {
  version: 'version',
  name: 'name',
  appliedAt: 'applied_at',
} as const;
