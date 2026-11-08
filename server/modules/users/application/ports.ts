import type { Tx } from '../../../kernel/transaction.ts'
import type { UserRecord } from '../domain/user.ts'

export interface UserRepository {
  findActiveById(tx: Tx, id: string): Promise<UserRecord | null>
  findByNormalizedEmail(tx: Tx, email: string): Promise<UserRecord | null>
}
