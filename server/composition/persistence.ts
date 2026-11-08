import { parseDatabaseConfig } from '../platform/config/database.ts'
import { createPostgresDataSource } from '../platform/db/data-source.ts'
import type { DataSource } from 'typeorm'
import { AuditEntryEntitySchema } from '../modules/audit/infrastructure/audit-entry.entity.ts'
import { RateLimitBucketEntitySchema } from '../modules/auth/infrastructure/rate-limit.entity.ts'
import { SessionEntitySchema } from '../modules/auth/infrastructure/session.entity.ts'
import { PermissionEntitySchema } from '../modules/permissions/infrastructure/permission.entity.ts'
import { RoleEntitySchema } from '../modules/roles/infrastructure/role.entity.ts'
import { UserEntitySchema } from '../modules/users/infrastructure/user.entity.ts'

export const persistenceEntities = [
  UserEntitySchema,
  RoleEntitySchema,
  PermissionEntitySchema,
  SessionEntitySchema,
  RateLimitBucketEntitySchema,
  AuditEntryEntitySchema,
]

export type DatabaseTarget = 'development' | 'test'

let targetInUse: DatabaseTarget | undefined
let dataSource: DataSource | undefined
let initialization: Promise<DataSource> | undefined

export function getDataSource(target: DatabaseTarget = 'development'): DataSource {
  if (dataSource) {
    if (targetInUse !== target) {
      throw new Error(`This process already owns the ${targetInUse} database DataSource`)
    }
    return dataSource
  }

  const config = parseDatabaseConfig(process.env, target === 'development' ? 'DB' : 'TEST_DB')
  targetInUse = target
  dataSource = createPostgresDataSource(config, persistenceEntities)
  return dataSource
}

export async function initializeDataSource(
  target: DatabaseTarget = 'development',
): Promise<DataSource> {
  const source = getDataSource(target)
  if (source.isInitialized) {
    return source
  }

  initialization ??= source.initialize()
    .then(() => source)
    .catch((error: unknown) => {
      initialization = undefined
      throw error
    })
  return initialization
}

export async function closeDataSource(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy()
  }
  initialization = undefined
}
