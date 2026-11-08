# Decisiones técnicas

## F0.1 — Entorno y versiones

### Revalidación del workspace — 2026-11-07

Esta sección registra el entorno observado en esta ejecución. No sustituye ni elimina la evidencia histórica de F0.1 que permanece en `ESTADO.md`.

| Elemento | Evidencia observada | Decisión |
|---|---|---|
| Sistema operativo | macOS 25.4.0, Darwin, arm64 | Desarrollo local en macOS. |
| Node.js | `node -v` → `v22.23.4`; `.nvmrc` → `22.23.4` | Mantener Node 22.23.4 para este workspace. Cumple el rango de `engines.node` del proyecto. |
| Rango del proyecto | `package.json`: `^22.19.0 || ^24.11.0 || >=26.0.0` | No ampliar ni cambiar el rango en F0.1. |
| Gestor | `npm -v` → `10.9.9`; único lockfile raíz: `package-lock.json`, lockfileVersion 3; `packageManager` no está declarado | Usar npm y conservar `package-lock.json` como fuente de resolución. No se modificó el manifiesto para añadir un pin de gestor. |
| Nuxt y frontend | Nuxt `4.5.2`, Vue `3.5.44`, Vue Router `5.4.0`, TypeScript `5.9.3` | Versiones exactas observadas en `package.json`; las restricciones verificadas son compatibles con Node 22.23.4. |
| Backend y pruebas | TypeORM `1.1.2`, `pg` `8.23.1`, Vitest `5.0.5`, ESLint `10.13.0` | Versiones exactas observadas en `package.json`; sus restricciones de Node verificadas admiten Node 22.23.4. |
| PostgreSQL | `pg_isready` → `/tmp:5432 - accepting connections` (código 0); cliente `psql` `15.18` | Hay un servidor local que acepta conexiones. No se confirmó la versión del servidor ni se intentó autenticar; verificarlo con el procedimiento autorizado antes de tareas DB. |
| Git | `git --version` → `2.49.0`; el directorio actual no contiene `.git` | No inicializar Git en F0.1. La falta de `.git` coincide con la secuencia de F0, pero discrepa del `ESTADO.md`, que afirma que ya se integró F2.3; resolver la procedencia del workspace antes de reanudar fases posteriores. |
| Instalación | `node_modules` no existe | No instalar dependencias ni ejecutar build/tests como parte de esta revalidación de entorno. |

### Compatibilidad comprobada

- La guía oficial de instalación de Nuxt 4 requiere Node.js 22.x o posterior y recomienda una versión LTS par: <https://nuxt.com/docs/4.x/getting-started/installation>.
- La documentación oficial de Node.js clasifica la rama 22 como LTS al momento de esta verificación: <https://nodejs.org/en/about/previous-releases>.
- Se consultaron los metadatos `engines` del registro npm para las versiones exactas de Nuxt, TypeORM, `pg`, Vitest, ESLint y TypeScript declaradas en el manifiesto. Donde no se publicó un campo `engines`, no se infirió una restricción adicional. Node 22.23.4 satisface las restricciones publicadas consultadas.
- Comandos ejecutados: `uname -a`, `node -v`, `npm -v`, `git --version`, `pg_isready`, `psql --version`, `npm pkg get engines packageManager dependencies.nuxt devDependencies.nuxt devDependencies.typescript devDependencies.vitest`, consulta de `package-lock.json` para `lockfileVersion` y paquete raíz, e inspección de lockfiles de primer nivel.

### Alcance y bloqueos

- No se instalaron paquetes, no se modificaron servicios ni privilegios y no se leyeron credenciales.
- Esta comprobación confirma el perfil local de macOS, pero no demuestra que este directorio sea el checkout Git al que se refiere el historial F2.3 de `ESTADO.md`. Esa continuidad queda pendiente y bloquea reanudar la siguiente fase hasta aclararla.
- La versión real del servidor PostgreSQL queda pendiente de verificación con acceso autorizado. `pg_isready` demuestra disponibilidad, no versión ni permisos de aplicación.
- El documento `docs/DECISIONES.md` no estaba presente en el workspace observado. Esta sección conserva únicamente resultados medidos ahora; no reconstruye decisiones históricas no disponibles.

## Decisiones de arquitectura adoptadas — 2026-11-07

Las siguientes opciones fueron seleccionadas para el contrato del proyecto y se reflejan en `PLAN.md` y `SUBFASES.md`.

