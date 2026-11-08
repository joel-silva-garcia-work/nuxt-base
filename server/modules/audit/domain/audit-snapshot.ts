import { isDeepStrictEqual } from 'node:util'
import type { AuditJsonObject, AuditJsonValue } from './audit-entry.ts'

type JsonValue = AuditJsonValue
type JsonObject = Record<string, JsonValue>

const sensitiveKeyFragments = [
  'password',
  'passwd',
  'credential',
  'secret',
  'token',
  'cookie',
  'authorization',
  'apikey',
  'privatekey',
  'encryptionkey',
  'signingkey',
  'session',
  'csrf',
  'jwt',
  'bearer',
  'hash',
]

function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  return sensitiveKeyFragments.some(fragment => normalizedKey.includes(fragment))
}

function normalizeValue(
  value: unknown,
  includeSensitive: boolean,
  ancestors: Set<object>,
  arrayItem = false,
): JsonValue | undefined {
  if (value === undefined) {
    return arrayItem ? null : undefined
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Audit snapshots cannot contain non-finite numbers')
    }
    return value
  }
  if (typeof value !== 'object') {
    throw new TypeError('Audit snapshots must contain JSON-compatible values')
  }
  if (ancestors.has(value)) {
    throw new TypeError('Audit snapshots cannot contain circular references')
  }

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      return value.map(item => normalizeValue(item, includeSensitive, ancestors, true) ?? null)
    }

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Audit snapshots must contain plain objects')
    }

    const entries: Array<[string, JsonValue]> = []
    for (const [key, nestedValue] of Object.entries(value)) {
      if ((!includeSensitive && isSensitiveKey(key)) || nestedValue === undefined) {
        continue
      }
      const normalizedValue = normalizeValue(nestedValue, includeSensitive, ancestors)
      if (normalizedValue !== undefined) {
        entries.push([key, normalizedValue])
      }
    }
    return Object.fromEntries(entries) as JsonObject
  } finally {
    ancestors.delete(value)
  }
}

function normalizeSnapshot(snapshot: Readonly<Record<string, unknown>>, includeSensitive: boolean): JsonObject {
  if (snapshot === null || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new TypeError('Audit snapshots must be plain objects')
  }
  return normalizeValue(snapshot, includeSensitive, new Set()) as JsonObject
}

function setValue(target: JsonObject, key: string, value: JsonValue): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}

export interface AuditSnapshotDiff {
  readonly hasChanges: boolean
  readonly previousState: AuditJsonObject
  readonly currentState: AuditJsonObject
}

export function diffAuditSnapshots(
  previous: Readonly<Record<string, unknown>>,
  current: Readonly<Record<string, unknown>>,
): AuditSnapshotDiff {
  const normalizedPrevious = normalizeSnapshot(previous, true)
  const normalizedCurrent = normalizeSnapshot(current, true)
  const hasChanges = !isDeepStrictEqual(normalizedPrevious, normalizedCurrent)
  if (!hasChanges) {
    return { hasChanges: false, previousState: {}, currentState: {} }
  }

  const safePrevious = normalizeSnapshot(previous, false)
  const safeCurrent = normalizeSnapshot(current, false)
  const previousState: JsonObject = {}
  const currentState: JsonObject = {}
  const keys = new Set([...Object.keys(safePrevious), ...Object.keys(safeCurrent)])

  for (const key of keys) {
    const hadPreviousValue = Object.hasOwn(safePrevious, key)
    const hasCurrentValue = Object.hasOwn(safeCurrent, key)
    const previousValue = safePrevious[key]
    const currentValue = safeCurrent[key]
    if (isDeepStrictEqual(previousValue, currentValue) && hadPreviousValue === hasCurrentValue) {
      continue
    }
    if (hadPreviousValue && previousValue !== undefined) {
      setValue(previousState, key, previousValue)
    }
    if (hasCurrentValue && currentValue !== undefined) {
      setValue(currentState, key, currentValue)
    }
  }

  return { hasChanges: true, previousState, currentState }
}
