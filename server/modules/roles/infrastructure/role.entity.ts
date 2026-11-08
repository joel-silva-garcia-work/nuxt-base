import { EntitySchema } from 'typeorm'

export interface RoleEntity {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  users?: Array<{ id: string }>
  permissions?: Array<{ id: string }>
}

export const RoleEntitySchema = new EntitySchema<RoleEntity>({
  name: 'Role',
  tableName: 'roles',
  columns: {
    id: { type: 'uuid', primary: true, default: () => 'gen_random_uuid()' },
    name: { type: 'varchar', length: 100 },
    description: { type: 'varchar', length: 500, nullable: true },
    isSystem: { name: 'is_system', type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
  relations: {
    users: {
      type: 'many-to-many',
      target: 'User',
      inverseSide: 'roles',
    },
    permissions: {
      type: 'many-to-many',
      target: 'Permission',
      inverseSide: 'roles',
      joinTable: {
        name: 'role_permissions',
        joinColumn: { name: 'role_id', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_role_permissions_role' },
        inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_role_permissions_permission' },
      },
    },
  },
  indices: [
    { name: 'uq_roles_name', columns: ['name'], unique: true },
  ],
})
