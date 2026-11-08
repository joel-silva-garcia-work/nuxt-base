import { EntitySchema } from 'typeorm'

export interface PermissionEntity {
  id: string
  key: string
  method: string
  routePattern: string
  description: string
  module: string
  accessPolicy: 'PUBLIC' | 'AUTHENTICATED' | 'RBAC'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  roles?: Array<{ id: string }>
}

export const PermissionEntitySchema = new EntitySchema<PermissionEntity>({
  name: 'Permission',
  tableName: 'permissions',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      primaryKeyConstraintName: 'pk_permissions',
      generated: 'uuid',
    },
    key: { type: 'varchar', length: 120 },
    method: { type: 'varchar', length: 10 },
    routePattern: { name: 'route_pattern', type: 'varchar', length: 255 },
    description: { type: 'varchar', length: 500 },
    module: { type: 'varchar', length: 80 },
    accessPolicy: { name: 'access_policy', type: 'varchar', length: 20 },
    isActive: { name: 'is_active', type: 'boolean', default: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
  indices: [
    { name: 'uq_permissions_key', columns: ['key'], unique: true },
    { name: 'uq_permissions_method_route', columns: ['method', 'routePattern'], unique: true },
  ],
  checks: [
    {
      name: 'ck_permissions_access_policy',
      expression: `"access_policy" IN ('PUBLIC', 'AUTHENTICATED', 'RBAC')`,
    },
    { name: 'ck_permissions_method_upper', expression: '"method" = upper("method")' },
  ],
  relations: {
    roles: {
      type: 'many-to-many',
      target: 'Role',
      inverseSide: 'permissions',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
  },
})
