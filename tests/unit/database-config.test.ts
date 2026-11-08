import { describe, expect, it } from 'vitest'
import { loadDatabaseConfigs, parseDatabaseConfig } from '../../server/platform/config/database.ts'

const validEnvironment = {
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
  TEST_DB_PASSWORD: 'local-password',
  TEST_DB_SSL: 'disable',
}

describe('database configuration', () => {
  it('loads separated development and test databases', () => {
    const configs = loadDatabaseConfigs(validEnvironment)

    expect(configs.development.database).toBe('nuxt_base')
    expect(configs.test.database).toBe('nuxt_base_test')
    expect(configs.development.ssl).toBe(false)
    expect(configs.development.poolMax).toBe(10)
    expect(configs.test.poolMax).toBe(10)
  })

  it('accepts a bounded connection pool size', () => {
    const config = parseDatabaseConfig({
      ...validEnvironment,
      DB_POOL_MAX: '4',
    }, 'DB')

    expect(config.poolMax).toBe(4)
    expect(() => parseDatabaseConfig({
      ...validEnvironment,
      DB_POOL_MAX: '101',
    }, 'DB')).toThrow('DB_POOL_MAX')
  })

  it('rejects equal development and test database names', () => {
    expect(() => loadDatabaseConfigs({
      ...validEnvironment,
      TEST_DB_NAME: validEnvironment.DB_NAME,
    })).toThrow('DB_NAME and TEST_DB_NAME must differ')
  })

  it('rejects shared development and test roles', () => {
    expect(() => loadDatabaseConfigs({
      ...validEnvironment,
      TEST_DB_USER: validEnvironment.DB_USER,
    })).toThrow('DB_USER and TEST_DB_USER must differ')
  })

  it('requires verified TLS for non-local hosts', () => {
    expect(() => parseDatabaseConfig({
      ...validEnvironment,
      DB_HOST: 'db.example.internal',
    }, 'DB')).toThrow('DB_SSL must be require for remote hosts')
  })

  it('enables certificate verification for remote TLS connections', () => {
    const config = parseDatabaseConfig({
      ...validEnvironment,
      DB_HOST: 'db.example.internal',
      DB_SSL: 'require',
    }, 'DB')

    expect(config.ssl).toEqual({ rejectUnauthorized: true })
  })

  it('does not disclose password values in validation errors', () => {
    expect(() => parseDatabaseConfig({
      ...validEnvironment,
      DB_PASSWORD: '',
    }, 'DB')).toThrow('DB_PASSWORD')
    expect(() => parseDatabaseConfig({
      ...validEnvironment,
      DB_PASSWORD: '',
    }, 'DB')).not.toThrow('local-password')
  })
})
