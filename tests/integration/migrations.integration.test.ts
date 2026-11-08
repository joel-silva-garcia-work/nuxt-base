import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PostgresTransactionRunner, getEntityManager } from '../../server/platform/db/transaction.ts'
import { getDataSource, persistenceMigrations } from '../../server/composition/persistence.ts'
import { RecordAuditChange, type AuditChange } from '../../server/modules/audit/index.ts'
import { TypeOrmAuditWriter } from '../../server/modules/audit/infrastructure/typeorm-audit.writer.ts'
import { resolveTrustedClientIpAddress } from '../../server/modules/audit/domain/trusted-client-ip.ts'
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
const expectedMigrationNames = new Set(persistenceMigrations.map(migration => migration.name))
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

describe('PostgreSQL migrations and audit trail', () => {
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
      if (applied.some(migration => !expectedMigrationNames.has(migration.name))) {
        throw new Error('Refusing to reset a test database containing unrecognized migrations')
      }
      for (let index = 0; index < applied.length; index += 1) {
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

  it('applies and reverts the schema and audit request index migrations', async () => {
    expect(await dataSource.runMigrations()).toHaveLength(2)
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

    const auditIndexes: Array<{ indexname: string }> = await dataSource.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'audit_entries'
    `)
    expect(auditIndexes.map(({ indexname }) => indexname)).toContain('idx_audit_entries_request_id')

    await dataSource.undoLastMigration()
    expect(await publicTables()).toContain('audit_entries')
    expect(await dataSource.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'idx_audit_entries_request_id'
    `)).toEqual([])

    expect(await dataSource.runMigrations()).toHaveLength(1)
    expect(await dataSource.runMigrations()).toHaveLength(0)
    expect(await dataSource.showMigrations()).toBe(false)
  })

  it('keeps the migration schema aligned with TypeORM metadata', async () => {
    const schemaDiff = await dataSource.driver.createSchemaBuilder().log()
    expect(
      schemaDiff.upQueries.map(({ query }) => query),
      'The migration must create a schema that matches TypeORM metadata',
    ).toEqual([])
  })

  it('finds a normalized email only among non-deleted users', async () => {
    const deletedUserId = randomUUID()
    const activeUserId = randomUUID()
    const deletedOnlyUserId = randomUUID()
    const email = `f22-${randomUUID()}@example.test`
    const deletedOnlyEmail = `f22-${randomUUID()}@example.test`
    const users = new TypeOrmUserRepository()
    const runner = new PostgresTransactionRunner(dataSource)

    await runner.run(async (tx) => {
      const manager = getEntityManager(tx)
      await manager.insert(UserEntitySchema, [
        {
          id: deletedUserId,
          email,
          name: 'Deleted user',
          passwordHash: 'not-a-real-password-hash',
          deletedAt: new Date(),
        },
        {
          id: activeUserId,
          email,
          name: 'Active replacement',
          passwordHash: 'not-a-real-password-hash',
        },
        {
          id: deletedOnlyUserId,
          email: deletedOnlyEmail,
          name: 'Deleted only user',
          passwordHash: 'not-a-real-password-hash',
          deletedAt: new Date(),
        },
      ])

      await expect(users.findByNormalizedEmail(tx, email.toUpperCase()))
        .resolves.toMatchObject({ id: activeUserId, email })
      await expect(users.findByNormalizedEmail(tx, deletedOnlyEmail)).resolves.toBeNull()
    })
  })

  it('persists sanitized audit state in the business transaction and rolls both back together', async () => {
    const requestId = `audit-rollback-${randomUUID()}`
    const roleId = randomUUID()
    const change = createAuditChange(requestId)
    const runner = new PostgresTransactionRunner(dataSource)
    const recorder = new RecordAuditChange(new TypeOrmAuditWriter())
    const failure = new Error('rollback business write and audit entry')

    await expect(runner.run(async (tx) => {
      const manager = getEntityManager(tx)
      await manager.insert(RoleEntitySchema, { id: roleId, name: `audit-${roleId}` })
      await expect(recorder.record(tx, change)).resolves.toBe(true)
      const rows: Array<{
        actor_type: string
        ip_address: string
        url: string
        previous_state: Record<string, unknown>
        current_state: Record<string, unknown>
        created_at: Date
      }> = await manager.query(`
        SELECT actor_type, ip_address, url, previous_state, current_state, created_at
        FROM audit_entries WHERE request_id = $1
      `, [requestId])

      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        actor_type: 'SYSTEM',
        ip_address: '192.0.2.10',
        url: '/api/users/1',
        previous_state: { name: 'Before' },
        current_state: { name: 'After' },
      })
      expect(rows[0]?.created_at).toBeInstanceOf(Date)
      expect(JSON.stringify(rows[0])).not.toContain('passwordHash')
      throw failure
    })).rejects.toBe(failure)

    await expect(dataSource.query('SELECT id FROM roles WHERE id = $1', [roleId])).resolves.toEqual([])
    await expect(dataSource.query(
      'SELECT id FROM audit_entries WHERE request_id = $1',
      [requestId],
    )).resolves.toEqual([])
  })

  it('retries only recoverable audit write errors up to three times and rolls back on exhaustion', async () => {
    const requestId = `audit-retry-${randomUUID()}`
    const failedRequestId = `audit-retry-exhausted-${randomUUID()}`
    const roleId = randomUUID()
    const runner = new PostgresTransactionRunner(dataSource)
    const recorder = new RecordAuditChange(new TypeOrmAuditWriter())
    const sequenceName = 'audit_test_retry_sequence'
    const functionName = 'audit_test_retry_once'
    const triggerName = 'audit_test_retry_trigger'

    try {
      await dataSource.query(`CREATE SEQUENCE "${sequenceName}"`)
      await dataSource.query(`
        CREATE FUNCTION "${functionName}"() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF nextval('${sequenceName}') = 1 THEN
            RAISE EXCEPTION 'transient audit failure' USING ERRCODE = '40001';
          END IF;
          RETURN NEW;
        END
        $$
      `)
      await dataSource.query(`
        CREATE TRIGGER "${triggerName}" BEFORE INSERT ON audit_entries
        FOR EACH ROW EXECUTE FUNCTION "${functionName}"()
      `)

      await expect(runner.run(tx => recorder.record(tx, createAuditChange(requestId))))
        .resolves.toBe(true)
      const successfulAttempts: Array<{ last_value: string }> = await dataSource.query(
        `SELECT last_value::text FROM "${sequenceName}"`,
      )
      expect(successfulAttempts[0]?.last_value).toBe('2')

      await dataSource.query(`
        CREATE OR REPLACE FUNCTION "${functionName}"() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          PERFORM nextval('${sequenceName}');
          RAISE EXCEPTION 'transient audit failure' USING ERRCODE = '40001';
        END
        $$
      `)
      await dataSource.query(`ALTER SEQUENCE "${sequenceName}" RESTART WITH 1`)

      let auditFailure: unknown
      await expect(runner.run(async (tx) => {
        await getEntityManager(tx).insert(RoleEntitySchema, {
          id: roleId,
          name: `audit-retry-${roleId}`,
        })
        try {
          await recorder.record(tx, createAuditChange(failedRequestId))
        } catch (error) {
          auditFailure = error
        }
      })).rejects.toThrow('marked for rollback')
      expect(auditFailure).toMatchObject({ code: '40001' })

      const exhaustedAttempts: Array<{ last_value: string }> = await dataSource.query(
        `SELECT last_value::text FROM "${sequenceName}"`,
      )
      expect(exhaustedAttempts[0]?.last_value).toBe('4')
      await expect(dataSource.query('SELECT id FROM roles WHERE id = $1', [roleId])).resolves.toEqual([])
      await expect(dataSource.query(
        'SELECT id FROM audit_entries WHERE request_id = $1',
        [failedRequestId],
      )).resolves.toEqual([])
    } finally {
      await dataSource.query(`DROP TRIGGER IF EXISTS "${triggerName}" ON audit_entries`)
      await dataSource.query(`DROP FUNCTION IF EXISTS "${functionName}"()`)
      await dataSource.query(`DROP SEQUENCE IF EXISTS "${sequenceName}"`)
    }
  })

  function createAuditChange(requestId: string): AuditChange {
    return {
      actor: { type: 'SYSTEM' },
      ipAddress: resolveTrustedClientIpAddress('192.0.2.10', null),
      url: '/api/users/1?password=not-logged#profile',
      method: 'PATCH',
      statusCode: 200,
      requestId,
      action: 'users.update',
      entity: 'user',
      entityId: '1',
      previous: { name: 'Before', passwordHash: 'not-logged' },
      current: { name: 'After', passwordHash: 'also-not-logged' },
    }
  }

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
