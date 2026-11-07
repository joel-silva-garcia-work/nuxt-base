---
name: Backend TypeScript
description: Reglas para backend TypeScript/Nitro/NestJS cuando exista.
globs:
  - "server/**/*.ts"
  - "src/**/*.controller.ts"
  - "src/**/*.service.ts"
  - "src/**/*.guard.ts"
  - "src/**/*.interceptor.ts"
  - "src/**/*.middleware.ts"
---

# Backend
- Mantén controladores delgados.
- La lógica de negocio debe estar en servicios/casos de uso.
- Valida entradas en el servidor.
- Aplica autenticación y autorización donde corresponda.
- No confíes en restricciones implementadas solamente en frontend.
- Usa errores consistentes y no expongas stack traces o secretos.
- Reutiliza DTOs, schemas, tipos y servicios existentes.
- Evita acceso directo a la base de datos desde capas de presentación.
- Para cambios de API identifica método, ruta, request, response, errores y compatibilidad.
- Añade pruebas unitarias y/o e2e para cambios de comportamiento.