| ID | Decisión adoptada |
|---|---|
| D-01 | Una rama por tarea independiente, no por subfase completa. Las tareas dependientes parten de su prerequisito aún no integrado. |
| D-02 | Integrar mediante merge commit `--no-ff`; no usar squash ni rebase. |
| D-03 | No abrir PR. Integrar ramas verificadas directamente en `dev` mediante merge commit `--no-ff`, con pipeline y checks requeridos aprobados. No hacer commits de cambios directamente en `dev` ni eludir protecciones; si la política de ramas impide el merge directo, dejar el trabajo BLOQUEADO. |
| D-04 | Conventional Commits con la subfase como scope después del tipo, por ejemplo `feat(F4.3/users): crear usuarios con roles`. |
| D-05 | Docker obligatorio para app, PostgreSQL, pruebas y servicios auxiliares en desarrollo, CI y entrega local. Producción fuera de este alcance. |
| D-06 | PostgreSQL para sesiones y contadores de rate limit requeridos por el plan; no Redis ni caché general. |
| D-07 | Audit trail para mutaciones exitosas que cambian datos; fallos/rechazos en eventos de seguridad separados y no-op sin trail. |
| D-08 | Infraestructura base del audit trail en F3.0 antes de los primeros endpoints mutables; F4.0 prepara retención/CRUD y F4.5 valida cobertura integral. |
| D-09 | Diferencia plana por columna y JSONB; `previous_state` y `current_state` son columnas independientes. Null es valor, campo omitido no cambia, arrays se comparan completos. |
| D-10 | Metadatos de actor, IP, URL saneada (ruta sin query ni fragmento), acción/entidad, método, código HTTP y request/correlation ID, además de ID y fecha UTC de PostgreSQL. Estados anterior y actual separados. |
| D-11 | Excluir secretos; archivar y finalmente eliminar registros al vencer los plazos aprobados de retención activa y del archivo. |
| D-12 | Transacción atómica; hasta tres reintentos adicionales para fallo transitorio recuperable mediante savepoint. Si se agotan, rollback de la operación. |
| D-13 | CI obligatorio en cada rama y merge directo; F0.2 instala `.github/workflows/ci.yml`, F1.1 verifica contenedores/Docker, F1.2 integra PostgreSQL y F7.1 E2E. Los checks requeridos bloquean la integración; suites aún no entregadas se identifican explícitamente como no ejecutadas. |
| D-14 | Evidencia de cierre con diff/migraciones/Docker revisados, comandos/resultados y hash/evidencia del merge registrado. |

Pendiente necesario antes de F4.0: aprobar el destino de archivo y los plazos concretos de retención activa y de archivo antes de implementar archivado y eliminación de audit trails.

### Antecedente de integración de F0.2 — 2026-11-07

Durante esa integración no había PR en GitHub, la herramienta disponible era de consulta y `origin` no publicaba una rama `dev`; el usuario autorizó completar el merge sin PR. Ese registro describe la autorización puntual de aquella ejecución, no la política vigente. La política actual es no abrir PR e integrar directamente mediante merges verificados. Nunca omitir checks ni superar una protección de rama; si esta impide el merge directo, el estado debe quedar BLOQUEADA.

## F0.2 — Contratos modulares y compatibilidad — 2026-11-07

- `docs/API.md` define el monolito modular Nuxt/Nitro, módulos propietarios, puertos y grafo acíclico; casos de uso independientes de HTTP/TypeORM; transacción con contexto/UoW explícito; catálogo method/path/política; fronteras Vue/SSR y pruebas.
- El catálogo contiene 21 operaciones del API mínimo más el auxiliar CSRF permitido: 22 claves estables únicas y políticas explícitas.
- Se conservan versiones fijadas; no se modifican dependencias. Comandos ejecutados ahora: `node --version` → v22.23.4; `npm --version` → 10.9.9; `git --version` → 2.49.0; `npm view nuxt@4.5.2 engines --json`, Vue 3.5.44, TypeORM 1.1.2 y pg 8.23.1. Node satisface el rango del proyecto y los `engines` publicados consultados.
- No se ejecutaron instalación, build, base de datos ni contenedores: F0.2 produce contratos, no runtime. Docker/Compose sigue requerido por los documentos vigentes, según decisión confirmada para esta ejecución.
- Fuentes oficiales: Nuxt server routes, auto-imports y composables; TypeORM transactions; PostgreSQL transactions; Vue state management (enlaces en `docs/API.md`).

### Remediación de auditoría de dependencias — 2026-11-07

