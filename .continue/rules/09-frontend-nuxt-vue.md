# Frontend Nuxt + Vue Workspace Rules

Estas reglas se aplican automáticamente al trabajo frontend del workspace.

## Objetivo
Construir frontend profesional con Nuxt.js, Vue 3 y TypeScript, respetando la arquitectura existente y evitando complejidad innecesaria.

## Antes de modificar código
1. Inspeccionar la estructura existente.
2. Identificar pages, components, layouts, composables, middleware, plugins, stores y utils.
3. Buscar código reutilizable antes de crear archivos nuevos.
4. No duplicar componentes, composables ni utilidades.
5. No introducir dependencias nuevas sin necesidad justificada.
6. No cambiar arquitectura sin justificarlo.
7. Distinguir requisitos explícitos, inferencias razonables y aspectos desconocidos.
8. No inventar endpoints, respuestas de API, textos de UI ni reglas de negocio.

## Nuxt y Vue
- Usar Vue 3 y Composition API.
- Preferir `<script setup lang="ts">`.
- Usar las capacidades nativas de Nuxt cuando correspondan.
- Usar pages para routing, layouts para estructuras comunes, components para UI reutilizable y composables para lógica reutilizable.
- Usar middleware para restricciones de navegación frontend.
- Usar runtimeConfig correctamente.
- No exponer secretos en código cliente.

## TypeScript
- Todo nuevo frontend debe usar TypeScript.
- Evitar `any` salvo justificación.
- Tipar props, emits, estados y respuestas de API.
- Mantener contratos explícitos.

## Componentes
- Cada componente debe tener una responsabilidad clara.
- Mantener componentes pequeños y reutilizables.
- Las props y emits deben estar tipados.
- Buscar primero componentes existentes.
- Separar lógica reutilizable mediante composables.

## API
Antes de consumir una API identificar método, endpoint, parámetros, body, headers, respuesta, errores y autenticación.
- No inventar contratos.
- No colocar secretos en frontend.
- No confiar en validación frontend como mecanismo de seguridad.

## Estados de UI
Toda operación asíncrona debe contemplar, cuando corresponda:
- loading
- success
- empty
- error
- retry

No asumir que los datos siempre existen.

## Formularios
Separar estado, validación, envío, respuesta y errores.
Los botones deben impedir envíos duplicados durante operaciones en progreso.
Los errores deben ser comprensibles para el usuario.

## Seguridad
Revisar XSS, secretos, datos sensibles, inputs no confiables, tokens, logs y HTML dinámico.
Evitar `v-html` salvo necesidad explícita y contenido correctamente sanitizado.
Nunca registrar tokens, passwords o secretos.

## UX y accesibilidad
- HTML semántico.
- Labels asociados a inputs.
- Navegación por teclado.
- Feedback visible para acciones.
- No usar solamente color para comunicar estados.
- Responsive en desktop, tablet y móvil.

## Testing
Los cambios relevantes deben considerar pruebas de componentes, composables, integración y E2E según corresponda.
Los flujos deben cubrir éxito, validaciones, errores, permisos, estados vacíos y casos límite.

## Implementación de HU
Al implementar una HU:
1. Analizar requisitos.
2. Separar requisitos explícitos, inferencias y desconocidos.
3. Identificar páginas, componentes, composables, API, estados, validaciones, navegación, permisos y textos.
4. Inspeccionar el código existente.
5. Reutilizar antes de crear.
6. Implementar el cambio mínimo necesario.
7. Verificar loading/success/empty/error.
8. Revisar seguridad.
9. Crear o actualizar pruebas.
10. Ejecutar los scripts disponibles de typecheck, lint y tests.
11. Revisar el diff y detectar cambios innecesarios.

## Calidad
La solución debe cumplir la HU, respetar arquitectura, mantener TypeScript, reutilizar código, manejar errores, ser responsive, considerar accesibilidad y no romper funcionalidades existentes.
