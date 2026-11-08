import { randomUUID } from 'node:crypto'
import type { Tx } from '../../../kernel/transaction.ts'
import { getEntityManager, markTransactionRollbackOnly } from '../../../platform/db/transaction.ts'
import type { AuditEntry } from '../domain/audit-entry.ts'
import type { AuditWriter } from '../application/ports.ts'

const maximumAdditionalRetries = 3
const retryablePostgresCodes = new Set(['40001', '40P01', '55P03'])

function readErrorCode(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }
  if ('code' in value && typeof value.code === 'string') {
    return value.code
  }
  if ('driverError' in value) {
    return readErrorCode(value.driverError)
  }
  return undefined
}

function isRetryableWriteError(error: unknown): boolean {
  const code = readErrorCode(error)
  return code !== undefined && retryablePostgresCodes.has(code)
}

export class TypeOrmAuditWriter implements AuditWriter {
  async append(tx: Tx, entry: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<void> {
    const manager = getEntityManager(tx)
    const queryRunner = manager.queryRunner
    if (!queryRunner?.isTransactionActive) {
      throw new Error('Audit trail writes require an active transaction')
    }

    const savepoint = `audit_write_${randomUUID().replaceAll('-', '')}`
    try {
      for (let attempt = 0; attempt <= maximumAdditionalRetries; attempt += 1) {
        await queryRunner.query(`SAVEPOINT "${savepoint}"`)
        try {
          await manager.query(`
            INSERT INTO "audit_entries" (
              "actor_id", "actor_type", "ip_address", "url", "method", "status_code",
              "request_id", "action", "entity", "entity_id", "previous_state", "current_state"
            ) VALUES (
              $1, $2, $3::inet, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb
            )
          `, [
            entry.actorId,
            entry.actorType,
            entry.ipAddress,
            entry.url,
            entry.method,
            entry.statusCode,
            entry.requestId,
            entry.action,
            entry.entity,
            entry.entityId,
            JSON.stringify(entry.previousState),
            JSON.stringify(entry.currentState),
          ])
          await queryRunner.query(`RELEASE SAVEPOINT "${savepoint}"`)
          return
        } catch (error) {
          try {
            await queryRunner.query(`ROLLBACK TO SAVEPOINT "${savepoint}"`)
            await queryRunner.query(`RELEASE SAVEPOINT "${savepoint}"`)
          } catch (recoveryError) {
            throw new AggregateError(
              [error, recoveryError],
              'Audit write failed and its transaction savepoint could not be restored',
              { cause: recoveryError },
            )
          }

          if (attempt === maximumAdditionalRetries || !isRetryableWriteError(error)) {
            throw error
          }
        }
      }
    } catch (error) {
      markTransactionRollbackOnly(tx, error)
      throw error
    }
  }
}
