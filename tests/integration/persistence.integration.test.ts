import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getDataSource, persistenceEntities } from '../../server/composition/persistence.ts'
import { loadDatabaseConfigs } from '../../server/platform/config/database.ts'
import { PostgresTransactionRunner, getEntityManager } from '../../server/platform/db/transaction.ts'
import type { Tx } from '../../server/kernel/transaction.ts'

const source = getDataSource('test')
const runner = new PostgresTransactionRunner(source)
const { test } = loadDatabaseConfigs()

async function countPublicTables(): Promise<number> {
  const client = new Client({
    host: test.host,
    port: test.port,
    database: test.database,
    user: test.user,
    password: test.password,
    ssl: test.ssl,
  })

  await client.connect()
  try {
    const { rows } = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    )
    return Number(rows[0]?.count)
  } finally {
    await client.end()
  }
}

describe('TypeORM persistence infrastructure', () => {
  let tableCountBeforeInitialization: number

  beforeAll(async () => {
    tableCountBeforeInitialization = await countPublicTables()
    await source.initialize()
    expect(await countPublicTables()).toBe(tableCountBeforeInitialization)
  })

  afterAll(async () => {
    if (source.isInitialized) {
      await source.destroy()
    }
  })

  it('initializes the isolated test database without creating schema objects', () => {
    expect(source.options.synchronize).toBe(false)
    expect(source.options.migrationsRun).toBe(false)
    expect(source.entityMetadatas).toHaveLength(persistenceEntities.length)
  })

  it('shares one transaction manager across repositories and expires its context', async () => {
    let capturedTx: Tx | undefined
    const backendPid = await runner.run(async (tx) => {
      capturedTx = tx
      const firstManager = getEntityManager(tx)
      const secondManager = getEntityManager(tx)

      expect(firstManager).toBe(secondManager)
      expect(firstManager.queryRunner?.isTransactionActive).toBe(true)

      const rows: Array<{ pid: number }> = await firstManager.query('SELECT pg_backend_pid() AS pid')
      return rows[0].pid
    })

    expect(backendPid).toEqual(expect.any(Number))
    const expiredTx = capturedTx
    if (!expiredTx) {
      throw new Error('Transaction context was not captured')
    }
    expect(() => getEntityManager(expiredTx)).toThrow('Transaction context is not active')
  })

  it('rolls back when a transaction callback fails', async () => {
    const failure = new Error('expected rollback')
    await expect(runner.run(async () => {
      throw failure
    })).rejects.toBe(failure)
  })
})
