import { EntitySchema } from 'typeorm'

export interface SessionEntity {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
  user?: { id: string }
}

export const SessionEntitySchema = new EntitySchema<SessionEntity>({
  name: 'Session',
  tableName: 'sessions',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      primaryKeyConstraintName: 'pk_sessions',
      generated: 'uuid',
    },
    userId: { name: 'user_id', type: 'uuid' },
    tokenHash: { name: 'token_hash', type: 'varchar', length: 128, select: false },
    expiresAt: { name: 'expires_at', type: 'timestamptz' },
    revokedAt: { name: 'revoked_at', type: 'timestamptz', nullable: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
  },
  indices: [
    { name: 'uq_sessions_token_hash', columns: ['tokenHash'], unique: true },
    { name: 'idx_sessions_user_id', columns: ['userId'] },
    { name: 'idx_sessions_expires_at', columns: ['expiresAt'] },
  ],
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user_id', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_sessions_user' },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    },
  },
})
