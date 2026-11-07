---
name: Nuxt Frontend
description: Reglas para Nuxt, Vue y TypeScript.
globs:
  - "app/**/*.vue"
  - "pages/**/*.vue"
  - "components/**/*.vue"
  - "composables/**/*.ts"
  - "layouts/**/*.vue"
  - "plugins/**/*.ts"
  - "middleware/**/*.ts"
  - "nuxt.config.ts"
  - "app.config.ts"
---

# Nuxt
- Usa TypeScript y Composition API siguiendo las convenciones existentes.
- Mantén componentes enfocados y evita componentes monolíticos.
- Usa composables para lógica reutilizable.
- Separa estado de presentación y lógica de negocio.
- No expongas secretos en código cliente.
- Usa runtimeConfig para configuración sensible del servidor.
- Considera SSR, hydration y diferencias entre cliente y servidor.
- Valida estados loading, empty, success y error.
- Mantén accesibilidad básica: labels, botones con propósito claro, foco y mensajes de error.
- Los textos visibles deben coincidir con requisitos o recursos existentes; no inventarlos.
- Para llamadas al backend, reutiliza el cliente/servicio existente.
- Añade pruebas apropiadas cuando cambie comportamiento.
