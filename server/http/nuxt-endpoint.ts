import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  createApiEndpointHandler,
  type ApiEndpointOptions,
  type ApiHandler,
} from './endpoint.ts'
import { API_CATALOG, type ApiEndpointKey } from './catalog.ts'
import type { ApiErrorResponse } from './errors.ts'

interface NuxtHttpEvent {
  readonly context: {
    readonly requestId?: unknown
  }
  readonly node: {
    readonly req: Pick<IncomingMessage, 'method' | 'url'>
    readonly res: Pick<ServerResponse, 'statusCode'>
  }
}

const h3EventAdapter = {
  readRequest(event: NuxtHttpEvent) {
    return {
      method: event.node.req.method ?? '',
      pathname: new URL(event.node.req.url ?? '/', 'http://localhost').pathname,
      requestId: event.context.requestId,
    }
  },
  setStatus(event: NuxtHttpEvent, statusCode: number) {
    event.node.res.statusCode = statusCode
  },
}

export function defineApiEndpoint<Result>(
  endpointKey: ApiEndpointKey,
  handler: ApiHandler<NuxtHttpEvent, Result>,
  options: ApiEndpointOptions<NuxtHttpEvent> = {},
): (event: NuxtHttpEvent) => Promise<Result | ApiErrorResponse['body']> {
  return createApiEndpointHandler(h3EventAdapter, endpointKey, handler, API_CATALOG, options)
}
