import type { DataSource, EntityManager } from 'typeorm'
import { createTx, type TransactionRunner, type Tx } from '../../kernel/transaction.ts'

const managers = new WeakMap<Tx, EntityManager>()

export function getEntityManager(tx: Tx): EntityManager {
  const manager = managers.get(tx)
  if (!manager) {
    throw new Error('Transaction context is not active')
  }
  return manager
}

export class PostgresTransactionRunner implements TransactionRunner {
  constructor(private readonly dataSource: DataSource) {}

  run<Result>(work: (tx: Tx) => Promise<Result>): Promise<Result> {
    if (!this.dataSource.isInitialized) {
      throw new Error('PostgreSQL DataSource must be initialized before starting a transaction')
    }

    return this.dataSource.manager.transaction(async (manager) => {
      const tx = createTx()
      managers.set(tx, manager)

      try {
        return await work(tx)
      } finally {
        managers.delete(tx)
      }
    })
  }
}
