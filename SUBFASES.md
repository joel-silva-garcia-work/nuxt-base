# SUBFASES — Objetivos, entregas y verificación

## Contrato común obligatorio
Una ejecución por ID, luego detenerse. Dependencias VERIFICADAS y fase anterior CERRADA para abrir otra. Desde F0.2 se usa Git y un repositorio remoto autorizado: `dev` es la rama estable y cada tarea independiente tiene su propia rama `change/<subfase>-<slug>`. No crear ramas comunes `phase/*` ni commits de cambios directamente en `dev`; fixes y documentación de integración también tienen su propia rama. Para el fallback autorizado sin PR, se permite un único commit documental de recibo en `dev` después del merge, solo para registrar hash y resultado final, sin cambios funcionales. Una tarea dependiente parte de la rama del prerrequisito aún no integrado; integrar las ramas verificadas en orden de dependencias, preferentemente mediante PR. Si no se puede crear o confirmar un PR por falta de herramienta o autenticación, el merge sin PR requiere autorización explícita del usuario responsable, registro del impedimento y las mismas verificaciones. Nunca eludir protección de rama; si bloquea la integración, detenerse BLOQUEADA. No integrar cambios sin verificar. Publicar ramas en el remoto requiere autorización; nunca borrar ramas sin autorización. F0.2 inicializa el repositorio y versiona también los documentos creados en F0.1.
Cada cambio realizado debe quedar en su rama con commits cuyo mensaje describa la acción concreta; la expresión «commit si corresponde» en los cierres no exime de versionar cambios realizados. F0.1 se incorpora al repositorio en F0.2.
Toda acción HTTP POST, PUT, PATCH o DELETE que cambie datos debe generar el audit trail conforme al contrato común; nuevos endpoints deben incluirlo desde su implementación y F4.5 verifica la cobertura completa.
Objetivo de cada unidad = su título y entregables dentro de PLAN.md. Terminado: entregas reales, CI requerido aprobado, verificaciones indicadas, typecheck/tests afectados, puerta arquitectónica de PLAN.md cumplida con evidencias, estado actualizado, diff/migraciones/Docker revisados, comandos y resultados registrados, enlace al PR o evidencia del merge directo autorizado y commits revisados desde F0.2. Los commits usan Conventional Commits con la subfase después del tipo y describen la acción (por ejemplo, `feat(F4.3/users): persistir usuarios con roles`); evitar mensajes genéricos. Nuevos endpoints con catálogo/wrapper/pruebas y audit trail.
Cada unidad debe demostrar reutilización frontend o modularidad backend cuando aplique: sin páginas con negocio, controles con fetch, handlers con consultas, dependencias cíclicas ni duplicación de reglas. Registrar NO APLICA justificado si no toca esas capas.
Si demasiado grande, subdividir antes en .a/.b y actualizar contratos/estado. Padre solo verificado al cumplir hijos y comprobación conjunta. Falta de entorno/prueba = BLOQUEADA. No alterar seguridad para avanzar. No merge salvo unidad de integración.

## Contenedores y almacenamiento obligatorio
Desde F0.2, Docker es obligatorio para la aplicación Nuxt, PostgreSQL, pruebas y servicios auxiliares en desarrollo, CI y entrega local. F0.2 documenta la estrategia y F1.1 entrega Dockerfile/Compose funcionales. El despliegue de producción queda fuera de este alcance. No usar Redis en ninguna fase ni añadirlo como dependencia o servicio. Persistir en PostgreSQL solo las sesiones y los contadores de rate limit requeridos por el contrato; no añadir caché general.

