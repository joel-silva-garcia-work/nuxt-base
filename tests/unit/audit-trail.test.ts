import { describe, expect, it, vi } from 'vitest'
import { createTx } from '../../server/kernel/transaction.ts'
import { RecordAuditChange, type AuditChange, type AuditWriter } from '../../server/modules/audit/index.ts'
import { diffAuditSnapshots } from '../../server/modules/audit/domain/audit-snapshot.ts'
import { resolveTrustedClientIpAddress } from '../../server/modules/audit/domain/trusted-client-ip.ts'

function createChange(overrides: Partial<AuditChange> = {}): AuditChange {
  return {
    actor: { type: 'USER', id: '550e8400-e29b-41d4-a716-446655440000' },
    ipAddress: resolveTrustedClientIpAddress('192.0.2.10', null),
    url: '/api/users/1?token=must-not-be-recorded#details',
    method: 'PATCH',
    statusCode: 200,
    requestId: 'request-123',
    action: 'users.update',
    entity: 'user',
    entityId: '1',
    previous: { name: 'Before' },
    current: { name: 'After' },
    ...overrides,
  }
}

describe('audit trail foundation', () => {
  it('records only changed columns, keeps null and arrays, and removes sensitive values', async () => {
    const entries: Array<Parameters<AuditWriter['append']>[1]> = []
    const writer: AuditWriter = {
      async append(_tx, entry) {
        entries.push(entry)
      },
    }
    const recorder = new RecordAuditChange(writer)

    await expect(recorder.record(createTx(), createChange({
      previous: {
        name: 'Before',
        nullable: null,
        tags: ['first', 'second'],
        passwordHash: 'old-hash',
        profile: { city: 'Madrid', accessToken: 'old-token' },
        removed: 'value',
      },
      current: {
        name: 'After',
        nullable: 'set',
        tags: ['second', 'first'],
        passwordHash: 'new-hash',
        profile: { city: 'Paris', accessToken: 'new-token' },
      },
    }))).resolves.toBe(true)

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      previousState: {
        name: 'Before',
        nullable: null,
        tags: ['first', 'second'],
        profile: { city: 'Madrid' },
        removed: 'value',
      },
      currentState: {
        name: 'After',
        nullable: 'set',
        tags: ['second', 'first'],
        profile: { city: 'Paris' },
      },
      url: '/api/users/1',
    })
    expect(JSON.stringify(entries[0])).not.toMatch(/password|accessToken|old-hash|new-hash|old-token|new-token/)
  })

  it('does not append no-op changes but keeps an empty diff for changed secret-only fields', async () => {
    const append = vi.fn<AuditWriter['append']>(async () => {})
    const recorder = new RecordAuditChange({ append })

    await expect(recorder.record(createTx(), createChange({
      previous: { name: 'Unchanged', optional: undefined },
      current: { name: 'Unchanged' },
    }))).resolves.toBe(false)
    expect(append).not.toHaveBeenCalled()

    await expect(recorder.record(createTx(), createChange({
      previous: { passwordHash: 'old' },
      current: { passwordHash: 'new' },
    }))).resolves.toBe(true)
    expect(append).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      previousState: {},
      currentState: {},
    }))
  })

  it('rejects unsuccessful status codes instead of recording failed requests', async () => {
    const append = vi.fn<AuditWriter['append']>(async () => {})
    const recorder = new RecordAuditChange({ append })

    await expect(recorder.record(createTx(), createChange({ statusCode: 403 })))
      .rejects.toThrow('successful HTTP status code')
    expect(append).not.toHaveBeenCalled()
  })

  it('uses empty snapshots for POST and DELETE', async () => {
    const entries: Array<Parameters<AuditWriter['append']>[1]> = []
    const recorder = new RecordAuditChange({
      async append(_tx, entry) {
        entries.push(entry)
      },
    })

    await recorder.record(createTx(), createChange({
      method: 'POST',
      previous: { ignored: 'previous create state' },
      current: { name: 'Created' },
    }))
    await recorder.record(createTx(), createChange({
      method: 'DELETE',
      previous: { name: 'Deleted' },
      current: { ignored: 'deleted state' },
    }))

    expect(entries).toMatchObject([
      { previousState: {}, currentState: { name: 'Created' } },
      { previousState: { name: 'Deleted' }, currentState: {} },
    ])
  })

  it('accepts forwarded IPs only through configured trusted proxies', () => {
    expect(resolveTrustedClientIpAddress('198.51.100.10', '203.0.113.5'))
      .toBe('198.51.100.10')
    expect(resolveTrustedClientIpAddress(
      '198.51.100.10',
      '203.0.113.5',
      new Set(['198.51.100.10']),
    )).toBe('203.0.113.5')
    expect(resolveTrustedClientIpAddress(
      '198.51.100.10',
      'not-an-ip',
      new Set(['198.51.100.10']),
    )).toBe('198.51.100.10')
    expect(resolveTrustedClientIpAddress(
      '198.51.100.10',
      '203.0.113.5, 198.51.100.11',
      new Set(['198.51.100.10', '198.51.100.11']),
    )).toBe('203.0.113.5')
  })

  it('compares arrays as complete values and treats omitted fields as absent', () => {
    expect(diffAuditSnapshots(
      { tags: ['one', 'two'], nullable: null, removed: 'value' },
      { tags: ['two', 'one'], nullable: null },
    )).toEqual({
      hasChanges: true,
      previousState: { tags: ['one', 'two'], removed: 'value' },
      currentState: { tags: ['two', 'one'] },
    })
    expect(diffAuditSnapshots({ name: 'same' }, { name: 'same' })).toEqual({
      hasChanges: false,
      previousState: {},
      currentState: {},
    })
  })
})
