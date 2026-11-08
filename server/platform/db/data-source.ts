import pg from 'pg'
import { DataSource, type EntitySchema, type MigrationInterface } from 'typeorm'
import type { DatabaseConfig } from '../config/database.ts'
import { POSTGRES_SCHEMA } from './sql.ts'

export type MigrationClass = new () => MigrationInterface

export function createPostgresDataSource(
  config: DatabaseConfig,
  entities: EntitySchema[],
  migrations: MigrationClass[] = [],
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
    migrations,
    synchronize: false,
    migrationsRun: false,
    logging: false,
    poolSize: config.poolMax,
    connectTimeoutMS: 5_000,
    driver: pg,
  })
}
