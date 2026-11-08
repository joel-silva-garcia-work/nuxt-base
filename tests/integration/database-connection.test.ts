import { describe, expect, it } from 'vitest'
import {
  assertTestDatabaseResetAllowed,
  checkTestDatabaseConnection,
} from './support/test-database.ts'

describe('PostgreSQL test database', () => {
  it('connects to the dedicated test database with a non-superuser role', async () => {
    const config = assertTestDatabaseResetAllowed()
    await expect(checkTestDatabaseConnection(config)).resolves.toBeUndefined()
  })
})
