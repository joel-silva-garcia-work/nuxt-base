import pg from 'pg'
import { DataSource, type EntitySchema } from 'typeorm'
import type { DatabaseConfig } from '../config/database.ts'
import { POSTGRES_SCHEMA } from './sql.ts'

export function createPostgresDataSource(
  config: DatabaseConfig,
  entities: EntitySchema[],
): DataSource {
  return new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.user,
    password: config.password,
    ssl: config.ssl,
    schema: POSTGRES_SCHEMA,
    entities,
    migrations: [],
    synchronize: false,
    migrationsRun: false,
    logging: false,
    poolSize: config.poolMax,
    connectTimeoutMS: 5_000,
    driver: pg,
  })
}
