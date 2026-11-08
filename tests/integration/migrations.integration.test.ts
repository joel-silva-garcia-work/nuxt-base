import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PostgresTransactionRunner, getEntityManager } from '../../server/platform/db/transaction.ts'
import { getDataSource } from '../../server/composition/persistence.ts'
import { InitialSchema1794152400000 } from '../../server/migrations/1794152400000-InitialSchema.ts'
import { TypeOrmPermissionRepository } from '../../server/modules/permissions/infrastructure/typeorm-permission.repository.ts'
import { PermissionEntitySchema } from '../../server/modules/permissions/infrastructure/permission.entity.ts'
import { TypeOrmRoleRepository } from '../../server/modules/roles/infrastructure/typeorm-role.repository.ts'
import { RoleEntitySchema } from '../../server/modules/roles/infrastructure/role.entity.ts'
import { TypeOrmUserRepository } from '../../server/modules/users/infrastructure/typeorm-user.repository.ts'
import { UserEntitySchema } from '../../server/modules/users/infrastructure/user.entity.ts'
import {
  assertConnectedTestDatabase,
  assertTestDatabaseResetAllowed,
} from './support/test-database.ts'

const dataSource = getDataSource('test')
const applicationTables = new Set([
  'audit_entries',
  'permissions',
  'rate_limit_buckets',
  'role_permissions',
  'roles',
  'sessions',
  'user_roles',
  'users',
])

async function publicTables(): Promise<string[]> {
  const rows: Array<{ table_name: string }> = await dataSource.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  return rows.map(row => row.table_name)
}

async function expectSqlState(
  queryRunner: ReturnType<typeof dataSource.createQueryRunner>,
  sql: string,
  parameters: unknown[],
  code: string,
): Promise<void> {
  const savepoint = `expected_constraint_${randomUUID().replaceAll('-', '')}`
  await queryRunner.query(`SAVEPOINT "${savepoint}"`)
  try {
    await expect(queryRunner.query(sql, parameters)).rejects.toMatchObject({ code })
  } finally {
    await queryRunner.query(`ROLLBACK TO SAVEPOINT "${savepoint}"`)
    await queryRunner.query(`RELEASE SAVEPOINT "${savepoint}"`)
  }
}

