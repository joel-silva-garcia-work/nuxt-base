export interface OffsetLimit {
  readonly offset: number
  readonly limit: number
}

export function toOffsetLimit(page: number, pageSize: number): OffsetLimit {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError('page must be a positive safe integer')
  }
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError('pageSize must be an integer between 1 and 100')
  }

  const offset = (page - 1) * pageSize
  if (!Number.isSafeInteger(offset)) {
    throw new RangeError('page and pageSize produce an unsafe offset')
  }

  return { offset, limit: pageSize }
}
