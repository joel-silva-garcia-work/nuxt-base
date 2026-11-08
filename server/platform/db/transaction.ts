import type { DataSource, EntityManager } from 'typeorm'
import { createTx, type TransactionRunner, type Tx } from '../../kernel/transaction.ts'

const managers = new WeakMap<Tx, EntityManager>()
const rollbackOnly = new WeakMap<Tx, { readonly cause: unknown }>()

export function getEntityManager(tx: Tx): EntityManager {
  const manager = managers.get(tx)
  if (!manager) {
    throw new Error('Transaction context is not active')
  }
  return manager
}

export function markTransactionRollbackOnly(tx: Tx, cause: unknown): void {
  if (!managers.has(tx)) {
    throw new Error('Transaction context is not active')
  }
  if (!rollbackOnly.has(tx)) {
    rollbackOnly.set(tx, { cause })
  }
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
        const result = await work(tx)
        const failure = rollbackOnly.get(tx)
        if (failure) {
          throw new Error(
            'Transaction is marked for rollback after a persistence failure',
            { cause: failure.cause },
          )
        }
        return result
      } finally {
        managers.delete(tx)
        rollbackOnly.delete(tx)
      }
    })
  }
}
