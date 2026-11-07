# ESTADO — Plantilla verificable

## Resumen vigente
Esta plantilla NO representa una inspección del proyecto. Conservar y reconciliar evidencias anteriores; no sobrescribir progreso real.
- Subfase inicial si proyecto nuevo: F0.1.
- Última verificada histórica: F2.3; fases F1 y F2 figuran CERRADAS (2026-10-29). Ese historial no está en el workspace adoptado.
- Rama/commit/merge históricos declarados: dev con el merge 104be11 (`--no-ff` de phase/f2-persistence: f3a50d2 F2.1 y 59d9e9b F2.2), más un commit documental posterior. No se recrearon esas ramas o commits.
- Próxima acción vigente: confirmar CI/checks y protección efectiva de `dev`; el merge directo autorizado de F0.2 ya está integrado y publicado sin PR. No iniciar F1.1 ni reanudar F3.1 hasta reconciliar el historial y cerrar las verificaciones pendientes.
- Cambios de arquitectura sobre trabajo previo: revisar y registrar gaps; no simular cumplimiento ni reescribir historial.
- Ajuste operativo (2026-11-07): SUBFASES.md ahora asigna skills y prompts indispensables por ID; PROMPT_CURSOR.md exige leerlos antes de ejecutar, también al reanudar. Esto actualiza el procedimiento futuro, no modifica estados ni evidencias de subfases ya verificadas.
- Revalidación F0.1 (2026-11-07): se conservó la evidencia histórica y se añadió el perfil local macOS a `docs/DECISIONES.md`. Node 22.23.4 cumple el rango del proyecto y las restricciones de Node consultadas; npm 10.9.9 y `package-lock.json` v3 identifican el gestor. El servidor PostgreSQL acepta conexiones, pero su versión no se verificó. El workspace actual no tiene `.git`, discrepando con el resumen que declara F2.3 integrada; no reanudar fases hasta resolver procedencia. No se alteró el estado histórico de avance.
- Reconciliación de workspace (2026-11-07): el usuario autorizó iniciar un repositorio local en este directorio. Se creó baseline `dev` (`d7727b0`) y rama `change/f0.2-api-contracts`; son una nueva línea local de adopción, no reconstruyen ni autentican el historial F2.3 anterior. El flujo actualizado prefiere PR y permite merge sin PR solo con autorización explícita, impedimento documentado y sin eludir protección; ver D-03 en `docs/DECISIONES.md`. La rama fue integrada directamente y publicada en `origin/dev` mediante `c6d320b`; no se creó PR.

## Avance
| ID | Objetivo | Estado |
|---|---|---|
| F0.1 | Entorno y versiones | VERIFICADA |
| F0.2 | Diseño modular y contratos | VERIFICADA (histórico 2026-10-29); BLOQUEADA (adopción local 2026-11-07) |
| F1.1 | Git y scaffold | VERIFICADA |
| F1.2 | PostgreSQL nativo | VERIFICADA |
| F1.3 | Integración y cierre | VERIFICADA |
| F2.1 | Módulos y persistencia | VERIFICADA |
| F2.2 | Migraciones y arnés DB | VERIFICADA |
| F2.3 | Integración y cierre | VERIFICADA |
| F3.0 | Infraestructura base de audit trail | PENDIENTE |
| F3.1 | Catálogo y wrapper | PENDIENTE |
| F3.2 | Sync y bootstrap | PENDIENTE |
| F3.3 | Sesiones y login | PENDIENTE |
| F3.4 | Logout y contraseña | PENDIENTE |
| F3.5 | RBAC efectivo | PENDIENTE |
| F3.6 | Integración y cierre | PENDIENTE |
| F4.0 | Retención y preparación de audit trail | PENDIENTE |
| F4.1 | CRUD roles modular | PENDIENTE |
| F4.2 | Catálogo y asignaciones | PENDIENTE |
| F4.3 | Usuarios lectura/creación | PENDIENTE |
| F4.4 | Edición y roles usuarios | PENDIENTE |
| F4.5 | Borrados y auditoría | PENDIENTE |
| F4.6 | Integración y cierre | PENDIENTE |
| F5.1 | Cliente API y composables | PENDIENTE |
| F5.2 | Componentes controles | PENDIENTE |
| F5.3 | Tabla y estados | PENDIENTE |
| F5.4 | Diálogos y avisos | PENDIENTE |
| F5.5 | Integración y cierre | PENDIENTE |
| F6.1 | Layout y sesión | PENDIENTE |
| F6.2 | Roles componentes/páginas | PENDIENTE |
| F6.3 | Selector permisos | PENDIENTE |
| F6.4 | Usuarios lista/detalle | PENDIENTE |
| F6.5 | Usuarios formulario | PENDIENTE |
| F6.6 | Catálogo y perfil | PENDIENTE |
| F6.7 | Integración y cierre | PENDIENTE |
| F7.1 | E2E funcional | PENDIENTE |
| F7.2 | Seguridad y arquitectura | PENDIENTE |
| F7.3 | Integración y cierre | PENDIENTE |
| F8.1 | Entrega reproducible | PENDIENTE |
| F8.2 | Integración y cierre | PENDIENTE |

