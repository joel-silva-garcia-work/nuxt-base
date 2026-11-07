# Skill: Nuxt + Vue Frontend

## Propósito
Especialización para desarrollo frontend con Nuxt.js, Vue 3 y TypeScript.

Aplicar esta skill para páginas, componentes, layouts, composables, formularios, validaciones, navegación, middleware, API, estados de UI, seguridad frontend, accesibilidad, responsive y pruebas.

## Principios
- Inspeccionar primero el workspace.
- Reutilizar código existente.
- Mantener responsabilidades claras.
- No inventar requisitos ni contratos.
- Preferir soluciones nativas de Nuxt/Vue.
- Mantener TypeScript estricto.
- Evitar dependencias innecesarias.

## Arquitectura
Usar, cuando existan en el proyecto:
- `pages/`
- `components/`
- `layouts/`
- `composables/`
- `middleware/`
- `plugins/`
- `stores/`
- `utils/`

Separar presentación, lógica reutilizable y acceso a datos.

## Vue 3
Preferir:
```ts
<script setup lang="ts">
```

Usar Composition API (`ref`, `computed`, `watch`, `watchEffect`, lifecycle hooks, props y emits tipados).

## Componentes
Cada componente debe tener una responsabilidad clara.
Antes de crear uno nuevo, buscar equivalentes existentes.

## Composables
Extraer lógica reutilizable a composables con responsabilidad única.

## API
Respetar el contrato del backend.
No inventar endpoints ni propiedades.
Usar `useFetch`/`useAsyncData` cuando corresponda.
No exponer secretos.

## UI
Contemplar:
- loading
- success
- empty
- error
- retry cuando sea apropiado

## Formularios
Implementar validación de UX, estados de envío, errores por campo y errores del servidor.
La validación frontend nunca sustituye la validación backend.

## Seguridad
Evitar XSS, exposición de secretos, logs sensibles y HTML no sanitizado.
El middleware frontend no sustituye autorización backend.

## Accesibilidad
Usar HTML semántico, labels, teclado y feedback accesible.

## Responsive
Diseñar para desktop, tablet y móvil.

## Testing
Cubrir componentes, composables y flujos E2E según el cambio.

## HU frontend
Para una HU:
1. Analizar requisitos.
2. Identificar pantallas y componentes.
3. Identificar API y contratos.
4. Identificar estados.
5. Identificar validaciones.
6. Reutilizar código.
7. Implementar.
8. Probar.
9. Ejecutar typecheck/lint/tests disponibles.
10. Revisar diff.

## Criterio final
La implementación debe ser mantenible, tipada, reutilizable, segura, accesible, responsive y consistente con el workspace.
