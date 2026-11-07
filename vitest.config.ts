import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // Solo contra la base TEST_DB_* (guarda en cada suite). Secuencial: comparten la base de pruebas.
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/integration/setup/global-setup.ts'],
          environment: 'node',
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
    ],
  },
})