## Integración
| Fase | Rama | Estado | Base | Merge | Checks dev |
|---|---|---|---|---|---|
| F1 | phase/f1-setup | CERRADA | dev@a7176fd | dc75b13 | OK: lint, typecheck, build, db:check, preview |
| F2 | phase/f2-persistence | CERRADA | dev@841efb6 | 104be11 | OK: lint, typecheck, unit 26, integración 36, build, db:check, sin deriva, preview |
| F3 | phase/f3-auth-rbac | PENDIENTE | — | — | Pendientes |
| F4 | phase/f4-backend-crud | PENDIENTE | — | — | Pendientes |
| F5 | phase/f5-ui-foundation | PENDIENTE | — | — | Pendientes |
| F6 | phase/f6-frontend | PENDIENTE | — | — | Pendientes |
| F7 | phase/f7-security-tests | PENDIENTE | — | — | Pendientes |
| F8 | phase/f8-delivery | PENDIENTE | — | — | Pendientes |

## Evidencias F0.1
- ID / fecha real / estado: F0.1 / 2026-10-29 / VERIFICADA. El primer intento quedó BLOQUEADA por el runtime; se resolvió con la decisión del usuario sobre perfiles de versión.
- Dependencias y base Git comprobadas: ninguna dependencia; sin `.git` (correcto, ya que Git empieza en F1.1).
- Entregables y archivos: `docs/DECISIONES.md`: reinspección Linux, perfiles de versión (objetivo 4.6.3 frente a local 4.5.2 no obligatorio), riesgos aceptados con mitigaciones, dependencias/E2E y credenciales retiradas.
- Criterios específicos y resultado: comandos reales y fuentes oficiales: OK. Workspace preservado: OK, sin instalaciones ni root. Stack compatible con Node 24.14.1 según engines: OK. Sin credenciales en el proyecto: OK (búsqueda por grep).
- Comandos / resultados / código de salida: `node -v` v24.14.1; `npm -v` 11.11.0; `git --version` 2.43.0; `pg_lsclusters` 16/main online; `pg_isready` rc=0; `npm view` de engines (nuxt, create-nuxt, typeorm, pg, vite, nitropack, vitest, eslint, playwright) rc=0; GitHub Advisories API rc=0 (una consulta de detalle falló, GHSA-2fxj, pero el rango afectado se obtuvo del listado).
- Commit: no aplica (F0 precede a Git).
- Bloqueos y próxima acción: ninguno. Siguiente: F0.2. Pendiente para F1.1: la estrategia de lockfile con dos perfiles.
- Puerta arquitectónica: los 8 criterios NO APLICA. Solo cambió documentación, sin código Vue ni backend (revisión manual).

