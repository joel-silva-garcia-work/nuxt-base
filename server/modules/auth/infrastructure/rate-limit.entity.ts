import { EntitySchema } from 'typeorm'

export interface RateLimitBucketEntity {
  key: string
  windowStartedAt: Date
  requestCount: number
  updatedAt: Date
}

export const RateLimitBucketEntitySchema = new EntitySchema<RateLimitBucketEntity>({
  name: 'RateLimitBucket',
  tableName: 'rate_limit_buckets',
  columns: {
    key: { type: 'varchar', length: 160, primary: true },
    windowStartedAt: { name: 'window_started_at', type: 'timestamptz', primary: true },
    requestCount: { name: 'request_count', type: 'integer', default: 0 },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
  checks: [
    { name: 'ck_rate_limit_buckets_count', expression: '"request_count" >= 0' },
  ],
})
