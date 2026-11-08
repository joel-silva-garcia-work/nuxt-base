import { Client } from 'pg'
import { loadDatabaseConfigs } from '../../../server/platform/config/database.ts'

export async function setup(): Promise<void> {
  const { test } = loadDatabaseConfigs()
  const client = new Client({
    host: test.host,
    port: test.port,
    database: test.database,
    user: test.user,
    password: test.password,
    ssl: test.ssl,
    connectionTimeoutMillis: 5_000,
  })

  try {
    await client.connect()
    await client.query('SELECT 1')
  } finally {
    await client.end()
  }
}
