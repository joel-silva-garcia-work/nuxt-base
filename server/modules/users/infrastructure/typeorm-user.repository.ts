import { IsNull } from 'typeorm'
import type { UserRepository } from '../application/ports.ts'
import type { UserRecord } from '../domain/user.ts'
import { UserEntitySchema } from './user.entity.ts'
import { getEntityManager } from '../../../platform/db/transaction.ts'
import type { Tx } from '../../../kernel/transaction.ts'

export class TypeOrmUserRepository implements UserRepository {
  async findActiveById(tx: Tx, id: string): Promise<UserRecord | null> {
    const user = await getEntityManager(tx).getRepository(UserEntitySchema).findOneBy({
      id,
      isActive: true,
      deletedAt: IsNull(),
    })
    return user ? this.toRecord(user) : null
  }

  async findByNormalizedEmail(tx: Tx, email: string): Promise<UserRecord | null> {
    const user = await getEntityManager(tx).getRepository(UserEntitySchema).findOneBy({
      email: email.toLowerCase(),
      deletedAt: IsNull(),
    })
    return user ? this.toRecord(user) : null
  }

  private toRecord(user: {
    id: string
    email: string
    name: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): UserRecord {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    }
  }
}