## Decisiones adoptadas
- Una rama por tarea independiente, nombrada `change/<subfase>-<slug>`; las tareas dependientes parten de su prerequisito aún no integrado.
- Integración preferente mediante PR y merge commit `--no-ff`; fallback sin PR solo con autorización explícita, impedimento registrado y checks disponibles aprobados. No hacer commits de cambios directamente en `dev` ni eludir protección de rama. Pipeline requerido en cada rama y en cada PR/integración: lint, typecheck, build, unitarias, integración con PostgreSQL y E2E afectados. Validar Dockerfile/Compose si cambian.
- Commits Conventional Commits con la subfase después del tipo: `feat(F4.3/users): crear usuarios con roles`.
- Audit trail solo para mutaciones exitosas con cambios de datos. Registrar fallos/rechazos como eventos de seguridad separados; no crear trail para operación sin cambios.
- La infraestructura común del audit trail se construye en F3.0 antes de los primeros endpoints mutables; F4.0 completa retención/preparación de CRUD y F4.5 verifica cobertura integral.
- El audit trail contiene campos separados `previous_state` y `current_state` JSONB. Diferencia plana por columna; null es valor, campo omitido es ausencia de cambio y los arrays se comparan completos.
- Guardar mutación y trail atómicamente. Permitir hasta tres reintentos adicionales solo para fallos transitorios de escritura recuperables mediante savepoint; si se agotan, rollback de toda la operación. Errores permanentes o de transacción/conexión revierten sin reintento.
- Capturar IP, URL saneada (ruta sin query ni fragmento), actor, acción, entidad, método HTTP, código HTTP y request/correlation ID, además de ID y fecha UTC generada por PostgreSQL. Excluir secretos. Archivar y finalmente eliminar los trails conforme a destino y plazos de retención activa y de archivo que deben aprobarse antes de F4.0.
- Pipeline CI corre en cada rama y bloquea la integración (por PR o merge directo autorizado) si falla un check requerido: lint, typecheck, build, unitarias, integración PostgreSQL en contenedor y E2E afectados. Validar Dockerfile/Compose cuando cambien. Para cerrar una unidad, documentar diff revisado, migraciones y compatibilidad Docker, comandos ejecutados, resultados y enlace al PR o evidencia del merge directo.

## Skills y prompts indispensables por subfase
Antes de ejecutar una subfase, consulta su fila en esta matriz y lee completos todos los `SKILL.md` y prompts enumerados. Son requisitos de trabajo, no sugerencias ni recursos que se suponga que el agente ya cargó automáticamente. Si no puede acceder a alguno, marca la subfase BLOQUEADA y explica cuál falta; no lo omitas silenciosamente.

Los prompts adicionales están en `.continue/prompts/`; lee y aplica su procedimiento dentro de la subfase, sin iniciar otra tarea ni ampliar su alcance. `Ninguno` significa que no hay un prompt adicional del catálogo adecuado: sigue siendo obligatorio el prompt de ejecución correspondiente de `PROMPT_CURSOR.md`. La regla o skill no reemplaza el contrato de PLAN/SUBFASES.

Prioridad ante discrepancias: PLAN.md y el contrato de la subfase > PROMPT_CURSOR.md > prompt adicional > skill. Aplica de cada skill y prompt solo lo pertinente al objetivo; no ejecutes refactors o tareas extra fuera del contrato.

| Subfase | Skills requeridas (`skills/<nombre>/SKILL.md`) | Prompts adicionales requeridos (`.continue/prompts/<nombre>.md`) |
|---|---|---|
| F0.1 | `requirements`, `architecture`, `nuxt`, `typescript` | Ninguno |
| F0.2 | `requirements`, `architecture`, `nuxt`, `typescript`, `typeorm-postgresql`, `security` | `analyze-requirement` |
| F1.1 | `architecture`, `nuxt`, `typescript` | Ninguno |
| F1.2 | `typeorm-postgresql`, `typescript`, `security`, `qa` | `create-tests` |
| F1.3 | `architecture`, `security`, `qa` | `review-code`, `security-review` |
| F2.1 | `architecture`, `typeorm-postgresql`, `typescript`, `security` | `implement-hu`, `create-tests`, `security-review` |
| F2.2 | `typeorm-postgresql`, `typescript`, `security`, `qa` | `create-tests`, `security-review` |
| F2.3 | `architecture`, `typeorm-postgresql`, `security`, `qa` | `review-code`, `security-review` |
| F3.0 | `architecture`, `typeorm-postgresql`, `typescript`, `security`, `qa` | `implement-hu`, `create-tests`, `security-review` |
| F3.1 | `architecture`, `typescript`, `security`, `qa` | `implement-hu`, `create-tests`, `security-review` |
| F3.2–F3.5 | `architecture`, `typeorm-postgresql`, `typescript`, `security`, `qa` | `implement-hu`, `create-tests`, `security-review` |
| F3.6 | `architecture`, `security`, `qa` | `review-code`, `security-review` |
| F4.0 | `architecture`, `typeorm-postgresql`, `typescript`, `security`, `qa` | `implement-hu`, `create-tests`, `security-review` |
| F4.1–F4.5 | `architecture`, `typeorm-postgresql`, `typescript`, `security`, `qa` | `implement-hu`, `create-tests`, `security-review` |
| F4.6 | `architecture`, `security`, `qa` | `review-code`, `security-review` |
| F5.1 | `architecture`, `nuxt`, `nuxt-vue-frontend`, `typescript`, `security`, `qa` | `implement-hu`, `create-tests`, `security-review` |
| F5.2–F5.4 | `architecture`, `nuxt`, `nuxt-vue-frontend`, `typescript`, `qa` | `implement-hu`, `create-tests`, `review-code` |
| F5.5 | `architecture`, `nuxt`, `nuxt-vue-frontend`, `typescript`, `qa` | `review-code` |
| F6.1–F6.6 | `architecture`, `nuxt`, `nuxt-vue-frontend`, `typescript`, `security`, `qa` | `implement-hu`, `create-tests`, `security-review` |
| F6.7 | `architecture`, `nuxt`, `nuxt-vue-frontend`, `typescript`, `security`, `qa` | `review-code`, `security-review` |
| F7.1 | `e2e`, `qa`, `security`, `typescript` | `create-qa-cases`, `create-tests`, `security-review` |
| F7.2 | `architecture`, `nuxt`, `nuxt-vue-frontend`, `typeorm-postgresql`, `typescript`, `security`, `qa`, `e2e` | `review-code`, `security-review`, `create-tests` |
| F7.3 | `architecture`, `security`, `qa`, `e2e` | `review-code`, `security-review` |
| F8.1 | `architecture`, `nuxt`, `typeorm-postgresql`, `security`, `qa`, `e2e` | `review-code`, `create-tests`, `security-review` |
| F8.2 | `architecture`, `security`, `qa` | `review-code`, `security-review` |

