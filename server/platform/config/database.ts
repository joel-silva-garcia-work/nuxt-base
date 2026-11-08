import { z } from 'zod'

const databaseName = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/)
const databaseUser = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/)
const sslMode = z.enum(['disable', 'require'])

const environmentSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65_535),
  name: databaseName,
  user: databaseUser,
  password: z.string().min(1).refine(value => !/[\r\n]/.test(value)),
  ssl: sslMode,
  poolMax: z.coerce.number().int().min(1).max(100),
})

export interface DatabaseConfig {
  readonly host: string
  readonly port: number
  readonly database: string
  readonly user: string
  readonly password: string
  readonly ssl: false | { readonly rejectUnauthorized: true }
  readonly poolMax: number
}

export interface DatabaseConfigs {
  readonly development: DatabaseConfig
  readonly test: DatabaseConfig
}

type Environment = Readonly<Record<string, string | undefined>>
type DatabasePrefix = 'DB' | 'TEST_DB'

const localHosts = new Set(['localhost', '127.0.0.1', '::1', 'postgres'])
const environmentFieldNames: Readonly<Record<string, string>> = {
  host: 'HOST',
  port: 'PORT',
  name: 'NAME',
  user: 'USER',
  password: 'PASSWORD',
  ssl: 'SSL',
  poolMax: 'POOL_MAX',
}

export function parseDatabaseConfig(
  environment: Environment,
  prefix: DatabasePrefix,
): DatabaseConfig {
  const parsed = environmentSchema.safeParse({
    host: environment[`${prefix}_HOST`],
    port: environment[`${prefix}_PORT`],
    name: environment[`${prefix}_NAME`],
    user: environment[`${prefix}_USER`],
    password: environment[`${prefix}_PASSWORD`],
    ssl: environment[`${prefix}_SSL`],
    poolMax: environment[`${prefix}_POOL_MAX`] ?? '10',
  })

  if (!parsed.success) {
    const invalidFields = [...new Set(
      parsed.error.issues.map(issue => {
        const field = String(issue.path[0])
        return `${prefix}_${environmentFieldNames[field] ?? field.toUpperCase()}`
      }),
    )]
    throw new Error(`Invalid database configuration: ${invalidFields.join(', ')}`)
  }

  const host = parsed.data.host.toLowerCase()
  if (parsed.data.ssl === 'disable' && !localHosts.has(host)) {
    throw new Error(`Invalid database configuration: ${prefix}_SSL must be require for remote hosts`)
  }

  return {
    host: parsed.data.host,
    port: parsed.data.port,
    database: parsed.data.name,
    user: parsed.data.user,
    password: parsed.data.password,
    ssl: parsed.data.ssl === 'require' ? { rejectUnauthorized: true } : false,
    poolMax: parsed.data.poolMax,
  }
}

export function loadDatabaseConfigs(environment: Environment = process.env): DatabaseConfigs {
  const development = parseDatabaseConfig(environment, 'DB')
  const test = parseDatabaseConfig(environment, 'TEST_DB')

  if (development.database === test.database) {
    throw new Error('Invalid database configuration: DB_NAME and TEST_DB_NAME must differ')
  }
  if (development.user === test.user) {
    throw new Error('Invalid database configuration: DB_USER and TEST_DB_USER must differ')
  }

  return { development, test }
}
