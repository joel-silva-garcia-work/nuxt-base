import { describe, expect, it, vi } from 'vitest'
import {
  API_CATALOG,
  REQUIRED_API_ENDPOINT_KEYS,
  type ApiEndpointDefinition,
  type ApiEndpointKey,
} from '../../server/http/catalog.ts'
import { createApiEndpointHandler } from '../../server/http/endpoint.ts'
import { ApiHttpError } from '../../server/http/errors.ts'
import {
  verifyApiCatalog,
  verifyApiRoutes,
  routePatternFromFile,
  checkExternalImportBoundary,
  findDependencyCycles,
  type DiscoveredApiRoute,
} from '../../scripts/verify-architecture.ts'

interface TestEvent {
  readonly method: string
  readonly pathname: string
  readonly requestId: unknown
  statusCode?: number
}

const testAdapter = {
  readRequest(event: TestEvent) {
    return {
      method: event.method,
      pathname: event.pathname,
      requestId: event.requestId,
    }
  },
  setStatus(event: TestEvent, statusCode: number) {
    event.statusCode = statusCode
  },
}

function getCatalogEndpoint(key: ApiEndpointKey): ApiEndpointDefinition {
  const endpoint = API_CATALOG.find(candidate => candidate.key === key)
  if (!endpoint) {
    throw new Error(`Missing ${key} endpoint`)
  }
  return endpoint
}

const implementedRbacEndpoint: ApiEndpointDefinition = {
  ...getCatalogEndpoint('users.list'),
  implemented: true,
}

const implementedPublicEndpoint: ApiEndpointDefinition = {
  ...getCatalogEndpoint('auth.login'),
  implemented: true,
}

const implementedAuthenticatedEndpoint: ApiEndpointDefinition = {
  ...getCatalogEndpoint('auth.me'),
  implemented: true,
}

const expectedEndpointKeys = [
  'auth.login',
  'auth.logout',
  'auth.me',
  'auth.changePassword',
  'users.list',
  'users.create',
  'users.get',
  'users.update',
  'users.delete',
  'users.roles.get',
  'users.roles.replace',
  'roles.list',
  'roles.create',
  'roles.get',
  'roles.update',
  'roles.delete',
  'roles.permissions.get',
  'roles.permissions.replace',
  'permissions.list',
  'permissions.get',
  'permissions.sync',
  'auth.csrf',
] as const

