import { getDataSource } from '../../../server/composition/persistence.ts'
import {
  assertConnectedTestDatabase,
  assertTestDatabaseResetAllowed,
} from '../support/test-database.ts'

export async function setup(): Promise<void> {
  assertTestDatabaseResetAllowed()
  const dataSource = getDataSource('test')

  try {
    await dataSource.initialize()
    await assertConnectedTestDatabase(dataSource)
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}
