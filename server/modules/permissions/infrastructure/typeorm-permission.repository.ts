import type { PermissionRepository } from '../application/ports.ts'
import type { PermissionRecord } from '../domain/permission.ts'
import { getEntityManager } from '../../../platform/db/transaction.ts'
import type { Tx } from '../../../kernel/transaction.ts'
import { PermissionEntitySchema } from './permission.entity.ts'

export class TypeOrmPermissionRepository implements PermissionRepository {
  async findActiveByIds(tx: Tx, ids: readonly string[]): Promise<PermissionRecord[]> {
    if (ids.length === 0) {
      return []
    }

    const permissions = await getEntityManager(tx).getRepository(PermissionEntitySchema)
      .createQueryBuilder('permission')
      .where('permission.id IN (:...ids)', { ids: [...ids] })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .getMany()
    return permissions.map(permission => this.toRecord(permission))
  }

  async findActiveByMethodAndRoute(
    tx: Tx,
    method: string,
    routePattern: string,
  ): Promise<PermissionRecord | null> {
    const permission = await getEntityManager(tx)
      .getRepository(PermissionEntitySchema)
      .findOneBy({ method, routePattern, isActive: true })
    return permission ? this.toRecord(permission) : null
  }

  private toRecord(permission: {
    id: string
    key: string
    method: string
    routePattern: string
    description: string
    module: string
    accessPolicy: 'PUBLIC' | 'AUTHENTICATED' | 'RBAC'
    isActive: boolean
  }): PermissionRecord {
    return {
      id: permission.id,
      key: permission.key,
      method: permission.method,
      routePattern: permission.routePattern,
      description: permission.description,
      module: permission.module,
      accessPolicy: permission.accessPolicy,
      isActive: permission.isActive,
    }
  }
}