describe('initial PostgreSQL migration', () => {
  beforeAll(async () => {
    assertTestDatabaseResetAllowed()
    await dataSource.initialize()
    await assertConnectedTestDatabase(dataSource)

    const tables = await publicTables()
    const unknownTables = tables.filter(table => table !== 'migrations' && !applicationTables.has(table))
    if (unknownTables.length > 0) {
      throw new Error('Refusing to reset a test database containing unmanaged public tables')
    }

    if (tables.includes('migrations')) {
      const applied: Array<{ name: string }> = await dataSource.query('SELECT name FROM "migrations"')
      if (applied.some(migration => migration.name !== InitialSchema1794152400000.name)) {
        throw new Error('Refusing to reset a test database containing unrecognized migrations')
      }
      if (applied.length > 0) {
        await dataSource.undoLastMigration()
      }
    } else if (tables.some(table => applicationTables.has(table))) {
      throw new Error('Refusing to reset application tables without a recorded migration')
    }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('applies, reverts, and reapplies the schema migration', async () => {
    expect(await dataSource.runMigrations()).toHaveLength(1)
    expect(await dataSource.showMigrations()).toBe(false)
    expect(await publicTables()).toEqual([
      'audit_entries',
      'migrations',
      'permissions',
      'rate_limit_buckets',
      'role_permissions',
      'roles',
      'sessions',
      'user_roles',
      'users',
    ])

    await dataSource.undoLastMigration()
    expect(await publicTables()).toEqual(['migrations'])

    expect(await dataSource.runMigrations()).toHaveLength(1)
    expect(await dataSource.runMigrations()).toHaveLength(0)
    expect(await dataSource.showMigrations()).toBe(false)
  })

  it('keeps the migration schema aligned with TypeORM metadata', async () => {
    const schemaDiff = await dataSource.driver.createSchemaBuilder().log()
    expect(schemaDiff.upQueries).toEqual([])
  })

  it('enforces normalized reusable emails, unique keys, and relation foreign keys', async () => {
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const userId = randomUUID()
      const roleId = randomUUID()
      const permissionId = randomUUID()
      const email = `f22-${userId}@example.test`
      await queryRunner.query(
        'INSERT INTO "users" ("id", "email", "name", "password_hash") VALUES ($1, $2, $3, $4)',
        [userId, email, 'F2.2 User', 'not-a-real-password-hash'],
      )

      await expectSqlState(
        queryRunner,
        'INSERT INTO "users" ("email", "name", "password_hash") VALUES ($1, $2, $3)',
        [email, 'Duplicate', 'not-a-real-password-hash'],
        '23505',
      )
      await expectSqlState(
        queryRunner,
        'INSERT INTO "users" ("email", "name", "password_hash") VALUES ($1, $2, $3)',
        [email.toUpperCase(), 'Not normalized', 'not-a-real-password-hash'],
        '23514',
      )
      await queryRunner.query('UPDATE "users" SET "deleted_at" = now() WHERE "id" = $1', [userId])
      await queryRunner.query(
        'INSERT INTO "users" ("email", "name", "password_hash") VALUES ($1, $2, $3)',
        [email, 'Replacement', 'not-a-real-password-hash'],
      )

      await queryRunner.query(
        'INSERT INTO "roles" ("id", "name") VALUES ($1, $2)',
        [roleId, `role-${roleId}`],
      )
      await expectSqlState(
        queryRunner,
        'INSERT INTO "roles" ("name") VALUES ($1)',
        [`role-${roleId}`],
        '23505',
      )
      await queryRunner.query(
        `INSERT INTO "permissions"
          ("id", "key", "method", "route_pattern", "description", "module", "access_policy")
         VALUES ($1, $2, 'GET', '/test', 'F2.2 test permission', 'test', 'RBAC')`,
        [permissionId, `permission-${permissionId}`],
      )
      await expectSqlState(
        queryRunner,
        `INSERT INTO "permissions"
          ("key", "method", "route_pattern", "description", "module", "access_policy")
         VALUES ($1, 'GET', '/test', 'Duplicate route', 'test', 'RBAC')`,
        [`permission-duplicate-${permissionId}`],
        '23505',
      )
      await expectSqlState(
        queryRunner,
        'INSERT INTO "user_roles" ("user_id", "role_id") VALUES ($1, $2)',
        [randomUUID(), roleId],
        '23503',
      )

      await queryRunner.query(
        'INSERT INTO "user_roles" ("user_id", "role_id") VALUES ($1, $2)',
        [userId, roleId],
      )
      await queryRunner.query(
        'INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2)',
        [roleId, permissionId],
      )
      await expectSqlState(
        queryRunner,
        'DELETE FROM "permissions" WHERE "id" = $1',
        [permissionId],
        '23503',
      )
      await queryRunner.query('DELETE FROM "roles" WHERE "id" = $1', [roleId])
      const relationCounts: Array<{ user_roles: string; role_permissions: string }> =
        await queryRunner.query(`
          SELECT
            (SELECT count(*)::text FROM "user_roles" WHERE "role_id" = $1) AS user_roles,
            (SELECT count(*)::text FROM "role_permissions" WHERE "role_id" = $1) AS role_permissions
        `, [roleId])
      expect(relationCounts[0]).toEqual({ user_roles: '0', role_permissions: '0' })
    } finally {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
    }
  })

  it('shares one transaction across user, role, and permission repositories', async () => {
    const userId = randomUUID()
    const roleId = randomUUID()
    const permissionId = randomUUID()
    const email = `f22-${userId}@example.test`
    const failure = new Error('rollback shared repository writes')

    const runner = new PostgresTransactionRunner(dataSource)
    const users = new TypeOrmUserRepository()
    const roles = new TypeOrmRoleRepository()
    const permissions = new TypeOrmPermissionRepository()

    await expect(runner.run(async (tx) => {
      const manager = getEntityManager(tx)
      await manager.insert(UserEntitySchema, {
        id: userId,
        email,
        name: 'F2.2 User',
        passwordHash: 'not-a-real-password-hash',
      })
      await manager.insert(RoleEntitySchema, {
        id: roleId,
        name: `role-${roleId}`,
      })
      await manager.insert(PermissionEntitySchema, {
        id: permissionId,
        key: `permission-${permissionId}`,
        method: 'GET',
        routePattern: '/test',
        description: 'F2.2 test permission',
        module: 'test',
        accessPolicy: 'RBAC',
      })
      await manager.query(
        'INSERT INTO "user_roles" ("user_id", "role_id") VALUES ($1, $2)',
        [userId, roleId],
      )
      await manager.query(
        'INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2)',
        [roleId, permissionId],
      )

      const [user, role, foundPermissions] = await Promise.all([
        users.findActiveById(tx, userId),
        roles.findById(tx, roleId),
        permissions.findActiveByIds(tx, [permissionId]),
      ])
      expect(user).toMatchObject({ id: userId, email })
      expect(user).not.toHaveProperty('passwordHash')
      expect(role).toMatchObject({ id: roleId })
      expect(foundPermissions).toMatchObject([{ id: permissionId, key: `permission-${permissionId}` }])
      throw failure
    })).rejects.toBe(failure)

    await runner.run(async (tx) => {
      await expect(users.findActiveById(tx, userId)).resolves.toBeNull()
      await expect(roles.findById(tx, roleId)).resolves.toBeNull()
      await expect(permissions.findActiveByIds(tx, [permissionId])).resolves.toEqual([])
    })
  })
})
