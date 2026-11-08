import { randomUUID } from 'node:crypto'
import {
  matchRoutePattern,
  type ApiEndpointDefinition,
  type ApiEndpointKey,
} from './catalog.ts'
import { ApiHttpError, serializeApiError, type ApiErrorResponse } from './errors.ts'

export interface ApiRequestInfo {
  readonly method: string
  readonly pathname: string
  readonly requestId: unknown
}

export interface ApiEventAdapter<Event> {
  readRequest(event: Event): ApiRequestInfo
  setStatus(event: Event, statusCode: number): void
}

export type AuthorizationDecision = 'allow' | 'unauthenticated' | 'forbidden'

export interface ApiEndpointOptions<Event> {
  readonly authorize?: (
    event: Event,
    endpoint: ApiEndpointDefinition,
  ) => AuthorizationDecision | Promise<AuthorizationDecision>
  readonly logUnexpectedError?: (requestId: string, errorName: string) => void
}

export type ApiHandler<Event, Result> = (event: Event) => Result | Promise<Result>

const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/
const methodPattern = /^[A-Z]+$/

function resolveRequestId(requestId: unknown): string {
  return typeof requestId === 'string' && requestIdPattern.test(requestId)
    ? requestId
    : randomUUID()
}

function resolveMethod(method: string, catalog: readonly ApiEndpointDefinition[]): string {
  const normalized = method.toUpperCase()
  if (!methodPattern.test(normalized)) {
    throw new ApiHttpError('METHOD_NOT_ALLOWED')
  }

  if (normalized === 'OPTIONS') {
    throw new ApiHttpError('METHOD_NOT_ALLOWED')
  }

  if (normalized === 'HEAD') {
    return 'GET'
  }

  if (!catalog.some(endpoint => endpoint.method === normalized)) {
    throw new ApiHttpError('METHOD_NOT_ALLOWED')
  }

  return normalized
}

function resolveAccessPolicy(
  decision: AuthorizationDecision,
): void {
  if (decision === 'allow') {
    return
  }

  if (decision === 'unauthenticated') {
    throw new ApiHttpError('UNAUTHENTICATED')
  }

  throw new ApiHttpError('FORBIDDEN')
}

function defaultUnexpectedErrorLogger(requestId: string, errorName: string): void {
  console.error('Unhandled API error', { requestId, errorName })
}

function safeErrorName(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  return /^[A-Za-z][A-Za-z0-9._-]{0,63}$/.test(name) ? name : 'Error'
}

export function createApiEndpointHandler<Event, Result>(
  adapter: ApiEventAdapter<Event>,
  endpointKey: ApiEndpointKey,
  handler: ApiHandler<Event, Result>,
  catalog: readonly ApiEndpointDefinition[],
  options: ApiEndpointOptions<Event> = {},
): (event: Event) => Promise<Result | ApiErrorResponse['body']> {
  const endpoint = catalog.find(candidate => candidate.key === endpointKey)

  return async (event) => {
    let requestId: string = randomUUID()

    try {
      const requestInfo = adapter.readRequest(event)
      requestId = resolveRequestId(requestInfo.requestId)

      if (!endpoint) {
        throw new ApiHttpError('INTERNAL_ERROR')
      }

      const method = resolveMethod(requestInfo.method, catalog)
      const matchingPath = catalog.some(candidate =>
        matchRoutePattern(candidate.routePattern, requestInfo.pathname),
      )

      if (!matchingPath) {
        throw new ApiHttpError('NOT_FOUND')
      }

      if (endpoint.method !== method || !matchRoutePattern(endpoint.routePattern, requestInfo.pathname)) {
        throw new ApiHttpError('METHOD_NOT_ALLOWED')
      }

      if (!endpoint.implemented) {
        throw new ApiHttpError('SERVICE_UNAVAILABLE')
      }

      const decision = endpoint.accessPolicy === 'PUBLIC'
        ? 'allow'
        : endpoint.accessPolicy === 'RBAC'
          ? 'forbidden'
          : options.authorize
            ? await options.authorize(event, endpoint)
            : 'unauthenticated'

      resolveAccessPolicy(decision)
      return await handler(event)
    } catch (error) {
      const response = serializeApiError(error, requestId)
      adapter.setStatus(event, response.statusCode)

      if (response.statusCode === 500) {
        const logError = options.logUnexpectedError ?? defaultUnexpectedErrorLogger
        logError(requestId, safeErrorName(error))
      }

      return response.body
    }
  }
}
