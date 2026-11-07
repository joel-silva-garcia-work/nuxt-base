# Contrato de arquitectura y API

## 1. Alcance y reglas de diseño

Este documento define fronteras y contratos para implementar el PLAN; no declara endpoints implementados. Nuxt aloja la app Vue y el backend HTTP Nitro en el mismo proyecto. PostgreSQL es la persistencia compartida. No se usa Redis. Docker/Compose es requisito del proyecto para app, base y pruebas en desarrollo, CI y entrega local; el despliegue de producción queda fuera del alcance.

- Interfaz en español; identificadores de código en inglés.
- Toda interfaz Vue vive en componentes SFC cohesivos reutilizables; páginas/layouts componen y conectan datos, sin lógica de negocio.
- Backend como monolito modular: handlers HTTP delgados llaman casos de uso; los casos no dependen de HTTP, Nuxt ni TypeORM.
- El módulo dueño del dato es el único que modifica su agregado. Otros módulos acceden por contratos públicos, nunca por repositorios, entidades o rutas internas.
- Cambios del esquema exclusivamente mediante migraciones; `synchronize=false`.
- Operaciones que escriben usan una unidad de trabajo/transacción compartida. No se usa el `EntityManager` global dentro de una transacción.

## 2. Mapa de capas y ubicación

| Capa | Ubicación prevista | Responsabilidad |
|---|---|---|
| Presentación base | `app/components/base/` | Controles accesibles genéricos, solo props/eventos tipados; sin fetch, router, permisos ni negocio. |
| Presentación de dominio | `app/components/<dominio>/` | Componentes cohesivos de users, roles, permissions y auth; consumen contratos explícitos. |
| Aplicación de frontend | `app/composables/`, `app/lib/api/` | Estado por solicitud cuando corresponda, reglas de presentación y cliente API tipado centralizado. |
| Composición UI | `app/pages/`, `app/layouts/` | Composición delgada, navegación y enlace de composables/componentes. |
| Adaptación HTTP | `server/api/`, `server/middleware/` | Descubrimiento de rutas Nuxt, parseo/contexto, validación de frontera, wrapper, caso de uso y serialización de respuesta. |
| Aplicación backend | `server/modules/<módulo>/application/` | Casos de uso y puertos; entrada/salida tipadas sin tipos HTTP ni TypeORM. |
| Dominio/persistencia | `server/modules/<módulo>/domain/`, `infrastructure/` | Reglas/invariantes y adaptadores/repositorios privados del módulo. |
| Plataforma y composición | `server/platform/`, `server/composition/` | Configuración validada, DataSource, transacciones y ensamblaje explícito de adaptadores/servicios. |
| Contratos transversales | `shared/` o contratos públicos de módulos | Tipos sin runtime de servidor/TypeORM; solo primitivos realmente compartidos. |

Las rutas de `server/api/` son el adaptador público. Nuxt las descubre por estructura de directorios; el catálogo de autorización se compara con las rutas descubiertas. No importar código `app/` en el servidor ni código servidor en `app/`.

## 3. Módulos y propiedad de datos

| Módulo | Propiedad y API pública interna |
|---|---|
| `permissions` | Catálogo de permisos y operaciones de lectura/validación del conjunto de permisos activos. API: listar por contrato, resolver claves y comprobar IDs activos. |
| `roles` | Roles y relación Role–Permission. API: resolver roles existentes, listar permisos efectivos/asignados, asignar/reemplazar permisos y consultar roles de usuario por interfaz de aplicación. |
| `users` | Usuarios, datos privados y relación User–Role. API: obtener identidad mínima activa, crear/actualizar/inhabilitar usuario y resolver sus roles. Nunca expone `passwordHash`. |
| `auth` | Login, cambio/logout, sesiones y cookies/CSRF. API: resolver contexto de sesión y revocar; depende del contrato público de users. |
| `authorization` | Decisión RBAC de una petición con identidad y endpoint, consultando APIs públicas de roles y permissions; no posee sus datos. |
| `audit` | Registro append-only de cambios y consulta autorizada de trazas. Recibe actor y snapshots explícitos; no importa entidades de users/roles. |
| `platform` | Configuración, DataSource PostgreSQL, migraciones y contexto transaccional; no contiene reglas de negocio. |
| `http` | Adaptadores/rutas/wrapper y descubrimiento de rutas; conecta contratos de auth, authorization, catálogo y casos de uso. |
| `composition` | Raíz de composición que instancia adaptadores y casos de uso; no es dependencia de los módulos de dominio. |
| `shared` | Errores tipados, paginación, validación y contratos mínimos de identidad/transacción; sin entidades ni servicios god-object. |

