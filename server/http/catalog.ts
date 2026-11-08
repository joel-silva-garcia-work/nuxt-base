export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type AccessPolicy = 'PUBLIC' | 'AUTHENTICATED' | 'RBAC'
export type ApiModule = 'auth' | 'users' | 'roles' | 'permissions'

export interface ApiEndpointDefinition {
  readonly key: string
  readonly module: ApiModule
  readonly method: HttpMethod
  readonly routePattern: string
  readonly description: string
  readonly accessPolicy: AccessPolicy
  readonly implemented: boolean
}

export const REQUIRED_API_ENDPOINT_KEYS = [
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

export type ApiEndpointKey = (typeof REQUIRED_API_ENDPOINT_KEYS)[number]

const endpointDefinitions = {
  'auth.login': {
    module: 'auth',
    method: 'POST',
    routePattern: '/api/auth/login',
    description: 'Iniciar sesión',
    accessPolicy: 'PUBLIC',
    implemented: false,
  },
  'auth.logout': {
    module: 'auth',
    method: 'POST',
    routePattern: '/api/auth/logout',
    description: 'Cerrar sesión',
    accessPolicy: 'AUTHENTICATED',
    implemented: false,
  },
  'auth.me': {
    module: 'auth',
    method: 'GET',
    routePattern: '/api/auth/me',
    description: 'Consultar la sesión actual',
    accessPolicy: 'AUTHENTICATED',
    implemented: false,
  },
  'auth.changePassword': {
    module: 'auth',
    method: 'POST',
    routePattern: '/api/auth/change-password',
    description: 'Cambiar la contraseña propia',
    accessPolicy: 'AUTHENTICATED',
    implemented: false,
  },
  'auth.csrf': {
    module: 'auth',
    method: 'GET',
    routePattern: '/api/auth/csrf',
    description: 'Obtener el token CSRF',
    accessPolicy: 'PUBLIC',
    implemented: false,
  },
  'users.list': {
    module: 'users',
    method: 'GET',
    routePattern: '/api/users',
    description: 'Listar usuarios',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'users.create': {
    module: 'users',
    method: 'POST',
    routePattern: '/api/users',
    description: 'Crear un usuario',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'users.get': {
    module: 'users',
    method: 'GET',
    routePattern: '/api/users/:id',
    description: 'Consultar un usuario',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'users.update': {
    module: 'users',
    method: 'PATCH',
    routePattern: '/api/users/:id',
    description: 'Actualizar un usuario',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'users.delete': {
    module: 'users',
    method: 'DELETE',
    routePattern: '/api/users/:id',
    description: 'Desactivar un usuario',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'users.roles.get': {
    module: 'users',
    method: 'GET',
    routePattern: '/api/users/:id/roles',
    description: 'Consultar los roles de un usuario',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'users.roles.replace': {
    module: 'users',
    method: 'PUT',
    routePattern: '/api/users/:id/roles',
    description: 'Reemplazar los roles de un usuario',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'roles.list': {
    module: 'roles',
    method: 'GET',
    routePattern: '/api/roles',
    description: 'Listar roles',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'roles.create': {
    module: 'roles',
    method: 'POST',
    routePattern: '/api/roles',
    description: 'Crear un rol',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'roles.get': {
    module: 'roles',
    method: 'GET',
    routePattern: '/api/roles/:id',
    description: 'Consultar un rol',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'roles.update': {
    module: 'roles',
    method: 'PATCH',
    routePattern: '/api/roles/:id',
    description: 'Actualizar un rol',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'roles.delete': {
    module: 'roles',
    method: 'DELETE',
    routePattern: '/api/roles/:id',
    description: 'Eliminar un rol',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'roles.permissions.get': {
    module: 'roles',
    method: 'GET',
    routePattern: '/api/roles/:id/permissions',
    description: 'Consultar permisos de un rol',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'roles.permissions.replace': {
    module: 'roles',
    method: 'PUT',
    routePattern: '/api/roles/:id/permissions',
    description: 'Reemplazar permisos de un rol',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'permissions.list': {
    module: 'permissions',
    method: 'GET',
    routePattern: '/api/permissions',
    description: 'Listar permisos',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'permissions.get': {
    module: 'permissions',
    method: 'GET',
    routePattern: '/api/permissions/:id',
    description: 'Consultar un permiso',
    accessPolicy: 'RBAC',
    implemented: false,
  },
  'permissions.sync': {
    module: 'permissions',
    method: 'POST',
    routePattern: '/api/permissions/sync',
    description: 'Sincronizar el catálogo de permisos',
    accessPolicy: 'RBAC',
    implemented: false,
  },
} satisfies Record<ApiEndpointKey, Omit<ApiEndpointDefinition, 'key'>>

export const API_CATALOG: readonly ApiEndpointDefinition[] = Object.freeze(
  REQUIRED_API_ENDPOINT_KEYS.map(key => Object.freeze({
    key,
    ...endpointDefinitions[key],
  })),
)

export function getApiEndpoint(key: string): ApiEndpointDefinition | undefined {
  return API_CATALOG.find(endpoint => endpoint.key === key)
}

export function matchRoutePattern(routePattern: string, pathname: string): boolean {
  const expectedSegments = routePattern.split('/').filter(Boolean)
  const actualSegments = pathname.split('/').filter(Boolean)

  if (expectedSegments.length !== actualSegments.length) {
    return false
  }

  return expectedSegments.every((segment, index) => {
    const actualSegment = actualSegments[index]
    return segment.startsWith(':')
      ? actualSegment !== undefined && actualSegment.length > 0
      : segment === actualSegment
  })
}
