export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

const statusByCode: Readonly<Record<ApiErrorCode, number>> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
}

const messageByCode: Readonly<Record<ApiErrorCode, string>> = {
  VALIDATION_ERROR: 'La solicitud no es válida.',
  UNAUTHENTICATED: 'Se requiere autenticación.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  NOT_FOUND: 'No se encontró el recurso solicitado.',
  METHOD_NOT_ALLOWED: 'El método HTTP no está permitido.',
  CONFLICT: 'La solicitud entra en conflicto con el estado actual.',
  SERVICE_UNAVAILABLE: 'El endpoint aún no está disponible.',
  INTERNAL_ERROR: 'Ocurrió un error interno.',
}

export class ApiHttpError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(messageByCode[code])
    this.name = 'ApiHttpError'
  }

  get statusCode(): number {
    return statusByCode[this.code]
  }

  toResponse(requestId: string): ApiErrorResponse {
    return {
      statusCode: this.statusCode,
      body: {
        error: {
          code: this.code,
          message: this.message,
        },
        requestId,
      },
    }
  }
}

export interface ApiErrorResponse {
  readonly statusCode: number
  readonly body: {
    readonly error: {
      readonly code: ApiErrorCode
      readonly message: string
    }
    readonly requestId: string
  }
}

export function serializeApiError(error: unknown, requestId: string): ApiErrorResponse {
  if (error instanceof ApiHttpError) {
    return error.toResponse(requestId)
  }

  return new ApiHttpError('INTERNAL_ERROR').toResponse(requestId)
}
