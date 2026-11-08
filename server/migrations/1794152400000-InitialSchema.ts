import type { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1794152400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "name" varchar(160) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "ck_users_email_normalized" CHECK ("email" = lower("email"))
      )
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_users_email_active"
      ON "users" ("email")
      WHERE "deleted_at" IS NULL
    `)

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "description" varchar(500),
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_roles" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_roles_name" ON "roles" ("name")`)

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" varchar(120) NOT NULL,
        "method" varchar(10) NOT NULL,
        "route_pattern" varchar(255) NOT NULL,
        "description" varchar(500) NOT NULL,
        "module" varchar(80) NOT NULL,
        "access_policy" varchar(20) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "ck_permissions_access_policy"
          CHECK ("access_policy" IN ('PUBLIC', 'AUTHENTICATED', 'RBAC')),
        CONSTRAINT "ck_permissions_method_upper"
          CHECK ("method" = upper("method"))
      )
    `)
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_permissions_key" ON "permissions" ("key")`)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_permissions_method_route"
      ON "permissions" ("method", "route_pattern")
    `)

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id")`)

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id")
          REFERENCES "permissions" ("id") ON DELETE RESTRICT
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id")`)

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(128) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "sessions" ("token_hash")`)
    await queryRunner.query(`CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id")`)
    await queryRunner.query(`CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at")`)

    await queryRunner.query(`
      CREATE TABLE "rate_limit_buckets" (
        "key" varchar(160) NOT NULL,
        "window_started_at" timestamptz NOT NULL,
        "request_count" integer NOT NULL DEFAULT 0,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rate_limit_buckets" PRIMARY KEY ("key", "window_started_at"),
        CONSTRAINT "ck_rate_limit_buckets_count" CHECK ("request_count" >= 0)
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "audit_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actor_id" uuid,
        "actor_type" varchar(10) NOT NULL,
        "ip_address" inet,
        "url" varchar(2048) NOT NULL,
        "method" varchar(10) NOT NULL,
        "status_code" smallint NOT NULL,
        "request_id" varchar(128) NOT NULL,
        "action" varchar(120) NOT NULL,
        "entity" varchar(120) NOT NULL,
        "entity_id" varchar(128),
        "previous_state" jsonb NOT NULL,
        "current_state" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_audit_entries" PRIMARY KEY ("id"),
        CONSTRAINT "ck_audit_entries_actor_type" CHECK ("actor_type" IN ('USER', 'SYSTEM')),
        CONSTRAINT "ck_audit_entries_status_code" CHECK ("status_code" BETWEEN 100 AND 599),
        CONSTRAINT "ck_audit_entries_previous_state_object"
          CHECK (jsonb_typeof("previous_state") = 'object'),
        CONSTRAINT "ck_audit_entries_current_state_object"
          CHECK (jsonb_typeof("current_state") = 'object')
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_audit_entries_created_at" ON "audit_entries" ("created_at")`)
    await queryRunner.query(`
      CREATE INDEX "idx_audit_entries_entity"
      ON "audit_entries" ("entity", "entity_id")
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "audit_entries"')
    await queryRunner.query('DROP TABLE "rate_limit_buckets"')
    await queryRunner.query('DROP TABLE "sessions"')
    await queryRunner.query('DROP TABLE "role_permissions"')
    await queryRunner.query('DROP TABLE "user_roles"')
    await queryRunner.query('DROP TABLE "permissions"')
    await queryRunner.query('DROP TABLE "roles"')
    await queryRunner.query('DROP TABLE "users"')
  }
}
