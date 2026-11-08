import type { Tx } from '../../../kernel/transaction.ts'
import type { TrustedClientIp } from '../domain/trusted-client-ip.ts'
import type { AuditWriter } from './ports.ts'
import { diffAuditSnapshots } from '../domain/audit-snapshot.ts'

export type AuditActor =
  | { readonly type: 'USER'; readonly id: string }
  | { readonly type: 'SYSTEM' }

export interface AuditChange {
  readonly actor: AuditActor
  readonly ipAddress: TrustedClientIp | null
  readonly url: string
  readonly method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  readonly statusCode: number
  readonly requestId: string
  readonly action: string
  readonly entity: string
  readonly entityId: string | null
  readonly previous: Readonly<Record<string, unknown>>
  readonly current: Readonly<Record<string, unknown>>
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const identifierPattern = /^[A-Za-z][A-Za-z0-9._:-]*$/
const requestIdPattern = /^[A-Za-z0-9._:-]+$/
const mutableMethods: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function sanitizePath(url: string): string {
  const containsControlCharacter = Array.from(url).some(character => {
    const code = character.charCodeAt(0)
    return code <= 0x1f || code === 0x7f || character === '\\'
  })
  if (!url.startsWith('/') || url.startsWith('//') || containsControlCharacter) {
    throw new TypeError('Audit URL must be a local request path')
  }

  const path = new URL(url, 'http://audit.invalid').pathname
  if (path.length === 0 || path.length > 2048) {
    throw new RangeError('Audit URL path must contain at most 2048 characters')
  }
  return path
}

function validateChange(change: AuditChange): Omit<Parameters<AuditWriter['append']>[1], 'previousState' | 'currentState'> {
  if (change.actor.type === 'USER' && !uuidPattern.test(change.actor.id)) {
    throw new TypeError('User audit actors must have a valid UUID')
  }
  if (!mutableMethods.has(change.method)) {
    throw new TypeError('Audit entries require a mutating HTTP method')
  }
  if (!Number.isInteger(change.statusCode) || change.statusCode < 200 || change.statusCode > 299) {
    throw new RangeError('Audit entries require a successful HTTP status code')
  }
  if (!requestIdPattern.test(change.requestId) || change.requestId.length > 128) {
    throw new TypeError('Audit request IDs must be 1-128 safe characters')
  }
  if (!identifierPattern.test(change.action) || change.action.length > 120) {
    throw new TypeError('Audit actions must be bounded identifiers')
  }
  if (!identifierPattern.test(change.entity) || change.entity.length > 120) {
    throw new TypeError('Audit entities must be bounded identifiers')
  }
  if (change.entityId !== null && change.entityId.length > 128) {
    throw new RangeError('Audit entity IDs must contain at most 128 characters')
  }
  if (change.entityId !== null && Array.from(change.entityId).some(character => {
    const code = character.charCodeAt(0)
    return code <= 0x1f || code === 0x7f
  })) {
    throw new TypeError('Audit entity IDs cannot contain control characters')
  }

  return {
    actorId: change.actor.type === 'USER' ? change.actor.id : null,
    actorType: change.actor.type,
    ipAddress: change.ipAddress,
    url: sanitizePath(change.url),
    method: change.method,
    statusCode: change.statusCode,
    requestId: change.requestId,
    action: change.action,
    entity: change.entity,
    entityId: change.entityId,
  }
}

export class RecordAuditChange {
  constructor(private readonly writer: AuditWriter) {}

  async record(tx: Tx, change: AuditChange): Promise<boolean> {
    const metadata = validateChange(change)
    const previous = change.method === 'POST' ? {} : change.previous
    const current = change.method === 'DELETE' ? {} : change.current
    const diff = diffAuditSnapshots(previous, current)
    if (!diff.hasChanges) {
      return false
    }

    await this.writer.append(tx, {
      ...metadata,
      previousState: diff.previousState,
      currentState: diff.currentState,
    })
    return true
  }
}
