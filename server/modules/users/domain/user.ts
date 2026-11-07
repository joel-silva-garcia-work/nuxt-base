export interface UserRecord {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
}
