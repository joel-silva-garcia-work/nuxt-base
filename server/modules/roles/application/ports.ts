import type { Tx } from '../../../kernel/transaction.ts'
import type { RoleRecord } from '../domain/role.ts'

export interface RoleRepository {
  findById(tx: Tx, id: string): Promise<RoleRecord | null>
  findByIds(tx: Tx, ids: readonly string[]): Promise<RoleRecord[]>
}
