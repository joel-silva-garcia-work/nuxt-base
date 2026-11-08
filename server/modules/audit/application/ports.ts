import type { Tx } from '../../../kernel/transaction.ts'
import type { AuditEntry } from '../domain/audit-entry.ts'

export interface AuditWriter {
  append(tx: Tx, entry: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<void>
}
