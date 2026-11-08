export { RecordAuditChange } from './application/record-audit-change.ts'
export type { AuditActor, AuditChange } from './application/record-audit-change.ts'
export type { AuditWriter } from './application/ports.ts'
export type { AuditEntry } from './domain/audit-entry.ts'
export {
  resolveTrustedClientIpAddress,
  type TrustedClientIp,
} from './domain/trusted-client-ip.ts'