## F0

### F0.1 — Entorno y versiones
- Dependencia: Ninguna.
- Objetivo/entregables: docs/DECISIONES.md: entorno, versiones compatibles, gestor y bloqueos.
- Verificación específica: Comandos reales y documentación oficial; preservar workspace.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F0.2 — Git, diseño modular y contratos
- Dependencia: F0.1.
- Objetivo/entregables: Inicializar el repositorio Git y `dev` estable, versionar los documentos F0.1, definir ramas por tarea independiente, flujo de PR/fallback autorizado y commits Conventional Commits con subfase; workflow CI base para todas las ramas; docs/API.md; mapa de módulos/dependencias, API pública interna, capas Vue, transacciones, sesiones/CSRF, catálogo y estrategia Docker/Compose para la app.
- Verificación específica: Revisar PLAN completo; dependencias acíclicas; contratos de componente/caso de uso, discovery de rutas y estrategia de fronteras definidos; configurar remoto autorizado, proteger `dev` contra commits de cambios directos y establecer workflow/checks requeridos; validar YAML y ejecutar los checks disponibles; crear una rama `change/f0.2-<slug>` por tarea; no incorporar Redis.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia y commits descriptivos, crear PR y validar checks cuando sea posible o documentar el impedimento y la autorización del fallback; integrar con merge commit `--no-ff`, registrar el resultado y comprobar árbol limpio antes de detenerse.

## F1

Ramas: una `change/<subfase>-<slug>` por cada cambio de F1, conforme al contrato común.

### F1.1 — Scaffold y contenedores
- Dependencia: F0.2.
- Objetivo/entregables: Nuxt, TS, lockfile, scripts, Dockerfile y Compose para app y servicios; completar el workflow base `.github/workflows/ci.yml` con checks de calidad y validación real de Docker/Compose; documentación versionada desde F0.2.
- Verificación específica: Arranque, lint/typecheck/build y pruebas dentro de contenedores; no depender de Node o servicios instalados localmente; CI ejecuta lint/typecheck/build y pruebas unitarias existentes, y construye/valida Dockerfile/Compose reales; si grande dividir .a scaffold y .b contenedores.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F1.2 — PostgreSQL en contenedor
- Dependencia: F1.1.
- Objetivo/entregables: PostgreSQL en Docker Compose, variables validadas, procedimiento SQL autorizado, db:check y bases separadas para desarrollo/pruebas; activar en CI las suites de integración con PostgreSQL.
- Verificación específica: Conectar realmente desde los contenedores de desarrollo/pruebas y desde el servicio PostgreSQL del workflow CI; no secretos en imágenes ni repositorio; permisos ausentes bloquean.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F1.3 — Integración y cierre de F1
- Dependencia: F1.2 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F1, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F1 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.

## F2

Ramas: una `change/<subfase>-<slug>` por cada cambio de F2, conforme al contrato común.