## Evidencias F0.2
- ID / fecha real / estado: F0.2 / 2026-10-29 / VERIFICADA.
- Dependencias y base Git comprobadas: F0.1 VERIFICADA; sin `.git` (F0 precede a Git).
- Entregables y archivos: `docs/API.md` (nuevo): estructura, módulos con propiedad de datos y dependencias, puertos, API pública interna, kernel, transacciones y composition root, capa HTTP, errores, catálogo de 22 entradas, sesiones/CSRF/rate limit, descubrimiento y verificador, capas Vue, fronteras, plantilla de caso de uso y auditoría. `docs/DECISIONES.md`: sección F0.2.
- Criterios específicos y resultado:
  - PLAN revisado completo: OK.
  - Dependencias acíclicas: OK, con un script de grafo sobre la tabla de API.md (9 módulos, 24 aristas, 0 ciclos; los 4 puertos respetan la dirección).
  - Catálogo frente a la API mínima del PLAN: OK (21/21 con la política correcta; la única entrada extra es `GET /api/auth/csrf`, el auxiliar CSRF que el PLAN permite).
  - Contratos de componente y caso de uso, descubrimiento de rutas y estrategia de fronteras: definidos (secciones 8–11).
- Comandos / resultados / código de salida: `node verify-f02.mjs docs/API.md PLAN.md` → RESULT OK, exit 0. Prueba negativa (ciclo y ruta duplicados inyectados en una copia) → 7 fallos, exit 1. El script vive en el scratchpad de la sesión y no se versiona; desde F3.1 lo sustituyen dependency-cruiser y `verify:catalog`.
- Supuestos para validar después: hook de Nitro (F3.1), concurrencia del último admin (F4.4), coste de 4 consultas por petición RBAC (F3.5).
- Commit: no aplica (F0 precede a Git).
- Bloqueos y próxima acción: ninguno. Siguiente: F1.1.
- Puerta arquitectónica: es una unidad de diseño sin código. Criterios 1–5 y 7: NO APLICA como implementación, pero quedan definidos en API.md (secciones 2–5, 7, 9 y 10). Criterio 6: NO APLICA (no hay código que probar). Revisión manual, salvo la aciclicidad y la cobertura del catálogo, comprobadas por script.

## Reejecución local F0.2 — 2026-11-07
- Estado: BLOQUEADA para cierre integrado; se conserva aparte la evidencia VERIFICADA histórica del 2026-10-29.
- Base: usuario autorizó bootstrap local tras confirmar ausencia de `.git`; F0.1 histórica VERIFICADA. Las referencias a F2.3 no están en este checkout y no se simuló su historial.
- Entregas: `.gitignore`; `docs/API.md` (capas, ownership de 10 módulos, grafo, contratos de casos de uso/UoW, catálogo de 22 claves, Vue/SSR, persistencia, audit trails y pruebas); sección F0.2 en `docs/DECISIONES.md`.
- Git: baseline nuevo en `dev`, `d7727b0` (`chore(F0.2): adopt current workspace baseline`); la rama `change/f0.2-api-contracts` conserva los commits F0.2 `1f8e11e` (`docs(F0.2): define modular API and module boundaries`), `c4aa92f` (registro de verificación), `0a84f8d` (acceso remoto) y `0ea4389` (fallback sin PR). Merge `--no-ff` local y remoto en `dev`: `c6d320b` (`merge(F0.2): integrate authorized direct-merge policy`).
- Acceso remoto (2026-11-07): `origin` HTTPS es `https://github.com/joel-silva-garcia-work/nuxt-base.git`; helper de Git configurado globalmente `osxkeychain`. El usuario seleccionó conservar HTTPS. El push autenticado confirmó `origin/change/f0.2-api-contracts` en `0ea4389` y `origin/dev` en `c6d320b`. No se leyeron ni solicitaron credenciales. GitHub CLI no está instalado.
- Integración F0.2 (2026-11-07): no había PR para la rama. La sesión GitHub disponible es de consulta y el navegador exige iniciar sesión; el remoto inicialmente no tenía rama `dev`. El usuario autorizó el fallback: merge local `--no-ff` y push de la nueva rama remota `dev` completados en `c6d320b`, sin PR. El push fue aceptado; esto no demuestra por sí solo la configuración de protección de rama.
- Compatibilidad consultada: `node --version` v22.23.4; `npm --version` 10.9.9; `git --version` 2.49.0. Registro npm: Nuxt 4.5.2, Vue 3.5.44, TypeORM 1.1.2 y pg 8.23.1 aceptan la versión Node declarada por el proyecto.
- Verificación documental: grafo de 10 módulos acíclico; catálogo 22/22 entradas únicas (21 operaciones del PLAN y GET CSRF auxiliar), políticas correctas. Comprobación por script Node temporal en sesión; no se añadió herramienta permanente.
- No ejecutado: lint/build/typecheck/unitarias/integración/E2E, ni Docker/Compose o conexión a PostgreSQL; no hay `node_modules` y F0.2 solo produce diseño. No se encontraron workflows de CI en `.github/workflows`; checks remotos y protección de `dev` no se pudieron confirmar desde la sesión no autenticada. `git diff --check` pasó para los cambios documentales del flujo. No se afirman otros resultados.
- Puerta arquitectónica: unidad documental; Vue/backend no implementados. Contratos y fronteras documentados; revisión manual, con catálogo/grafo verificados por script. Integración completada por el fallback autorizado; F0.2 permanece BLOQUEADA para cierre hasta comprobar CI/checks y protección efectiva de `dev`. No avanzar a F1.1.
- CI por fases (2026-11-07): se añadió `.github/workflows/ci.yml` en `change/f0.2-ci-workflows`. Calidad y build se ejecutan en contenedor Node; integración dispone de PostgreSQL de servicio y queda activa cuando haya suites; Dockerfile/Compose se validan cuando existan. F1.1 comprueba su ejecución containerizada y configura Docker; F1.2 aporta/activa suites de integración; F7.1 incorpora E2E. YAML válido; `npm run lint`, `npm exec -- nuxt typecheck` y `npm run build` pasaron localmente. `npm run typecheck` no pasa en este checkout porque referencia `scripts/tsconfig.json`, que aún no existe; el workflow ejecuta el typecheck Nuxt disponible y usará el script completo cuando exista esa configuración. No hay tests, Dockerfile ni Compose actualmente, por lo que las suites/validaciones ausentes se anotan como no ejecutadas; falta comprobar CI remoto y configurar checks/protección de rama en GitHub.

