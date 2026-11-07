import { EntitySchema } from 'typeorm'

export interface UserEntity {
  id: string
  email: string
  name: string
  passwordHash: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  roles?: Array<{ id: string }>
}

export const UserEntitySchema = new EntitySchema<UserEntity>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'uuid', primary: true, default: () => 'gen_random_uuid()' },
    email: { type: 'varchar', length: 320, unique: true },
    name: { type: 'varchar', length: 160 },
    passwordHash: { name: 'password_hash', type: 'varchar', length: 255, select: false },
    isActive: { name: 'is_active', type: 'boolean', default: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    deletedAt: { name: 'deleted_at', type: 'timestamptz', nullable: true },
  },
  relations: {
    roles: {
      type: 'many-to-many',
      target: 'Role',
      inverseSide: 'users',
      joinTable: {
        name: 'user_roles',
        joinColumn: { name: 'user_id', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_user_roles_user' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_user_roles_role' },
      },
    },
  },
})
