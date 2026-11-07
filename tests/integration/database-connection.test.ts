import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadDatabaseConfigs } from '../../server/platform/config/database.ts'

const { test } = loadDatabaseConfigs()
const client = new Client({
  host: test.host,
  port: test.port,
  database: test.database,
  user: test.user,
  password: test.password,
  ssl: test.ssl,
})

describe('PostgreSQL test database', () => {
  beforeAll(async () => {
    await client.connect()
  })

  afterAll(async () => {
    await client.end()
  })

  it('connects to the dedicated test database with a non-superuser role', async () => {
    const result = await client.query<{
      database: string
      is_superuser: boolean
    }>(`
      SELECT current_database() AS database, role.rolsuper AS is_superuser
      FROM pg_roles AS role
      WHERE role.rolname = current_user
    `)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]?.database).toBe(test.database)
    expect(result.rows[0]?.is_superuser).toBe(false)
  })
})
