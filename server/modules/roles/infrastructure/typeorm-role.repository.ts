import { In } from 'typeorm'
import type { RoleRepository } from '../application/ports.ts'
import type { RoleRecord } from '../domain/role.ts'
import { getEntityManager } from '../../../platform/db/transaction.ts'
import type { Tx } from '../../../kernel/transaction.ts'
import { RoleEntitySchema } from './role.entity.ts'

export class TypeOrmRoleRepository implements RoleRepository {
  async findById(tx: Tx, id: string): Promise<RoleRecord | null> {
    const role = await getEntityManager(tx).getRepository(RoleEntitySchema).findOneBy({ id })
    return role ? this.toRecord(role) : null
  }

  async findByIds(tx: Tx, ids: readonly string[]): Promise<RoleRecord[]> {
    if (ids.length === 0) {
      return []
    }

    const roles = await getEntityManager(tx)
      .getRepository(RoleEntitySchema)
      .findBy({ id: In([...ids]) })
    return roles.map(role => this.toRecord(role))
  }

  private toRecord(role: {
    id: string
    name: string
    description: string | null
    isSystem: boolean
    createdAt: Date
    updatedAt: Date
  }): RoleRecord {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }
  }
}