describe('API catalog and wrapper', () => {
  it('contains every required endpoint with unique keys and method/path pairs', () => {
    expect(REQUIRED_API_ENDPOINT_KEYS).toEqual(expectedEndpointKeys)
    expect(API_CATALOG.map(endpoint => endpoint.key)).toEqual([...REQUIRED_API_ENDPOINT_KEYS])
    expect(verifyApiCatalog(API_CATALOG)).toEqual([])
  })

  it('rejects entries without a registered access policy', () => {
    const invalidEntry = {
      ...getCatalogEndpoint('auth.login'),
      accessPolicy: '',
    }

    expect(verifyApiCatalog([invalidEntry], ['auth.login'])).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: 'Registro de endpoint inválido o sin política explícita.' }),
    ]))
  })

  it('reports duplicate and missing catalog entries', () => {
    const endpoints = API_CATALOG.filter(endpoint => endpoint.key !== 'auth.csrf')
    const duplicate = [...endpoints, endpoints[0]]

    expect(verifyApiCatalog(duplicate)).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: 'Falta la entrada requerida: auth.csrf.' }),
      expect.objectContaining({ message: `Clave duplicada: ${endpoints[0].key}.` }),
      expect.objectContaining({ message: `Método/ruta duplicado: ${endpoints[0].method} ${endpoints[0].routePattern} (${endpoints[0].key}, ${endpoints[0].key}).` }),
    ]))
  })

  it('treats different parameter names as the same method and route pattern', () => {
    const user = getCatalogEndpoint('users.get')

    expect(verifyApiCatalog([
      user,
      { ...user, key: 'users.getDuplicate', routePattern: '/api/users/:userId' },
    ], [user.key, 'users.getDuplicate'])).toContainEqual(
      expect.objectContaining({ message: 'Método/ruta duplicado: GET /api/users/: (users.get, users.getDuplicate).' }),
    )
  })

  it('checks route completeness, catalog membership and the common wrapper', () => {
    const routes: DiscoveredApiRoute[] = [
      {
        method: 'GET',
        routePattern: '/api/users',
        filePath: 'server/api/users.get.ts',
        wrapped: false,
      },
      {
        method: 'GET',
        routePattern: '/api/users',
        filePath: 'server/api/users/index.get.ts',
        wrapped: true,
      },
      {
        method: 'POST',
        routePattern: '/api/not-registered',
        filePath: 'server/api/not-registered.post.ts',
        wrapped: true,
      },
    ]

    expect(verifyApiRoutes([implementedRbacEndpoint], routes)).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: 'La ruta debe usar defineApiEndpoint: users.list.' }),
      expect.objectContaining({ message: 'Ruta descubierta duplicada: GET /api/users.' }),
      expect.objectContaining({ message: 'La ruta no tiene entrada de catálogo: POST /api/not-registered.' }),
    ]))
    expect(verifyApiRoutes([implementedRbacEndpoint], [])).toEqual([
      expect.objectContaining({ message: 'Falta la ruta implementada users.list: GET /api/users.' }),
    ])
  })

  it('discovers Nitro API routes regardless of JavaScript module extension', () => {
    for (const extension of ['js', 'mjs', 'cjs']) {
      expect(routePatternFromFile(`server/api/auth/login.post.${extension}`)).toEqual({
        method: 'POST',
        routePattern: '/api/auth/login',
      })
    }
  })

  it('detects dependency cycles in the module graph', () => {
    expect(findDependencyCycles(new Map([
      ['server/modules/users/index.ts', ['server/modules/roles/index.ts']],
      ['server/modules/roles/index.ts', ['server/modules/users/index.ts']],
    ]))).toEqual([[
      'server/modules/users/index.ts',
      'server/modules/roles/index.ts',
      'server/modules/users/index.ts',
    ]])
  })

  it('rejects server-only packages at frontend and application/domain boundaries', () => {
    expect(checkExternalImportBoundary('app/pages/users.vue', 'typeorm'))
      .toContain('La app y shared')
    expect(checkExternalImportBoundary('server/modules/users/application/create-user.ts', 'typeorm'))
      .toContain('Los casos de uso y el dominio')
    expect(checkExternalImportBoundary('server/modules/users/infrastructure/repository.ts', 'typeorm'))
      .toBeUndefined()
  })

  it('denies RBAC endpoints by default and does not invoke their handlers', async () => {
    const handler = vi.fn()
    const event: TestEvent = {
      method: 'GET',
      pathname: '/api/users',
      requestId: 'request-123',
    }
    const endpoint = createApiEndpointHandler(
      testAdapter,
      'users.list',
      handler,
      [implementedRbacEndpoint],
      { authorize: () => 'allow' },
    )

    await expect(endpoint(event)).resolves.toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'No tienes permiso para realizar esta acción.',
      },
      requestId: 'request-123',
    })
    expect(event.statusCode).toBe(403)
    expect(handler).not.toHaveBeenCalled()
  })

  it('permits only explicit public endpoints and validates their method and exact path', async () => {
    const event: TestEvent = {
      method: 'POST',
      pathname: '/api/auth/login',
      requestId: 'login-1',
    }
    const endpoint = createApiEndpointHandler(
      testAdapter,
      'auth.login',
      () => ({ accepted: true }),
      [implementedPublicEndpoint],
    )

    await expect(endpoint(event)).resolves.toEqual({ accepted: true })
    expect(event.statusCode).toBeUndefined()

    const wrongPathEvent: TestEvent = {
      method: 'POST',
      pathname: '/api/auth/login/extra',
      requestId: 'login-2',
    }
    await expect(endpoint(wrongPathEvent)).resolves.toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
    expect(wrongPathEvent.statusCode).toBe(404)
  })

  it('requires authentication and handles HEAD as an explicitly protected GET', async () => {
    const event: TestEvent = {
      method: 'HEAD',
      pathname: '/api/auth/me',
      requestId: 'head-1',
    }
    const endpoint = createApiEndpointHandler(
      testAdapter,
      'auth.me',
      () => ({ items: [] }),
      [implementedAuthenticatedEndpoint],
      {
        authorize: () => 'unauthenticated',
      },
    )

    await expect(endpoint(event)).resolves.toMatchObject({
      error: { code: 'UNAUTHENTICATED' },
    })
    expect(event.statusCode).toBe(401)
  })

  it('returns a safe error response and logs unexpected errors without exposing details', async () => {
    const event: TestEvent = {
      method: 'POST',
      pathname: '/api/auth/login',
      requestId: 'unexpected-1',
    }
    const logger = vi.fn()
    const endpoint = createApiEndpointHandler(
      testAdapter,
      'auth.login',
      () => {
        throw new Error('sensitive database detail')
      },
      [implementedPublicEndpoint],
      {
        logUnexpectedError: logger,
      },
    )

    await expect(endpoint(event)).resolves.toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error interno.',
      },
      requestId: 'unexpected-1',
    })
    expect(event.statusCode).toBe(500)
    expect(logger).toHaveBeenCalledWith('unexpected-1', 'Error')
    expect(JSON.stringify(await endpoint(event))).not.toContain('sensitive database detail')
  })

  it('maps application errors to the documented status and response shape', () => {
    expect(new ApiHttpError('CONFLICT').toResponse('request-1')).toEqual({
      statusCode: 409,
      body: {
        error: {
          code: 'CONFLICT',
          message: 'La solicitud entra en conflicto con el estado actual.',
        },
        requestId: 'request-1',
      },
    })
  })
})
