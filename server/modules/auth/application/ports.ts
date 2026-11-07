import type { Tx } from '../../../kernel/transaction.ts'
import type { SessionRecord } from '../domain/session.ts'

export interface SessionRepository {
  findActiveByTokenHash(tx: Tx, tokenHash: string, now: Date): Promise<SessionRecord | null>
  revoke(tx: Tx, id: string, revokedAt: Date): Promise<void>
}
