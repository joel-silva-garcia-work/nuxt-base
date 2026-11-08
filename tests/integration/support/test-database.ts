import { Client } from 'pg'
import type { DataSource } from 'typeorm'
import { loadDatabaseConfigs, type DatabaseConfig } from '../../../server/platform/config/database.ts'

type Environment = Readonly<Record<string, string | undefined>>

export function assertTestDatabaseResetAllowed(
  environment: Environment = process.env,
): DatabaseConfig {
  const { development, test } = loadDatabaseConfigs(environment)

  if (environment.TEST_DB_ALLOW_SCHEMA_RESET !== 'true') {
    throw new Error('TEST_DB_ALLOW_SCHEMA_RESET=true is required for destructive integration tests')
  }
  if (!test.database.toLowerCase().endsWith('_test')) {
    throw new Error('TEST_DB_NAME must end with _test for destructive integration tests')
  }
  if (test.database === development.database || test.user === development.user) {
    throw new Error('Integration test database and role must be separate from development')
  }

  return test
}

export async function assertConnectedTestDatabase(
  dataSource: DataSource,
  environment: Environment = process.env,
): Promise<void> {
  const test = assertTestDatabaseResetAllowed(environment)

  if (!dataSource.isInitialized) {
    throw new Error('Test database DataSource must be initialized before its identity is checked')
  }
  if (dataSource.options.type !== 'postgres') {
    throw new Error('Integration tests require PostgreSQL')
  }
  if (
    dataSource.options.database !== test.database
    || dataSource.options.username !== test.user
  ) {
    throw new Error('Integration tests must use the configured TEST_DB target and role')
  }

  const identity = await dataSource.query(`
    SELECT current_database() AS database,
           current_user AS role,
           pg_roles.rolsuper AS is_superuser
    FROM pg_catalog.pg_roles
    WHERE pg_roles.rolname = current_user
  `) as Array<{ database: string; role: string; is_superuser: boolean }>

  if (
    identity[0]?.database !== test.database
    || identity[0]?.role !== test.user
    || identity[0]?.is_superuser !== false
  ) {
    throw new Error('Connected PostgreSQL identity is not the configured non-superuser test target')
  }
}

export async function checkTestDatabaseConnection(config: DatabaseConfig): Promise<void> {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    connectionTimeoutMillis: 5_000,
  })

  try {
    await client.connect()
    const result = await client.query<{
      database: string
      role: string
      is_superuser: boolean
    }>(`
      SELECT current_database() AS database,
             current_user AS role,
             role.rolsuper AS is_superuser
      FROM pg_catalog.pg_roles AS role
      WHERE role.rolname = current_user
    `)

    if (
      result.rows[0]?.database !== config.database
      || result.rows[0]?.role !== config.user
      || result.rows[0]?.is_superuser !== false
    ) {
      throw new Error('Connected PostgreSQL identity is not the configured non-superuser test target')
    }
  } finally {
    await client.end()
  }
}
