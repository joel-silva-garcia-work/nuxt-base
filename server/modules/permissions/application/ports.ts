import type { Tx } from '../../../kernel/transaction.ts'
import type { PermissionRecord } from '../domain/permission.ts'

export interface PermissionRepository {
  findActiveByIds(tx: Tx, ids: readonly string[]): Promise<PermissionRecord[]>
  findActiveByMethodAndRoute(tx: Tx, method: string, routePattern: string): Promise<PermissionRecord | null>
}
