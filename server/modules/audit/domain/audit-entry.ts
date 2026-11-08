export interface AuditEntry {
  readonly id: string
  readonly actorId: string | null
  readonly actorType: 'USER' | 'SYSTEM'
  readonly ipAddress: string | null
  readonly url: string
  readonly method: string
  readonly statusCode: number
  readonly requestId: string
  readonly action: string
  readonly entity: string
  readonly entityId: string | null
  readonly previousState: Readonly<Record<string, unknown>>
  readonly currentState: Readonly<Record<string, unknown>>
  readonly createdAt: Date
}
