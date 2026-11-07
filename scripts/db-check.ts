import { Client } from 'pg'
import type { DatabaseConfig } from '../server/platform/config/database.ts'
import { loadDatabaseConfigs } from '../server/platform/config/database.ts'

function errorCode(error: unknown): string {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
  return error instanceof Error ? error.name : 'UnknownError'
}

async function checkDatabase(label: string, config: DatabaseConfig): Promise<boolean> {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    connectionTimeoutMillis: 5_000,
  })
  let connected = false
  let valid = false

  try {
    await client.connect()
    connected = true
    const result = await client.query<{
      database: string
      is_superuser: boolean
      can_connect: boolean
    }>(`
      SELECT current_database() AS database,
             role.rolsuper AS is_superuser,
             has_database_privilege(current_user, current_database(), 'CONNECT') AS can_connect
      FROM pg_roles AS role
      WHERE role.rolname = current_user
    `)
    const row = result.rows[0]

    if (!row || row.database !== config.database || row.is_superuser || !row.can_connect) {
      throw new Error('Connected role or database does not meet the application requirements')
    }

    console.log(`[${label}] OK (database=${row.database}, superuser=no)`)
    valid = true
  } catch (error) {
    console.error(`[${label}] FAILED (${errorCode(error)})`)
  } finally {
    if (connected) {
      try {
        await client.end()
      } catch (error) {
        console.error(`[${label}] Failed to close database connection (${errorCode(error)})`)
        valid = false
      }
    }
  }

  return valid
}

async function main(): Promise<void> {
  const configs = loadDatabaseConfigs()
  const developmentOk = await checkDatabase('development', configs.development)
  const testOk = await checkDatabase('tests', configs.test)

  if (!developmentOk || !testOk) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('Unable to check database configuration')
  }
  process.exitCode = 1
})
