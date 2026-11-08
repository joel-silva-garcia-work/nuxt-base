import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AuditTrailRequestIndex1794163200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "idx_audit_entries_request_id"
      ON "audit_entries" ("request_id")
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "idx_audit_entries_request_id"')
  }
}
