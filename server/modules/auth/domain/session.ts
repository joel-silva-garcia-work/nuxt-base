export interface SessionRecord {
  readonly id: string
  readonly userId: string
  readonly expiresAt: Date
  readonly revokedAt: Date | null
  readonly createdAt: Date
}