### F2.1 — Módulos y persistencia
- Dependencia: F1.3.
- Objetivo/entregables: Estructura modular, contratos repositorio/transacción, entidades y DataSource CLI/servidor.
- Verificación específica: Fronteras y composición explícitas; synchronize=false; sin imports al cliente ni conexiones duplicadas.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F2.2 — Migraciones y arnés DB
- Dependencia: F2.1.
- Objetivo/entregables: Migración, scripts, setup integración y guardas de destino.
- Verificación específica: Aplicar/revertir/reaplicar; FK/únicos; rechazo limpieza insegura; repositorios en transacción compartida.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F2.3 — Integración y cierre de F2
- Dependencia: F2.2 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F2, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F2 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.

## F3

Ramas: una `change/<subfase>-<slug>` por cada cambio de F3, conforme al contrato común.

### F3.0 — Infraestructura base de audit trail
- Dependencia: F2.3.
- Objetivo/entregables: Módulo reutilizable y migración inicial del audit trail, contrato transaccional, estados JSONB separados y metadatos de actor, IP, URL, acción/recurso, fecha UTC, método, código HTTP y request/correlation ID. Dejarlo disponible antes de implementar endpoints mutables de F3.
- Verificación específica: Probar diff plana por columna, sanitización de secretos, actor humano/sistema, IP solo desde proxy confiable, request ID, JSON previo/actual, atomicidad y rollback. Eventos de solicitudes fallidas/rechazadas van a logs de seguridad separados; no generar trail para no-op. No usar Redis.
- Cierre: servicio reusable listo para auth y CRUD; commit descriptivo y PR con checks requeridos; detenerse sin merge de fase.

### F3.1 — Catálogo y wrapper
- Dependencia: F3.0.
- Objetivo/entregables: Registro tipado, adaptador HTTP común, errores y verificador rutas/wrapper/fronteras.
- Verificación específica: Duplicados/faltantes fallan; RBAC provisional deniega; controladores delgados y dependencias sin ciclos.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F3.2 — Sync y bootstrap
- Dependencia: F3.1.
- Objetivo/entregables: Caso de uso sync y admin:create; repositorios y rol reservado.
- Verificación específica: Idempotencia, retirados inactivos, nuevos permisos admin, contraseña no sobrescrita; sin negocio en CLI/handler.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F3.3 — Sesiones y login
- Dependencia: F3.2.
- Objetivo/entregables: Módulo auth con puertos/casos de uso/adaptadores; hash, sesiones, login/me, cookies/CSRF/rate limit.
- Verificación específica: Válido/inválido/expirado/inactivo; sin enumeración/secretos; sesiones persistidas en PostgreSQL para compartir entre instancias, sin Redis ni memoria local como almacén único. Dividir si grande.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F3.4 — Logout y contraseña
- Dependencia: F3.3.
- Objetivo/entregables: Casos de uso logout/cambio propio, handlers delgados y revocación.
- Verificación específica: Contraseña anterior, CSRF, revocación real y errores seguros; reglas auth reutilizadas.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F3.5 — RBAC efectivo
- Dependencia: F3.4.
- Objetivo/entregables: Servicio autorización por API interna, sin duplicar consultas de permisos.
- Verificación específica: 401/403, unión, revocación siguiente petición, usuario sin roles, HEAD/OPTIONS y estado sin fuga SSR.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F3.6 — Integración y cierre de F3
- Dependencia: F3.5 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F3, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F3 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.

## F4

Ramas: una `change/<subfase>-<slug>` por cada cambio de F4, conforme al contrato común.

### F4.0 — Retención y preparación de audit trail
- Dependencia: F3.6.
- Objetivo/entregables: Extender el servicio base de F3.0 con retención activa, archivo y eliminación de audit trails, e índices/consultas de historial para las entidades CRUD. Acordar y documentar el destino de archivo y los plazos de retención activa y de archivo antes de implementar.
- Verificación específica: Probar archivo y eliminación conforme a los plazos aprobados, operación segura de migraciones y consultas acotadas; verificar que F3.0 sigue auditando mutaciones auth y que F4 CRUD puede consumir el servicio común. No duplicar tablas/servicios ni procesar datos secretos.
- Cierre: infraestructura probada y lista para ser consumida por toda mutación; commits descriptivos y PR con checks requeridos; detenerse sin merge de fase.

