import { describe, expect, it, vi } from 'vitest'
import { toOffsetLimit } from '../../server/kernel/pagination.ts'
import { persistenceEntities } from '../../server/composition/persistence.ts'
import { createPostgresDataSource } from '../../server/platform/db/data-source.ts'
import { PermissionEntitySchema } from '../../server/modules/permissions/infrastructure/permission.entity.ts'
import { RoleEntitySchema } from '../../server/modules/roles/infrastructure/role.entity.ts'
import { SessionEntitySchema } from '../../server/modules/auth/infrastructure/session.entity.ts'
import { UserEntitySchema } from '../../server/modules/users/infrastructure/user.entity.ts'

describe('persistence foundations', () => {
  it('registers each persistence entity once', () => {
    const names = persistenceEntities.map(entity => entity.options.name)

    expect(names).toEqual(['User', 'Role', 'Permission', 'Session', 'RateLimitBucket', 'AuditEntry'])
    expect(new Set(names).size).toBe(names.length)
    expect(UserEntitySchema.options.relations?.roles?.joinTable).toMatchObject({
      name: 'user_roles',
    })
    expect(RoleEntitySchema.options.relations?.permissions?.joinTable).toMatchObject({
      name: 'role_permissions',
    })
    expect(PermissionEntitySchema.options.indices).toContainEqual(expect.objectContaining({
      name: 'uq_permissions_method_route',
      unique: true,
    }))
  })

  it('keeps credential hashes out of default selections', () => {
    expect(UserEntitySchema.options.columns?.passwordHash?.select).toBe(false)
    expect(SessionEntitySchema.options.columns?.tokenHash?.select).toBe(false)
  })

  it('bounds the connection pool and disables schema synchronization', () => {
    const dataSource = createPostgresDataSource({
      host: '127.0.0.1',
      port: 5432,
      database: 'nuxt_base',
      user: 'nuxt_base_app',
      password: 'unit-test-only',
      ssl: false,
      poolMax: 4,
    }, persistenceEntities)

    expect(dataSource.options.synchronize).toBe(false)
    expect(dataSource.options.migrationsRun).toBe(false)
    expect(dataSource.options.poolSize).toBe(4)
  })

  it('creates a fresh DataSource after closing the previous one', async () => {
    vi.stubEnv('DB_HOST', '127.0.0.1')
    vi.stubEnv('DB_PORT', '5432')
    vi.stubEnv('DB_NAME', 'nuxt_base')
    vi.stubEnv('DB_USER', 'nuxt_base_app')
    vi.stubEnv('DB_PASSWORD', 'unit-test-only')
    vi.stubEnv('DB_SSL', 'disable')
    vi.resetModules()

    const persistence = await import('../../server/composition/persistence.ts')

    try {
      const first = persistence.getDataSource()
      await persistence.closeDataSource()
      expect(persistence.getDataSource()).not.toBe(first)
    } finally {
      await persistence.closeDataSource()
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })

  it('calculates bounded page offsets', () => {
    expect(toOffsetLimit(3, 25)).toEqual({ offset: 50, limit: 25 })
    expect(() => toOffsetLimit(1, 101)).toThrow(RangeError)
    expect(() => toOffsetLimit(0, 25)).toThrow(RangeError)
  })
})