El orden de dependencias es dirigido. `roles -> permissions, audit`; `users -> roles, audit`; `auth -> users, audit`; `authorization -> roles, permissions`; `audit -> platform, shared`; módulos de dominio dependen de contratos `shared` cuando sea necesario; `http -> auth, authorization, users, roles, permissions`; `composition -> platform, http` y módulos de dominio. `platform -> shared`. No hay dependencias inversas ni ciclos. IDs y DTOs cruzan módulos; entidades y repositorios no.

Las transacciones se pasan mediante un contexto/UoW explícito que encapsula el `EntityManager` transaccional. Un caso de uso multi-módulo llama APIs de aplicación con ese mismo contexto. Cada repositorio obtiene su manager desde el contexto y no desde un singleton global.

## 4. Contratos de casos de uso

- Casos de uso reciben un input DTO tipado y contexto explícito (actor, request ID, transacción cuando aplique); retornan resultado tipado o error de aplicación.
- Casos de uso no reciben `H3Event`, `Request`, `Response`, cookies ni entidades TypeORM.
- Puertos definen solo operaciones necesarias para el caso de uso. Adaptadores TypeORM traducen entidades a modelos/DTO de salida.
- Validación de forma/tipos en el borde HTTP y reglas/invariantes en dominio/caso de uso; repetir solo las validaciones necesarias para proteger límites de confianza.
- Listados: `page`, `pageSize` acotado, filtros/orden en allowlist y respuesta `{ items, page, pageSize, total }`.
- Respuesta de error uniforme: `{ error: { code, message, details? }, requestId }`; nunca incluir stack, SQL, credenciales ni datos internos.
- PUT de relaciones reemplaza el conjunto de forma atómica; PATCH cambia solo campos explícitos. ID inválido no deja escrituras parciales.

## 5. Contrato de endpoints y catálogo

Cada combinación método/patrón tiene una clave única en catálogo, descripción, módulo y política. Métodos agrupados aquí son entradas independientes en el registro. `PUBLIC` es explícita; `AUTHENTICATED` exige sesión; `RBAC` exige permiso activo para la ruta exacta. La autorización deniega por defecto y no usa coincidencias inseguras por prefijo.

| # | Clave estable | Módulo | Método | Ruta | Política |
|---:|---|---|---|---|---|
| 1 | `auth.login` | auth | POST | `/api/auth/login` | PUBLIC |
| 2 | `auth.logout` | auth | POST | `/api/auth/logout` | AUTHENTICATED |
| 3 | `auth.me` | auth | GET | `/api/auth/me` | AUTHENTICATED |
| 4 | `auth.changePassword` | auth | POST | `/api/auth/change-password` | AUTHENTICATED |
| 5 | `users.list` | users | GET | `/api/users` | RBAC |
| 6 | `users.create` | users | POST | `/api/users` | RBAC |
| 7 | `users.get` | users | GET | `/api/users/:id` | RBAC |
| 8 | `users.update` | users | PATCH | `/api/users/:id` | RBAC |
| 9 | `users.delete` | users | DELETE | `/api/users/:id` | RBAC |
| 10 | `users.roles.get` | users | GET | `/api/users/:id/roles` | RBAC |
| 11 | `users.roles.replace` | users | PUT | `/api/users/:id/roles` | RBAC |
| 12 | `roles.list` | roles | GET | `/api/roles` | RBAC |
| 13 | `roles.create` | roles | POST | `/api/roles` | RBAC |
| 14 | `roles.get` | roles | GET | `/api/roles/:id` | RBAC |
| 15 | `roles.update` | roles | PATCH | `/api/roles/:id` | RBAC |
| 16 | `roles.delete` | roles | DELETE | `/api/roles/:id` | RBAC |
| 17 | `roles.permissions.get` | roles | GET | `/api/roles/:id/permissions` | RBAC |
| 18 | `roles.permissions.replace` | roles | PUT | `/api/roles/:id/permissions` | RBAC |
| 19 | `permissions.list` | permissions | GET | `/api/permissions` | RBAC |
| 20 | `permissions.get` | permissions | GET | `/api/permissions/:id` | RBAC |
| 21 | `permissions.sync` | permissions | POST | `/api/permissions/sync` | RBAC |
| 22 | `auth.csrf` | auth | GET | `/api/auth/csrf` | PUBLIC |

