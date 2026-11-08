export type AuditJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue }

export type AuditJsonObject = Readonly<Record<string, AuditJsonValue>>

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
  readonly previousState: AuditJsonObject
  readonly currentState: AuditJsonObject
  readonly createdAt: Date
}
