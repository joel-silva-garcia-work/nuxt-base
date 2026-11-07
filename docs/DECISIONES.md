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
