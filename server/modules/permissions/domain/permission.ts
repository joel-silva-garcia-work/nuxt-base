export interface PermissionRecord {
  readonly id: string
  readonly key: string
  readonly method: string
  readonly routePattern: string
  readonly description: string
  readonly module: string
  readonly accessPolicy: 'PUBLIC' | 'AUTHENTICATED' | 'RBAC'
  readonly isActive: boolean
}