- `npm ci` reportó inicialmente 26 vulnerabilidades: 2 bajas y 24 moderadas. Se actualizaron Nuxt a `4.6.4` y ESLint a `10.14.0`, versiones compatibles con Node 22.23.4, y se fijaron overrides para `glob@14.0.2` y `minimatch@11.0.1`. Los checks lint, typecheck Nuxt y build pasan.
- La auditoría final reporta 7 bajas, 0 moderadas/altas/críticas. Los advisories remanentes de Nuxt ofrecen solo Nuxt `4.1.3` como fix, que es anterior a `4.6.2`, versión que corrige advisories previos de route rules y `useHeadSafe`; no se acepta esa degradación. `deepmerge@4.3.1` sigue afectado por GHSA-gcqx-w48m-w2h4 y es la última versión publicada en npm; no hay versión corregida disponible.
- No se ejecutó `npm audit fix --force` ni se ocultaron findings. Revalidar los avisos remanentes cuando Nuxt o deepmerge publiquen una solución compatible.

## F1.1 — Scaffold y contenedores — 2026-11-07

- Se conserva Node `22.23.4` de `.nvmrc` y `package-lock.json`; `typecheck` ejecuta Nuxt en esta subfase. F1.2 ampliará el chequeo de scripts cuando incorpore su configuración TypeScript.
- `Dockerfile` usa etapas development/build/runtime sobre Node slim fijado a `22.23.4`. Compose monta el workspace para desarrollo y usa volúmenes separados para `node_modules` y `.nuxt`; el runtime de producción ejecuta solo `.output` con usuario no root y healthcheck HTTP.
- `.env.example` contiene solo `APP_PORT`; los secretos `.env*` quedan fuera del contexto Docker, salvo la plantilla sin secretos. Compose inicia la app sin PostgreSQL, que se añade en F1.2.
- El job Docker de CI construye la imagen de producción, valida Compose, arranca el servicio de desarrollo y comprueba la respuesta HTTP. Las pruebas unitarias se activarán cuando se incorporen archivos de test; no se reportan suites inexistentes como ejecutadas.
- Documentación mínima de ejecución con Compose en `README.md`; la guía de entrega completa sigue en F8.1.
- Verificación remota de Docker build/arranque: CI run 42400395114, SUCCESS; Dockerfile de producción construido, Compose validado, servicio de desarrollo healthy y smoke test HTTP aprobado. El build Docker local no concluyó por baja velocidad de descarga, queda registrado como intento no exitoso y no afecta la verificación remota reproducible.

## F1.2 — PostgreSQL en contenedor — 2026-11-07

