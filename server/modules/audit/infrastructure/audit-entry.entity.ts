import { EntitySchema } from 'typeorm'

export interface AuditEntryEntity {
  id: string
  actorId: string | null
  actorType: 'USER' | 'SYSTEM'
  ipAddress: string | null
  url: string
  method: string
  statusCode: number
  requestId: string
  action: string
  entity: string
  entityId: string | null
  previousState: Record<string, unknown>
  currentState: Record<string, unknown>
  createdAt: Date
}

export const AuditEntryEntitySchema = new EntitySchema<AuditEntryEntity>({
  name: 'AuditEntry',
  tableName: 'audit_entries',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      primaryKeyConstraintName: 'pk_audit_entries',
      generated: 'uuid',
    },
    actorId: { name: 'actor_id', type: 'uuid', nullable: true },
    actorType: { name: 'actor_type', type: 'varchar', length: 10 },
    ipAddress: { name: 'ip_address', type: 'inet', nullable: true },
    url: { type: 'varchar', length: 2048 },
    method: { type: 'varchar', length: 10 },
    statusCode: { name: 'status_code', type: 'smallint' },
    requestId: { name: 'request_id', type: 'varchar', length: 128 },
    action: { type: 'varchar', length: 120 },
    entity: { type: 'varchar', length: 120 },
    entityId: { name: 'entity_id', type: 'varchar', length: 128, nullable: true },
    previousState: { name: 'previous_state', type: 'jsonb' },
    currentState: { name: 'current_state', type: 'jsonb' },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
  },
  indices: [
    { name: 'idx_audit_entries_created_at', columns: ['createdAt'] },
    { name: 'idx_audit_entries_entity', columns: ['entity', 'entityId'] },
  ],
  checks: [
    {
      name: 'ck_audit_entries_actor_type',
      expression: `"actor_type" IN ('USER', 'SYSTEM')`,
    },
    {
      name: 'ck_audit_entries_status_code',
      expression: '"status_code" BETWEEN 100 AND 599',
    },
    {
      name: 'ck_audit_entries_previous_state_object',
      expression: "jsonb_typeof(\"previous_state\") = 'object'",
    },
    {
      name: 'ck_audit_entries_current_state_object',
      expression: "jsonb_typeof(\"current_state\") = 'object'",
    },
  ],
})
