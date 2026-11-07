export interface RoleRecord {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly isSystem: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}