- Compose añade PostgreSQL 17 separado para desarrollo y pruebas, con volumen persistente, healthcheck, configuración explícita del usuario administrativo y credenciales de aplicación desde `.env`. No se crean bases ni roles al iniciar Nuxt.
- El aprovisionamiento requiere ejecutar manualmente `scripts/sql/provision.sql` con una cuenta superusuario. Crea `DB_NAME` y `TEST_DB_NAME` con roles no superusuario separados, y exige que cada rol sea dueño de su base; no borra datos ni cambia propietarios existentes. Rechaza roles preexistentes con privilegios elevados o membresías.
- `server/platform/config/database.ts` valida nombres, puertos, credenciales y modo TLS; solo permite TLS desactivado para hosts locales/Compose y usa validación de certificados para `require`. `scripts/db-check.ts` conecta y valida ambas bases sin imprimir contraseñas ni mensajes crudos del driver.
- Verificación remota: [CI run 42408841230](https://github.com/joel-silva-garcia-work/nuxt-base/actions/runs/42408841230), SUCCESS en los tres jobs. PostgreSQL de servicio: aprovisionó ambos roles/bases, `db:check` y prueba de integración reales. Docker/Compose: build, arranque saludable, aprovisionamiento, `db:check` desde `app`, integración desde `tests` y smoke test HTTP.
- `.env.example` contiene nombres/configuración, no contraseñas; el usuario debe completar los campos vacíos localmente. Variables de CI son credenciales efímeras de prueba, no secretos productivos.
- Verificación local: lint, typecheck (Nuxt y scripts), 6 pruebas unitarias, build de Nuxt y `docker compose config --quiet` pasan. El intento local de descargar `postgres:17-alpine` se detuvo tras más de cuatro minutos; no quedaron contenedores ni volúmenes. La validación real de PostgreSQL quedó cubierta por CI remoto.

## F1.3 — Integración y cierre de F1 — 2026-11-07

- Prechecks: F1.1 verificada en `change/f1.1-scaffold-containers` (CI run 42402460345); F1.2 verificada en `change/f1.2-postgres-containers` (CI run 42409564126). La historia confirma F1.1 como ancestro de F1.2 y ambas ramas descienden de `dev`@80d314e. Los preflights `git merge-tree --write-tree` no reportaron conflictos.
- La revisión de seguridad F1.3 encontró que Compose publicaba PostgreSQL en todas las interfaces. En `change/f1.3-integration-fix`, el bind predeterminado se restringe a `127.0.0.1`; exponerlo requiere configurar explícitamente `POSTGRES_HOST_BIND_ADDRESS`. README documenta el cambio y CI comprueba la dirección predeterminada.
- Fix revisado, commit `5c1c535`, CI run 42412569587 SUCCESS. Integración directa `--no-ff`, sin PR ni conflictos: F1.1 → `8fc0084`, F1.2 → `aaa0974`, fix → `964ec3d`.
- Checks locales en `dev`: lint, typecheck, 6 unitarias, build Nuxt, YAML, Compose config/bind y diff check pasan. La descarga local de PostgreSQL no concluyó; conexiones y tests reales se validaron en CI.
- CI post-merge en `dev`: run 42414200647 SUCCESS en los tres jobs: calidad/build, PostgreSQL service, y Docker/Compose con health, aprovisionamiento, conexiones reales desde app/tests y smoke HTTP.
- Resultado: ramas F1.1/F1.2/fix son ancestros de `dev`; árbol limpio en `964ec3d`. F1.3 VERIFICADA y fase F1 CERRADA.

## F2.1 — Módulos y persistencia — 2026-11-07

- Los módulos poseen sus `EntitySchema` privados y exportan únicamente registros/puertos de aplicación desde su `index.ts`. La composición registra una vez las entidades de users, roles, permissions, auth y audit; las relaciones crean los metadatos de `user_roles` y `role_permissions`, sin una entidad de unión pública.
- El token `Tx` es opaco para aplicación y dominio. `PostgresTransactionRunner` asocia el token con el `EntityManager` transaccional, comparte ese manager entre repositorios y lo invalida al resolver o rechazar el callback.
- La raíz de composición crea un único DataSource por proceso y rechaza seleccionar después el otro destino. CLI y Nitro usan las mismas entidades y configuración; `synchronize` y `migrationsRun` son siempre `false`. Nitro registra el cierre del pool sin conectarse durante el arranque, porque el aprovisionamiento de bases/roles es explícito y posterior al inicio de Compose.
- Los pools son acotados mediante `DB_POOL_MAX` y `TEST_DB_POOL_MAX` (por defecto 10); `.env.example` usa un máximo menor para pruebas. Los secretos de usuario y sesión tienen `select: false`, y el registro de usuario no contiene `passwordHash`.
- Las migraciones y su ciclo de vida pertenecen a F2.2. Esta unidad registra metadata y contratos; no altera ni crea tablas.

## F2.2 — Migraciones y arnés DB — 2026-11-07

- La migración inicial es el único mecanismo de creación de esquema; `synchronize=false` y `migrationsRun=false` se mantienen. El DataSource CLI y la composición runtime registran la misma migración sin autoejecutarla al iniciar Nuxt.
- La base `TEST_DB_*` es el único destino de reset en integración. Antes de ejecutar la suite que revierte esquema se exige opt-in `TEST_DB_ALLOW_SCHEMA_RESET=true`, nombre `*_test`, base y rol distintos de desarrollo, conexión efectiva al nombre/rol configurados y rol no superusuario. Se rechazan tablas públicas no administradas y migraciones desconocidas; no se usa `NODE_ENV=test` como salvaguarda.
- La migración crea las tablas de users, roles, permissions, asociaciones, sesiones, rate limit y audit; añade FK/índices/checks, unicidad de email activo normalizado y las reglas de borrado de relaciones. Las pruebas aplican, revierten y reaplican, comprueban restricciones, y fuerzan rollback de repositorios de users/roles/permissions mediante el mismo `Tx`.
- En `.env.example` la autorización de reset queda desactivada. CI la activa solo para su base de pruebas descartable; la instrucción local advierte que habilitarla en un `*_test` reinicia las tablas gestionadas por la migración.

### Adopción local F2.2 — 2026-11-08

- La rama `change/f2.2-migrations-db-harness`, basada en F2.1, quedó VERIFICADA en CI run 42433897297: calidad/build, integración PostgreSQL y Docker/Compose aprobados. Se corrigió deriva de metadata en PK, índices, generación UUID y acciones FK `ON UPDATE`; la prueba de integración verifica que TypeORM no proponga cambios sobre el esquema migrado.
- Guardas de reset verificadas contra una base de pruebas aislada y rol no superusuario; integración confirma aplicar/revertir/reaplicar, constraints y rollback compartido. La revisión de seguridad no encontró vulnerabilidades.
- La integración local posterior se registra en la sección F2.3; no se abrió PR.

## F2.3 — Integración y cierre de F2 — 2026-11-08

- Se integraron directamente en `dev` mediante merges `--no-ff`, sin PR ni conflictos: `change/f2.1-modules-persistence` (`e22a836`, merge `4586471`), `change/f2.2-migrations-db-harness` (`4d16dfa`, merge `2ac7a33`) y `change/f2.3-integration-fix` (`58ba7a5`, merge `0cca960`).
- La revisión técnica encontró y corrigió el ciclo de vida obsoleto del singleton DataSource y la búsqueda por email normalizado/borrado lógico. Fix probado en CI run 42438506400. Revisión de seguridad sin hallazgos.
- Checks locales post-merge en `dev`: lint, typecheck, 15 unitarias, build, Compose config y diff check aprobados. CI post-merge run 42439071311 aprobó los tres jobs: calidad/build, PostgreSQL integration, Docker/Compose.
- F2.1 y F2.2 quedaron verificadas en la ancestría de `dev`; F2.3 VERIFICADA y F2 CERRADA. No se borraron ramas.

## F3.0 — Infraestructura base de audit trail — VERIFICADA en rama

- Se confirmó que F2.2 ya crea `audit_entries` con metadatos, estados JSONB separados y `created_at DEFAULT now()`. No se modifica la migración histórica; F3.0 añade una migración reversible con índice por `request_id`.
- `RecordAuditChange` recibe actor y contexto explícitos, limita el registro a mutaciones 2xx, elimina query/fragmento de la ruta y genera diferencias planas por columna. Los campos sensibles se excluyen incluso dentro de objetos/arrays; cambios exclusivamente sensibles generan evento sin valores y un no-op no genera fila.
- La resolución de IP usa el peer de conexión como fuente predeterminada; considera `X-Forwarded-For` solo cuando el peer coincide con una dirección exacta en la allowlist confiable, y descarta cadenas inválidas.
- `TypeOrmAuditWriter` escribe con el manager de la transacción, reintenta como máximo tres veces adicionales solo para `40001`, `40P01` o `55P03`, y marca rollback-only ante fallo de auditoría para impedir commits si el error se captura aguas arriba.
- Verificación: lint, typecheck, unitarias (21), build, Compose config y diff check aprobados; integración PostgreSQL real (3 archivos, 11 pruebas) pasó en contenedor temporal aislado con rol no superusuario. Revisión de seguridad sin hallazgos. No se publicó ni integró la rama; F3.0 queda lista en su rama y se detiene antes de F3.1.
- Commit de implementación: `d45d3b8` (`feat(F3.0/audit): implementar audit trail transaccional`).

## F3.1 — Catálogo y wrapper

- `server/http/catalog.ts` registra de forma tipada las 22 operaciones del contrato con clave, módulo, método, patrón, descripción y política. `implemented` separa entradas futuras del conjunto de rutas ya activas; el verificador exige ruta y wrapper a todas las activas sin exigir endpoints de subfases posteriores.
- `defineApiEndpoint` es el adaptador común para rutas Nuxt. Comprueba el patrón completo, no autoriza por prefijo, restringe métodos y conserva autorización al aceptar `HEAD` como `GET`; `OPTIONS` queda denegado. No se entrega un autorizador RBAC hasta F3.5: RBAC responde 403 aun si se proporciona el autorizador de sesión.
- `ApiHttpError` y el wrapper serializan errores con request ID y sin filtrar mensaje/stack de fallos inesperados. El wrapper usa solo el request ID ya validado en el contexto del servidor o genera uno nuevo.
- `npm run verify:architecture` comprueba catálogo completo, duplicados, rutas activas, uso del wrapper, imports entre módulos, fronteras app/server/platform y ciclos. Descubre extensiones de ruta Nitro TypeScript/JavaScript (y falla ante archivos de ruta no reconocidos), además de imports en bloques script de SFC Vue; la revisión de delgadez de handlers sigue siendo manual.