### F4.1 — CRUD roles modular
- Dependencia: F4.0.
- Objetivo/entregables: Casos de uso/DTO/repositorio/handlers roles, paginación/auditoría.
- Verificación específica: Crear solo nombre/descripción sin permisos; únicos/campos internos; handlers sin TypeORM/negocio.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F4.2 — Catálogo y asignaciones
- Dependencia: F4.1.
- Objetivo/entregables: API catálogo/sync y casos de uso GET/PUT permisos de rol.
- Verificación específica: Solo RBAC activos; [] normal; rollback ID inválido; rol reservado protegido; transacción atraviesa repositorios.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F4.3 — Usuarios lectura/creación
- Dependencia: F4.2.
- Objetivo/entregables: Casos de uso/DTO/handlers users y roles existentes por contrato público.
- Verificación específica: Email único/normalizado, cero/varios roles, rollback, paginación sin N+1 y DTO sin hash.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F4.4 — Edición y roles usuarios
- Dependencia: F4.3.
- Objetivo/entregables: Casos de uso PATCH/GET-PUT roles e invariante admin centralizada.
- Verificación específica: Revocación, allowlist, [] salvo último admin, concurrencia; sin acceder a privados de otro módulo.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F4.5 — Borrados y audit trails
- Dependencia: F4.4.
- Objetivo/entregables: Borrado lógico usuarios, roles/relaciones e integración y verificación del audit trail de todas las acciones HTTP POST, PUT, PATCH y DELETE exitosas que cambien datos desde F3.0 en adelante.
- Verificación específica: El servicio común recibe los dos objetos JSON serializados, compara por columna y guarda solo las diferencias en dos columnas independientes `previous_state` y `current_state` JSONB. En POST, previo `{}`; en DELETE, actual `{}`; para PUT/PATCH, omitir campos no modificados. Arrays se comparan completos, null es valor y campo omitido significa sin cambio. Registrar ID, fecha UTC, actor, IP, URL saneada, método, código de respuesta, request/correlation ID, acción y entidad/ID. Los fallos/rechazos van a logs de seguridad separados; no crear trail si no hubo cambio. Mutación y trail atómicos; hasta tres reintentos adicionales con savepoint solo para fallos transitorios recuperables; agotados o ante fallo permanente/transaccional, rollback completo. Excluir secretos. Probar cobertura de F3 y F4, cambios, creación, borrado, no-op, fallos, campos sensibles, actor/IP/URL, retención, reintentos, concurrencia y rollback; sesiones revocadas, no cascada de usuarios/permisos, último admin concurrente, regresión y fronteras backend.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F4.6 — Integración y cierre de F4
- Dependencia: F4.5 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F4, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F4 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.

## F5

Ramas: una `change/<subfase>-<slug>` por cada cambio de F5, conforme al contrato común.

### F5.1 — Cliente API y composables
- Dependencia: F4.6.
- Objetivo/entregables: Cliente tipado/composables auth/permisos/errores; contrato base/dominio.
- Verificación específica: SSR aislado, CSRF, sin tokens localStorage; cliente único, tests y build.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F5.2 — Componentes controles
- Dependencia: F5.1.
- Objetivo/entregables: BaseButton/Input/Textarea/Select/Checkbox/FormField tipados.
- Verificación específica: Props/eventos/slots, labels/teclado/estados; sin endpoints/router/negocio en base; tests.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F5.3 — Tabla y estados
- Dependencia: F5.2.
- Objetivo/entregables: DataTable/Pagination/SearchInput/Loading-Empty-Error reutilizables.
- Verificación específica: Eventos sin fetch interno; estados/orden/paginación probados; sin copias de tablas.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F5.4 — Diálogos y avisos
- Dependencia: F5.3.
- Objetivo/entregables: Modal/ConfirmDialog/notificaciones/guard de cambios.
- Verificación específica: Foco/escape/confirmar/cancelar; cancelar no elimina; sin dependencia de entidad concreta.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F5.5 — Integración y cierre de F5
- Dependencia: F5.4 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F5, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F5 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.

## F6

Ramas: una `change/<subfase>-<slug>` por cada cambio de F6, conforme al contrato común.