## Evidencias F1.1
- ID / fecha real / estado: F1.1 / 2026-10-29 / VERIFICADA.
- Dependencias y base Git comprobadas: F0.2 VERIFICADA. No había repo en el directorio ni en sus padres. Se usa la identidad global existente (sin identidad nueva). `git init -b main`, commit inicial a7176fd (`chore: documentos de planificación F0`), `dev` y `phase/f1-setup` creadas desde ese commit. Sin remotos.
- Entregables y archivos: `.gitignore`, `package.json`, `package-lock.json`, `nuxt.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `app/app.vue`, `public/` y `docs/DECISIONES.md` (sección F1.1).
- Criterios específicos y resultado: identidad y base seguras: OK. Instalación local con npm (sin -g ni root): OK. Arranque dev y preview: OK. Lint, typecheck y build: OK. Ninguna dependencia inválida o ausente.
- Comandos / resultados / código de salida:
  - `npm install -E …` (dependencias y devDependencies): rc 0. Un EBADENGINE de desarrollo aceptado por el usuario (ver DECISIONES).
  - `nuxt prepare`, `npm run lint`, `npm run typecheck` y `npm run build`: rc 0 los cuatro.
  - `node .output/server/index.mjs` y `GET /`: 200 ("Welcome to Nuxt!"). `nuxt dev` y `GET /`: 200. Ambos procesos se detuvieron (ningún puerto queda abierto).
  - Prueba negativa con un archivo temporal ya eliminado: typecheck rc 2 (TS2322) y lint rc 1 (no-unused-vars).
  - `npm ls --all`: 0 dependencias inválidas o ausentes (solo peers opcionales). Escaneo de engines del lockfile: 1 discrepancia aceptada.
- Commit: `feat(F1.1)` en phase/f1-setup (el hash se registra en la evidencia posterior).
- Bloqueos y próxima acción: ninguno. Siguiente: F1.2.
- Puerta arquitectónica (revisión manual; esta unidad es un scaffold sin código de dominio):
  - Criterios 1–2: NO APLICA. `app.vue` es el marcador de posición de la plantilla y se sustituye en F6.1. Los autoimports quedan desactivados para poder verificar las fronteras automáticamente desde F3.1/F5.
  - Criterios 3–5 y 7: NO APLICA, porque no hay servidor, persistencia ni estado.
  - Criterio 6: CUMPLE. Lint, typecheck y build ejecutados, con prueba negativa.

## Evidencias F1.2
- ID / fecha real / estado: F1.2 / 2026-10-29 / VERIFICADA. Primero quedó BLOQUEADA a la espera del aprovisionamiento; se reanudó el mismo día, cuando el usuario ejecutó provision.sql y creó `.env`.
- Dependencias y base Git comprobadas: F1.1 VERIFICADA (507d963) en `phase/f1-setup`; árbol limpio al empezar.
- Entregables y archivos: `.env.example`, `server/platform/config/database.ts`, `scripts/db-check.ts`, `scripts/sql/provision.sql`, `scripts/tsconfig.json`, `package.json` (script `db:check` y typecheck ampliado), `package-lock.json` y `docs/DECISIONES.md` (sección F1.2).
- Inspección: PostgreSQL 16.15 acepta conexiones en 127.0.0.1:5432. Por TCP exige contraseña. El usuario del sistema no tiene rol, y no hay `.pgpass` ni variables PG*/DB*. pg_hba no se puede leer sin root (no se intentó elevar).
- Criterios específicos y resultado:
  - Variables validadas: OK.
  - Procedimiento SQL autorizado: lo ejecutó el usuario.
  - db:check: implementado.
  - Bases separadas: la guarda está implementada y probada.
  - Conexión real a desarrollo y pruebas: OK (db:check, exit 0).
- Comandos / resultados / código de salida:
  - `npm install -E` (pg, zod, @types/pg, @types/node): rc 0.
  - `npm run typecheck` (nuxt y scripts) y `npm run lint`: rc 0.
  - db:check sin variables: exit 2. Host remoto con SSL `disable`: exit 2. Base de pruebas igual a la de desarrollo: exit 2. Puerto inválido: exit 2. Puerto sin servidor: exit 1 (ECONNREFUSED).
  - En ninguna salida aparece la contraseña de prueba (0 coincidencias).
  - Escaneo de engines: sin discrepancias nuevas.
- Commit: `feat(F1.2)` en phase/f1-setup.
- Reanudación: `.env` existe, git lo ignora y tiene las dos contraseñas con valor (contenido no leído). `npm run db:check` → [desarrollo] OK y [pruebas] OK (base nuxt_base / nuxt_base_test, PG 16.15, superusuario=no, create(public)=sí, UTF8), exit 0. Consulta de solo lectura: el rol no tiene createdb/createrole/replication/super, es dueño de las dos bases, PUBLIC no tiene CONNECT y las bases están vacías.
- Bloqueos y próxima acción: ninguno. Siguiente: F1.3. Recomendación pendiente de confirmar: `.env` tiene permisos 664; conviene `chmod 600 .env`.
- Puerta arquitectónica (revisión manual):
  - Criterios 1–2: NO APLICA (sin cambios Vue).
  - Criterio 3: CUMPLE. El script CLI es un adaptador delgado y la configuración vive en `server/platform` sin Nuxt.
  - Criterio 4: CUMPLE. `platform/config` no importa módulos.
  - Criterio 5: CUMPLE. Los secretos no se registran y los errores omiten los valores.
  - Criterio 6: CUMPLE. Pruebas negativas de configuración por CLI y conexión real a las dos bases. El runner de tests unitarios aún no está instalado (subfase pendiente de decidir).
  - Criterio 7: NO APLICA (sin consultas de aplicación).

## Evidencias F2.1
- ID / fecha real / estado: F2.1 / 2026-10-29 / VERIFICADA.
- Dependencias y base Git comprobadas: F1 CERRADA (merge dc75b13, cierre 841efb6); dev limpio, sin merges pendientes. Rama `phase/f2-persistence` creada desde dev.
- Entregables y archivos:
  - kernel: `transaction.ts` (Tx opaca y TransactionRunner), `pagination.ts` e `index.ts`.
  - platform/db: `data-source.ts`, `transaction.ts`, `sql.ts` e `index.ts`. `platform/config/database.ts` añade DB_POOL_MAX.
  - modules: audit, auth, permissions, roles y users, cada uno con domain, infraestructura (EntitySchema y repositorios), `application/ports.ts` (excepto audit, con su puerto en infraestructura) e `index.ts` público.
  - composition: `persistence.ts` (registro de entidades y DataSource único) y `data-source.cli.ts`. Plugin `server/plugins/database.ts`.
  - pruebas: `vitest.config.ts`, 2 suites unitarias y 1 de integración.
  - `package.json` y lockfile (typeorm, vitest, scripts de test), `.env.example` (POOL_MAX), `scripts/tsconfig.json` (NodeNext para servidor y pruebas), docs/API.md §2 y docs/DECISIONES.md.
- Criterios específicos y resultado:
  - Fronteras y composición explícitas: OK. Los módulos solo se registran en composition; no hay imports entre módulos ni hacia composition/http/api; platform y kernel no importan módulos (grep). Grafo de API.md acíclico (script).
  - `synchronize=false`: OK (prueba de integración y config). La inicialización no crea tablas (prueba con recuento antes y después).
  - Sin imports en el cliente: OK. `.output/public` no contiene typeorm, EntitySchema ni password_hash; app/ no importa server/, typeorm ni pg.
  - Sin conexiones duplicadas: OK. Hay un DataSource por proceso; con 20 transacciones concurrentes, `pg_stat_activity` se mantiene dentro de poolMax; pedir otro destino se rechaza.
- Comandos / resultados / código de salida:
  - `npm run test:unit`: 21/21, rc 0.
  - `npm run test:integration`: 9/9, rc 0. Cubre conexión a la base de pruebas, sin sync ni migraciones, 8 tablas registradas, singleton, límite del pool, transacción compartida, rollback, commit y Tx caducada.
  - Guarda negativa (`TEST_DB_NAME=nuxt_base`): la suite falla antes de conectar, rc 1.
  - CLI `typeorm schema:log` (solo lectura) con TS nativo: rc 0, 8 `CREATE TABLE`, FK con ON DELETE CASCADE o RESTRICT según el diseño, índice parcial de email.
  - lint rc 0 (tras sustituir dos `delete` dinámicos); typecheck (nuxt y tsc NodeNext) rc 0; build limpio rc 0, con pg, pg-pool y typeorm en `.output/server/node_modules` gracias a `driver: pg`.
  - preview `GET /` 200 con apagado por SIGTERM limpio; `nuxt dev` `GET /` 200; sin puertos abiertos.
  - `db:check` rc 0. Las dos bases siguen con 0 tablas en public (la tabla de prueba se borra en afterAll).
- Commit: `feat(F2.1)` en phase/f2-persistence.
- Bloqueos y próxima acción: ninguno. Las pruebas de repositorios contra tablas reales dependen de las migraciones (F2.2).
- Puerta arquitectónica:
  - Criterios 1–2: NO APLICA (sin cambios Vue).
  - Criterio 3: CUMPLE. Aún no hay handlers; los repositorios no conocen HTTP y son por Tx.
  - Criterio 4: CUMPLE. Dependencias explícitas y sin ciclos; cada módulo expone su index; las FK entre módulos se declaran por nombre de entidad, sin imports (grep y script; dependency-cruiser desde F3.1).
  - Criterio 5: CUMPLE. Tx compartida probada; `passwordHash` fuera de UserRecord y con `select:false`.
  - Criterio 6: CUMPLE. Pruebas unitarias y de integración de transacción y DataSource. Las de repositorios con tablas llegan en F2.2.
  - Criterio 7: CUMPLE. Paginación acotada en todos los repositorios (`toOffsetLimit`, máximo 100), roles por lote sin N+1, pool limitado y estado de sesión y rate limit en PostgreSQL.

## Evidencias F2.2
- ID / fecha real / estado: F2.2 / 2026-10-29 / VERIFICADA.
- Dependencias y base Git comprobadas: F2.1 VERIFICADA (f3a50d2) en `phase/f2-persistence`; árbol limpio al empezar; db:check OK.
- Entregables y archivos:
  - Migraciones: `server/migrations/1793300014585-InitialSchema.ts` e `index.ts`.
  - Composition: `persistence.ts` (migraciones inyectables) y `data-source.cli.ts` (con MIGRATIONS). Ajustes en `platform/db/data-source.ts` (tipo de migrations) y en la entidad de audit (default jsonb).
  - Arnés: `tests/integration/support/test-database.ts` (guardas, migración y limpieza), `tests/integration/setup/global-setup.ts` y `vitest.config.ts` (globalSetup).
  - Pruebas: `migrations.test.ts`, `repositories.test.ts` y `tests/unit/test-database-guard.test.ts`; `persistence.test.ts` usa ahora la guarda común.
  - Scripts `db:migrate` y `db:migrate:revert`; `docs/DECISIONES.md` (sección F2.2).
- Criterios específicos y resultado:
  - Aplicar, revertir y reaplicar: OK. En desarrollo con la CLI: tablas 0 → 9 (1 migración) → 1 (0) → 9 (1); un segundo `db:migrate` no tiene pendientes. En pruebas, por test con undo y run.
  - FK y únicos: OK. Email único entre no borrados y reutilizable tras borrado lógico; únicos de nombre de rol, clave y método+ruta; checks de política y resultado de auditoría (23514); RESTRICT en permisos asignados y CASCADE de rol hacia sus relaciones, sin tocar usuarios ni permisos.
  - Rechazo de limpieza insegura: OK. Sobre nuxt_base la guarda aborta tras una única lectura de `current_database()` (spy: una sola llamada, sin TRUNCATE), y migrar la base de desarrollo con el arnés se rechaza sin llamar a runMigrations. Unitarias: base de desarrollo, otra `_test`, nombre vacío y configuración igual con NODE_ENV=test.
  - Repositorios en transacción compartida: OK. Una Tx atraviesa permissions, roles y users; un ID inválido revierte todo (usuario no creado; asignaciones previas conservadas).
- Comandos / resultados / código de salida:
  - `npm run test:unit`: 26/26, rc 0. `npm run test:integration`: 3 archivos, 36/36, rc 0.
  - Mutación temporal (quitar `FOR UPDATE`): la prueba de serialización del lock falla, rc 1; se restauró con `git checkout`.
  - `migration:generate --check`: «No changes», rc 0. Antes del ajuste de jsonb daba rc 1, una deriva ficticia que quedó corregida.
  - lint rc 0; typecheck (nuxt y tsc NodeNext) rc 0; build limpio rc 0 (sin migraciones ni typeorm en el cliente; 0 migraciones en el bundle servidor); preview `GET /` 200 con SIGTERM limpio; db:check rc 0.
  - Estado final: las dos bases con 9 tablas, 1 migración y 0 filas de aplicación.
- Commit: `feat(F2.2)` en phase/f2-persistence.
- Bloqueos y próxima acción: ninguno. Siguiente: F2.3.
- Puerta arquitectónica:
  - Criterios 1–2: NO APLICA (sin cambios Vue).
  - Criterio 3: CUMPLE (sin handlers; el arnés está fuera de los módulos).
  - Criterio 4: CUMPLE. Las migraciones solo entran por composition (CLI) y por el arnés; módulos, platform y kernel sin imports nuevos entre sí (revisado en el diff).
  - Criterio 5: CUMPLE. Transacción compartida y rollback probados; `passwordHash` ausente de UserRecord y de la paginación (prueba).
  - Criterio 6: CUMPLE. Integración PostgreSQL de todos los repositorios, migraciones y guardas, con prueba de mutación.
  - Criterio 7: CUMPLE. Paginación acotada probada, roles por lote sin N+1, lock serializado y rate limit atómico concurrente.

## Evidencias por subfase — plantilla
- ID / fecha real / estado:
- Dependencias y base Git comprobadas:
- Entregables y archivos:
- Criterios específicos y resultado:
- Comandos / resultados / código de salida:
- Commit (registrar posteriormente si hace falta):
- Bloqueos y próxima acción:

### Revisión arquitectónica obligatoria
Cada fila: CUMPLE / NO CUMPLE / NO APLICA justificado, evidencia y método (automatizado/manual).
| Criterio | Resultado | Evidencia/método |
|---|---|---|
| Componentes Vue cohesivos, props/eventos tipados, páginas delgadas | Pendiente | — |
| Composables/cliente reutilizados y sin UI/lógica duplicada | Pendiente | — |
| Handlers delgados y casos de uso sin contexto HTTP | Pendiente | — |
| Módulos con API pública, dependencias sin ciclos/privados cruzados | Pendiente | — |
| Repositorios encapsulados y transacciones compartidas | Pendiente | — |
| DTO/secretos/configuración seguros | Pendiente | — |
| Pruebas afectadas ejecutadas | Pendiente | — |
| Consultas acotadas, SSR y estado multi-proceso correctos | Pendiente | — |

## Evidencia de integración F1 (F1.3)
- Fase/unidad/rama/base/final de implementación: F1 / F1.3 / `phase/f1-setup` / base dev@a7176fd / final 57bde1e (F1.1 507d963 y F1.2 57bde1e, ambas VERIFICADAS).
- Checks previos (en phase/f1-setup): árbol limpio; sin MERGE_HEAD, rebase, stash ni remotos. Lint rc 0, typecheck (nuxt y scripts) rc 0, build rc 0, db:check rc 0 en las dos bases, preview `GET /` 200, `npm ls --all` sin inválidos ni ausentes.
- Arquitectura previa: app/ no importa server/, pg ni typeorm (0 coincidencias); server/platform no importa nuxt, h3, `#*` ni módulos; no existe server/utils; no hay handlers todavía. Revisión con grep y manual (las reglas de dependency-cruiser llegan en F3.1).
- Merge: `git switch dev` y `git merge --no-ff phase/f1-setup` → dc75b13. El primer intento falló con rc 129 (`-F -` no está soportado por `git merge`) sin modificar nada; se repitió con `-m`. Sin conflictos: dev era ancestro de la rama. 0 archivos sin resolver y 0 marcadores de conflicto.
- Commits fix: ninguno.
- Checks posteriores EN dev: lint rc 0, typecheck rc 0, build limpio (`.output` borrado antes) rc 0, db:check rc 0 (desarrollo y pruebas OK), preview `GET /` 200 (proceso detenido, sin puertos abiertos), fronteras app→server 0. Sin conflictos que alteren la arquitectura.
- Ancestría y árbol limpio: se verifican después del commit documental (`git merge-base --is-ancestor phase/f1-setup dev`); el resultado se informa en la respuesta, porque este commit no puede contener su propio hash.
- Estado de fase y bloqueos: F1 CERRADA. Sin bloqueos. Seguridad aplicada: `.env` con permisos 600, a recomendación aceptada por el usuario.

