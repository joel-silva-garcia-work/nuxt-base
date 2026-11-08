import { describe, expect, it } from 'vitest'
import { assertTestDatabaseResetAllowed } from '../integration/support/test-database.ts'

const environment = {
  DB_HOST: 'postgres',
  DB_PORT: '5432',
  DB_NAME: 'nuxt_base',
  DB_USER: 'nuxt_base_app',
  DB_PASSWORD: 'local-password',
  DB_SSL: 'disable',
  TEST_DB_HOST: 'postgres',
  TEST_DB_PORT: '5432',
  TEST_DB_NAME: 'nuxt_base_test',
  TEST_DB_USER: 'nuxt_base_test_app',
  TEST_DB_PASSWORD: 'test-password',
  TEST_DB_SSL: 'disable',
}

describe('integration test database guard', () => {
  it('does not treat NODE_ENV=test as permission to reset a database', () => {
    expect(() => assertTestDatabaseResetAllowed({
      ...environment,
      NODE_ENV: 'test',
    })).toThrow('TEST_DB_ALLOW_SCHEMA_RESET=true')
  })

  it('requires an explicitly named test database', () => {
    expect(() => assertTestDatabaseResetAllowed({
      ...environment,
      TEST_DB_ALLOW_SCHEMA_RESET: 'true',
      TEST_DB_NAME: 'nuxt_base',
    })).toThrow('DB_NAME and TEST_DB_NAME must differ')
    expect(() => assertTestDatabaseResetAllowed({
      ...environment,
      TEST_DB_ALLOW_SCHEMA_RESET: 'true',
      TEST_DB_NAME: 'scratch',
    })).toThrow('must end with _test')
  })

  it('permits a separate _test database only with explicit reset opt-in', () => {
    expect(assertTestDatabaseResetAllowed({
      ...environment,
      TEST_DB_ALLOW_SCHEMA_RESET: 'true',
    }).database).toBe('nuxt_base_test')
  })
})