`HEAD`/`OPTIONS` tienen comportamiento explícito en el wrapper, sin abrir autorización por defecto. El endpoint CSRF es auxiliar permitido por PLAN. Login/logout y sincronización respetan CSRF conforme a su contrato de sesión. El sync del catálogo es idempotente, desactiva permisos retirados y no crea CRUD arbitrario.

Verificador futuro (F3.1): comparar en ambas direcciones rutas descubiertas y catálogo; fallar ante método/patrón duplicado, ruta sin catálogo, entrada sin ruta, política ausente y endpoint sin wrapper. Excluir assets/framework solo mediante fronteras documentadas. El catálogo no se basa en IDs concretos de recursos.

## 6. Seguridad, sesión y trazabilidad

- Sesión revocable en cookie `HttpOnly`, `Secure` en producción y `SameSite` definido; sin tokens en `localStorage`. Persistencia compartida en PostgreSQL, nunca solo memoria de proceso.
- CSRF para mutaciones, validación allowlist, consultas parametrizadas, errores sin detalles internos y rate limit requerido usando PostgreSQL. No Redis ni caché general.
- Actor autenticado o actor de sistema explícito; contexto por solicitud, no singleton mutable compartido durante SSR.
- Cada POST/PUT/PATCH/DELETE que cambie datos genera audit trail en la misma transacción; no-op no genera cambio. Fallos y rechazos son eventos de seguridad separados.
- Campos: ID y timestamp UTC generado por PostgreSQL, actor, IP obtenida de conexión/proxy confiable, URL saneada sin query/fragmento, método, código HTTP, request/correlation ID, acción, recurso/ID y `previous_state`/`current_state` JSONB separados.
- Los dos snapshots se serializan para el servicio de auditoría. Persistir solo columnas modificadas en cada JSON: valor previo y actual; POST usa previo `{}`, DELETE usa actual `{}`. Comparación plana, `null` como valor, omitido como “sin cambio”, arrays comparados completos.
- Excluir credenciales, hashes, tokens, cookies y secretos. Reintentar hasta tres veces adicionales solo ante error de escritura transitorio recuperable mediante savepoint; si falla, rollback. Errores permanentes/transaccionales revierten sin reintento.
- F3.0 implementa servicio base antes de las primeras mutaciones; F4.0 define retención/archivo; F4.5 prueba la cobertura integral. Destino y plazos de retención deben aprobarse antes de F4.0.

## 7. Vue, SSR y contratos reutilizables

- `app/components/base/*`: presentación genérica; props y emits tipados, slots justificados, accesibilidad y estados visuales; no conoce endpoints, entidades, permisos ni router.
- `app/components/<dominio>/*`: formularios/tablas/selectores compuestos, sin duplicar reglas ni contener acceso HTTP privado. Props/eventos exponen su contrato.
- `app/composables/*`: lógica reactiva de dominio/presentación y estados `loading/error/empty/success`; API por cliente centralizado bajo `app/lib/api/`.
- `app/pages/*` y `app/layouts/*`: ensamblan componentes y conectan navegación/datos; no implementan formularios, tablas, reglas o peticiones duplicadas.
- Estado local por defecto. Estado de solicitud SSR mediante APIs Nuxt con clave y alcance deliberados; nunca un singleton mutable de sesión compartido entre solicitudes.
- Nuxt autoimporta componentes/composables si está habilitado; este workspace desactiva autoimports y escaneo automático de componentes para que imports y fronteras se hagan explícitos y puedan verificarse. Mantener imports explícitos salvo decisión documentada que actualice los verificadores.
- Contratos de componente: propósito, props, emits, slots, estados, accesibilidad y consumidor/composición previstos. Contratos de composable: entradas, datos reactivos, estados y errores.