## Evidencia de integración F2 (F2.3)
- Fase/unidad/rama/base/final de implementación: F2 / F2.3 / `phase/f2-persistence` / base dev@841efb6 / final 59d9e9b (F2.1 f3a50d2 y F2.2 59d9e9b, ambas VERIFICADAS).
- Checks previos (en la rama): árbol limpio; sin MERGE_HEAD, rebase, stash ni remotos; dev era ancestro de la rama.
  - Calidad: lint rc 0, typecheck rc 0, unitarias 26/26, integración 36/36 (3 archivos), build limpio rc 0.
  - Bundles: cliente sin typeorm, pg ni password_hash; servidor sin migraciones y con pg incluido.
  - Base de datos: db:check rc 0; `migration:show` con InitialSchema aplicada; `--check` sin cambios.
  - Arranque: preview `GET /` 200 y sin puertos abiertos.
- Arquitectura previa (grep, sin dependency-cruiser hasta F3.1): app/shared → server/typeorm/pg 0; platform → modules/composition 0; modules → composition/http/api 0; kernel sin imports externos; imports entre módulos que no vayan al index 0.
- Merge: `git switch dev` y `git merge --no-ff phase/f2-persistence` → 104be11. Sin conflictos, 0 archivos sin resolver y 0 marcadores.
- Commits fix: ninguno.
- Checks posteriores EN dev: la misma batería, con resultados idénticos. La arquitectura no cambia, porque no hubo conflictos.
- Ancestría y árbol limpio: se verifican después de este commit documental; el resultado se informa en la respuesta.
- Estado de fase y bloqueos: F2 CERRADA, sin bloqueos.

## Evidencia de integración — plantilla
- Fase/unidad/rama/base/final de implementación:
- Checks previos y arquitectura:
- Hash merge y conflictos/resolución:
- Commits fix:
- Checks posteriores EN dev y arquitectura tras conflictos:
- Ancestría y árbol limpio:
- Estado de fase y bloqueos:

No incluir contraseñas/tokens/conexiones secretas ni hashes inventados. Commit documental referencia hashes anteriores, no su propio hash en su contenido.