### F6.1 — Layout y sesión
- Dependencia: F5.5.
- Objetivo/entregables: Header/Sidebar/PermissionGuard/PageHeader y páginas delgadas login/dashboard/403/404.
- Verificación específica: Composición reusable, navegación/sesión SSR sin parpadeo, useAuth/usePermissions únicos y backend autoriza.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F6.2 — Roles componentes/páginas
- Dependencia: F6.1.
- Objetivo/entregables: RoleTable/RoleForm/useRoles y lista/crear/editar por composición.
- Verificación específica: Sin fetch/negocio duplicado en páginas; solo nombre/descripción; paginación/errores/reservado.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F6.3 — Selector permisos
- Dependencia: F6.2.
- Objetivo/entregables: PermissionSelector, composable catálogo y página de asignación delgada.
- Verificación específica: Props/eventos, agrupación/búsqueda, guardar/recargar; solo RBAC activos; selector no ligado a una página.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F6.4 — Usuarios lista/detalle
- Dependencia: F6.3.
- Objetivo/entregables: UserTable/componente detalle/useUsers y páginas delgadas.
- Verificación específica: Paginación/filtros backend, sin secretos, 403/404/estados/confirmación; sin tabla copiada.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F6.5 — Usuarios formulario
- Dependencia: F6.4.
- Objetivo/entregables: UserForm/RoleMultiSelect compartidos crear/editar.
- Verificación específica: Cero/varios roles existentes, doble envío, errores, guard cambios y último admin; no formularios paralelos.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F6.6 — Catálogo y perfil
- Dependencia: F6.5.
- Objetivo/entregables: PermissionTable/componentes perfil/cambio contraseña y páginas composición.
- Verificación específica: Sin permisos arbitrarios, CSRF, responsive/teclado; auditoría de reutilización de todas las páginas; checks globales.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F6.7 — Integración y cierre de F6
- Dependencia: F6.6 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F6, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F6 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.

## F7

Ramas: una `change/<subfase>-<slug>` por cada cambio de F7, conforme al contrato común.

### F7.1 — E2E funcional
- Dependencia: F6.7.
- Objetivo/entregables: Fixtures seguras, navegador y PostgreSQL dedicados; incorporar las suites E2E al workflow CI.
- Verificación específica: Admin crea rol vacío/asigna lectura/crea usuario; escritura 403 directa; segundo rol suma/revocación resta; E2E se ejecutan en contenedores en cada rama e integración.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F7.2 — Seguridad y arquitectura
- Dependencia: F7.1.
- Objetivo/entregables: Regresión CSRF/sesiones/concurrencia/catálogo, revisión dependencias y fronteras FE/BE.
- Verificación específica: Sin ciclos/imports privados/handlers gordos/UI duplicada; sesiones compartibles, consultas acotadas; críticos resueltos o bloqueo.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F7.3 — Integración y cierre de F7
- Dependencia: F7.2 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F7, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F7 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.

## F8

Ramas: una `change/<subfase>-<slug>` por cada cambio de F8, conforme al contrato común.

### F8.1 — Entrega reproducible
- Dependencia: F7.3.
- Objetivo/entregables: README/API/decisiones y guía añadir módulo/componente/endpoint.
- Verificación específica: Instalación limpia y reproducible con Docker Compose; migraciones/bootstrap y todos los tests/checks en contenedores; auditoría final de arquitectura.
- Cierre: contrato común y puerta arquitectónica cumplidos; registrar evidencia, commit si corresponde y detenerse sin merge.

### F8.2 — Integración y cierre de F8
- Dependencia: F8.1 y todas las unidades de la fase VERIFICADAS.
- Objetivo/entregables: integrar en `dev` las ramas verificadas de cada cambio de F8, resolver conflictos/fallos y registrar cierre real.
- Verificación:
  1. Árbol limpio, diff revisado, cambios commiteados y ningún merge ajeno pendiente.
  2. Lint/typecheck/build/regresión exigible y puerta arquitectónica aprobados ANTES de integrar.
  3. Integrar cada rama verificada de F8 en orden de dependencias, preferentemente por PR con checks aprobados; si no puede crearse/confirmarse por falta de herramienta o autenticación, usar solo el fallback autorizado del contrato común. Merge commit `--no-ff`; resolver conflictos sin quitar seguridad/tests ni romper fronteras/componentes.
  4. Completar merge; sin archivos sin resolver ni marcadores introducidos.
  5. Repetir checks EN dev, incluida revisión de composición/modularidad afectada por conflictos.
  6. Si falla: BLOQUEADA; crear rama propia `change/<subfase>-integration-fix`, sin nuevas funciones; pasar checks y reintentar por PR o fallback autorizado. Sin remoto autorizado o si la protección bloquea la integración, detenerse bloqueado.
  7. Registrar merge/fixes/resultados en commit descriptivo de una rama propia y verificada; integrar esa rama, comprobar ancestría de todas las ramas integradas y árbol limpio.
- Cierre: subfase VERIFICADA y fase CERRADA solo con evidencia posterior aprobada. No publicar ni borrar ramas sin autorización. Detenerse antes de siguiente fase.