## 8. Persistencia y transacciones

- PostgreSQL y TypeORM; migraciones explícitas y `synchronize=false`. DTO, dominio y entidades separados.
- DataSource reutilizable CLI/runtime mediante composición; no abrir conexiones duplicadas ni importar TypeORM en el cliente.
- `UnitOfWork`/contexto abre una transacción y proporciona el manager a cada repositorio participante. Todo cambio relacionado, incluidas relaciones y audit trail, usa el mismo manager.
- El último administrador activo y las escrituras RBAC concurrentes requieren transacción/lock e invariantes probadas en subfases funcionales.
- Tests de integración apuntan a base de prueba dedicada, con guardas de entorno; no usar SQLite ni mocks para simular PostgreSQL.
- Las entidades TypeORM son privadas de su módulo; `server/composition/persistence.ts` es el único registro y enlaza users, roles, permissions, auth (sesiones y rate limit) y audit. Las dos relaciones muchos-a-muchos aportan las tablas `user_roles` y `role_permissions`.
- La raíz de composición mantiene un DataSource por proceso y rechaza cambiar de destino una vez elegido. El pool tiene un máximo configurado; Nitro registra el cierre del DataSource, que se inicializa al usar persistencia y se reutiliza por solicitud.
- Los repositorios reciben un `Tx` opaco. La infraestructura asocia el token al `EntityManager` de la transacción y lo invalida al terminar el callback; no se permite consultar el manager global para operaciones de repositorio.
- `UserRecord` nunca contiene `passwordHash`; la entidad lo excluye de las consultas predeterminadas. El hash de sesión también se excluye por defecto y permanece en el adaptador de auth.
- Registrar metadata no crea tablas: `synchronize` y `migrationsRun` permanecen desactivados. La creación y reversión del esquema se entrega en F2.2.

## 9. Pruebas y verificaciones F0.2

- Validar que el grafo modular sea acíclico y que la dirección de cada puerto sea válida.
- Comparar las 21 operaciones del API mínimo con el catálogo, confirmar la única ruta auxiliar permitida y validar unicidad método/patrón/política.
- Revisar contratos de componente y caso de uso, descubrimiento y wrapper de rutas, límites de módulo, transacciones y SSR.
- No afirmar tests de runtime/build: F0.2 es diseño, no implementación. Verificarlo por inspección y checks documentales; las pruebas funcionales pertenecen a sus subfases.

## 10. Compatibilidad consultada

En F0.2 se conservan las versiones y el perfil Node validados en F0.1; no se actualizan dependencias.

- Node del workspace: `v22.23.4`; npm `10.9.9`; Git `2.49.0` (verificaciones de F0.1, reconciliar si el comando actual difiere).
- Node requerido por `package.json`: `^22.19.0 || ^24.11.0 || >=26.0.0`.
- Metadatos de registro npm consultados para los pines actuales: Nuxt `4.5.2` acepta `^22.19.0 || ^24.11.0 || >=26.0.0`; Vue `3.5.44` acepta `^20.19.0 || ^22.13.0 || >=24.11.0`; TypeORM `1.1.2` y `pg@8.23.1` aceptan Node `>=16.0.0`.
- Referencias oficiales:
  - Nuxt server routes y separación app/server: <https://nuxt.com/docs/4.x/directory-structure/server>
  - Autoimports en Nuxt: <https://nuxt.com/docs/4.x/guide/concepts/auto-imports>
  - Composables Nuxt: <https://nuxt.com/docs/4.x/directory-structure/app/composables>
  - Transacciones TypeORM: <https://typeorm.io/docs/transactions>
  - Transacciones PostgreSQL: <https://www.postgresql.org/docs/current/tutorial-transactions.html>
  - Estado reactivo Vue: <https://vuejs.org/guide/scaling-up/state-management.html>
