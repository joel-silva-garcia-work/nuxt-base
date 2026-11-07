# PLAN — Nuxt RBAC: arquitectura reutilizable y modular

## Documentos y alcance
En raíz: PLAN.md (contrato), SUBFASES.md (entregables), PROMPT_CURSOR.md (ejecución), ESTADO.md (evidencias).
Construir Nuxt con Vue, TypeScript, backend integrado, TypeORM y PostgreSQL. Docker/Compose es obligatorio para la app, PostgreSQL, pruebas y servicios auxiliares en desarrollo, CI y entrega local; el despliegue de producción queda fuera de este alcance. Sin backend NestJS separado. Interfaz española y nombres de código ingleses.

## Trabajo incremental y contexto
Una subfase por interacción; detenerse después. Versiones estables compatibles tras inspección y documentación oficial. Un gestor y lockfile. No prometer cuota gratuita de Cursor: depende de modelo/plan.
Buscar antes de leer; no cargar node_modules/.nuxt/.output/dist/cobertura ni lockfiles completos. No reimprimir código/logs extensos, reinstalar innecesariamente ni refactorizar fuera del alcance.
Orientación 3–6 archivos de implementación más pruebas. Si excede contexto, dividir ANTES en .a/.b con contratos verificables, actualizar catálogo/estado y detenerse. Nunca exponer rutas como solución provisional.
Sin resultados simulados: falta de herramienta, permiso o prueba obligatoria = BLOQUEADA. Registrar decisiones en docs/DECISIONES.md y contrato en docs/API.md.

## Instalación y persistencia
Inspeccionar workspace, SO, Git, Node, gestor y PostgreSQL. No sobrescribir archivos, alterar servicios/privilegios o instalar globalmente sin autorización. No identidad Git ni credenciales ficticias.
PostgreSQL se ejecuta en contenedor para desarrollo, pruebas y entrega local; nunca SQLite sustituto. Crear bases/usuarios como acción administrativa explícita, no al iniciar Nuxt. Cuenta de ejecución no superusuario; separar migraciones si requieren otros privilegios.
Variables DB_HOST/PORT/NAME/USER/PASSWORD/SSL y TEST_DB_*; validar configuración; TLS remoto verificado. .env ignorado y .env.example sin secretos. No conexiones secretas en logs.
TypeORM synchronize=false, migraciones, DataSource reutilizable CLI/runtime sin conexiones duplicadas ni imports al bundle cliente. Transacciones reales.

## Modelo y reglas funcionales
User: UUID, email normalizado único, name, passwordHash privado, isActive, timestamps, deletedAt para borrado lógico.
Role: UUID, name único, description, isSystem interno, timestamps.
Permission: UUID, key estable única, method, routePattern, description, module, accessPolicy PUBLIC/AUTHENTICATED/RBAC, isActive, timestamps; único method+routePattern.
Relaciones User–Role y Role–Permission muchos-a-muchos con FK, índices y pares únicos. Sesiones revocables y auditoría adicional.
- Usuario con cero o varios roles; unión de permisos activos; sin permisos directos, jerarquías ni denegaciones explícitas.
- Crear rol SOLO name/description, sin permisos. Asignación posterior independiente.
- Crear usuario admite roleIds existentes; validar conjunto y transacción atómica.
- PUT relaciones reemplaza, [] vacía salvo invariante admin. ID inválido no aplica cambios parciales.
- Borrar rol limpia relaciones, no usuarios/permisos; confirmar si está asignado. Borrado lógico usuario revoca sesiones.
- Rechazar passwordHash/isSystem y campos internos en payloads genéricos.

## Catálogo y seguridad
Todos los endpoints de aplicación registrados: clave estable, método, patrón, descripción, módulo y política. Un permiso por método/patrón, no por ID concreto.
PUBLIC explícito; AUTHENTICATED para sesión propia; RBAC exige permiso por rol. Solo RBAC activos asignables. Excluir estáticos/internos framework con frontera documentada.
Wrapper común con denegación por defecto, HEAD/OPTIONS explícitos. Verificador bidireccional rutas/catálogo/wrapper detecta faltantes, duplicados, registros sin ruta y políticas ausentes. No matching inseguro por prefijo.
Sync idempotente crea/actualiza/desactiva preservando claves/asociaciones; retirados no autorizan. Sin CRUD arbitrario de permisos inexistentes.
Sesiones revocables en cookies HttpOnly/Secure producción/SameSite definido; no tokens localStorage. Persistir sesiones y los contadores de rate limit requeridos por este contrato en PostgreSQL compartido; no usar Redis ni añadir caché general. CSRF en mutaciones con estrategia de login/logout; hash adecuado, rate limit, mensajes no enumerables, validación por allowlist, consultas parametrizadas y errores sin stack traces.
Cambios RBAC efectivos siguiente petición; desactivar/eliminar revoca. Bootstrap CLI sin endpoint público/credenciales predeterminadas, repetición no cambia contraseña.
Rol admin reservado por identidad interna, recibe nuevos permisos RBAC. No eliminar/desactivar/quitar rol al último admin activo, incluso concurrentemente; transacción/bloqueo y prueba obligatorios.
Audit trail de cada acción HTTP POST/PUT/PATCH/DELETE exitosa que modifique estado, incluidas las acciones de sesión pertinentes; las solicitudes rechazadas o fallidas se registran aparte como eventos de seguridad, no como cambios de datos. No crear traza de cambio cuando la operación exitosa no modifica ningún dato.
Cada audit trail persiste ID y fecha UTC generada por PostgreSQL, actor, IP, URL saneada (ruta sin query ni fragmento), método HTTP, código de respuesta, request/correlation ID, acción y entidad/ID de entidad. `previous_state` y `current_state` son columnas JSONB independientes y contienen solo columnas modificadas con sus valores anterior/nuevo. Diferencia plana por columna; `null` es un valor explícito, campo omitido significa sin cambio y arrays se comparan como un valor completo. Para POST el previo es `{}`; para DELETE el actual es `{}`. El servicio común recibe ambos objetos serializados y calcula la diferencia. Excluir credenciales, hashes, tokens, cookies y secretos. Archivar tras el periodo de retención activa aprobado y eliminar al vencer el periodo de retención del archivo; el destino y ambos plazos se deben fijar antes de implementar F4.0. Mutación y audit trail comparten transacción PostgreSQL. Ante fallos transitorios de escritura recuperables mediante savepoint, hasta tres reintentos adicionales dentro de la transacción; si no se persiste, hacer rollback de la operación. Fallos permanentes, transaccionales o de conexión revierten sin reintento. No exponer ni guardar secretos en logs.

## API mínima
Cada método de filas agrupadas tiene clave propia; registrar auxiliares CSRF necesarios.
| Métodos | Ruta | Política |
|---|---|---|
| POST | /api/auth/login | PUBLIC |
| POST | /api/auth/logout | AUTHENTICATED |
| GET | /api/auth/me | AUTHENTICATED |
| POST | /api/auth/change-password | AUTHENTICATED |
| GET, POST | /api/users | RBAC |
| GET, PATCH, DELETE | /api/users/:id | RBAC |
| GET, PUT | /api/users/:id/roles | RBAC |
| GET, POST | /api/roles | RBAC |
| GET, PATCH, DELETE | /api/roles/:id | RBAC |
| GET, PUT | /api/roles/:id/permissions | RBAC |
| GET | /api/permissions | RBAC |
| GET | /api/permissions/:id | RBAC |
| POST | /api/permissions/sync | RBAC |
Listados paginados/buscados/filtrados en servidor, ordenación permitida y límites máximos. DTO tipados, errores uniformes de validación/401/403/404/conflicto. Contraseña propia separada de CRUD. Sin registro público/reset administrativo en alcance.

## Arquitectura obligatoria: Vue reutilizable y backend modular

### Frontend: toda implementación Vue es un componente reutilizable
- Toda pieza de interfaz se implementa en componentes Vue SFC reutilizables, con Composition API, script setup y TypeScript estricto.
- Las páginas y layouts son componentes de composición delgados: ensamblan componentes y conectan navegación/datos. No duplican controles, formularios, tablas, reglas de negocio ni peticiones HTTP.
- Un componente puede ser específico de dominio y seguir siendo reutilizable: no exigir dos consumidores actuales ni convertir todo en una abstracción universal.
- Evitar componentes monolíticos y fragmentación artificial de cada etiqueta HTML. Cada componente tiene una responsabilidad cohesionada.
- Capas: base/presentación, componentes de dominio, composables de aplicación, cliente API tipado y páginas/layouts de composición.
- Base: no conoce endpoints, entidades backend, router ni sesión global; recibe props tipadas y emite eventos tipados. Slots para personalización justificada.
- Dominio: compone controles base; recibe datos/acciones mediante contratos explícitos. La obtención de datos se concentra en composables de dominio y el cliente API, no en controles visuales.
- Lógica reactiva reutilizable en composables; validaciones puras en esquemas/utilidades compartidas. Evitar una segunda implementación de la misma regla.
- Estado local por defecto. Estado compartido solo cuando hay consumidores y alcance definidos. No singletons de sesión que filtren usuarios entre solicitudes SSR.
- No URLs, roles o permisos hardcodeados dentro de componentes base. PermissionGuard y usePermissions concentran el control visual.
- Cada componente nuevo documenta props, eventos, slots, estado y responsabilidad mediante contratos tipados y comentarios útiles, sin documentación redundante.
- Pruebas de componentes verifican contrato, interacción, accesibilidad y estados relevantes. Tests de composables para lógica compartida.
- Pruebas y revisión deben demostrar que páginas usan componentes/composables y que no existe implementación paralela del mismo patrón.

### Backend: modular, escalable y reutilizable
- Modular monolith en el servidor Nuxt: módulos auth, users, roles, permissions y audit. No microservicios, contenedor DI complejo o event bus sin necesidad demostrada.
- Cada módulo declara API pública interna explícita. No acceder a repositorios, entidades internas ni implementación privada de otro módulo.
- Rutas Nuxt son adaptadores delgados: extraen contexto, validan entrada, llaman un caso de uso y serializan. No consultas TypeORM ni reglas de negocio en handlers.
- Separar adaptadores HTTP, aplicación/casos de uso, reglas de dominio y persistencia cuando aporte valor. No crear capas vacías para aparentar arquitectura.
- Casos de uso independientes de objetos HTTP de Nuxt; reciben DTO y contexto explícito, devuelven resultados tipados y errores de aplicación.
- Persistencia TypeORM encapsulada tras repositorios/puertos definidos por necesidad real; no repositorio genérico gigante ni servicios god-object.
- Composition root/fábricas en servidor ensamblan dependencias explícitas. Separar construcción de ejecución facilita pruebas.
- Dependencias entre módulos dirigidas, documentadas y sin ciclos. Los esquemas/contratos compartidos no importan runtime de servidor ni TypeORM al cliente.
- Shared/kernel contiene solo primitivas transversales: errores, paginación, validación, contratos de identidad/transacción y utilidades justificadas. No un cajón de negocio compartido.
- Autenticación, autorización, auditoría y errores mediante servicios/adaptadores comunes; no copiar comprobaciones en cada endpoint.
- Operaciones multi-repositorio usan la misma transacción/EntityManager mediante contexto explícito; no repositorios globales que salgan de la transacción.
- Diseñar llamadas entre módulos con interfaces de aplicación; centralizar invariante del último admin y política de roles reservados.
- Escalabilidad: paginación acotada, consultas/selects apropiados, evitar N+1, índices justificados, límites de conexiones y ausencia de sesiones/rate limit exclusivamente en memoria local. Usar PostgreSQL compartido u otro almacén aprobado cuando corresponda.
- No afirmar escalabilidad ilimitada: registrar decisiones y límites. No introducir caché que conserve permisos revocados.
- Configuración validada, logs estructurados sin secretos y errores uniformes. No almacenar contexto de usuario en estado global mutable.
- Cada módulo incorpora pruebas unitarias de casos de uso, integración PostgreSQL de persistencia y pruebas HTTP de seguridad/contrato.

### Puerta arquitectónica de cada subfase
Para cada cambio frontend/backend, registrar CUMPLE/NO CUMPLE/NO APLICA con justificación:
1. Componentes cohesionados, contratos tipados y páginas delgadas.
2. Composables/cliente centralizados; sin lógica o UI duplicadas.
3. Casos de uso modulares y handlers sin lógica de negocio/SQL.
4. Dependencias explícitas sin ciclos ni acceso a privados de otros módulos.
5. Transacciones compartidas correctamente y DTO sin entidades/secretos.
6. Pruebas del componente, caso de uso, persistencia o endpoint afectado.
7. Accesos a datos acotados y estado compatible con SSR/múltiples procesos.
Implementar comprobaciones estáticas de fronteras con tooling compatible cuando sea viable y revisión dirigida para lo no automatizable. No declarar una comprobación automatizada si solo se revisó manualmente.
Una unidad no queda VERIFICADA con incumplimientos relevantes de arquitectura. No continuar hasta corregirlos o aprobar explícitamente un cambio de alcance.

## Componentes y pantallas exigidos
Base: Button/Input/Textarea/Select/Checkbox/FormField/Modal/ConfirmDialog/DataTable/Pagination/SearchInput/PageHeader/notificaciones/estados Loading-Empty-Error.
Dominio: UserForm/UserTable/RoleMultiSelect/RoleForm/RoleTable/PermissionSelector/PermissionTable/PermissionGuard/AppSidebar/AppHeader.
Composables auth/permisos/usuarios/roles/catálogo/paginación/errores/notificaciones.
Pantallas login/dashboard, usuarios lista/crear/editar/detalle, roles lista/crear/editar/asignar permisos, catálogo, perfil/contraseña, 403 y 404.
Permisos agrupados por módulo y búsqueda método/ruta/clave/descripción; políticas no asignables informativas. Selector roles permite conjunto vacío. Responsive, teclado/labels/foco, loading/error/vacío, errores por campo, doble envío impedido, confirmación y cambios sin guardar. Sin parpadeo de contenido protegido; backend siempre autoriza.

## Pruebas y entrega
Unitarias, componentes, integración PostgreSQL real en contenedor y E2E en contenedores. Base pruebas separada, guardas antes de limpieza; NODE_ENV=test no basta. Nunca limpiar desarrollo/producción ni usar mocks para fingir integración.
Cada rama de cambio debe pasar un pipeline obligatorio en CI y cada PR debe bloquearse si fallan los checks requeridos. Como mínimo: lint, typecheck, build, pruebas unitarias, integración con PostgreSQL y E2E afectados; validar Dockerfile/Compose cuando cambien. Cada unidad: entregables, checks específicos, typecheck/tests afectados, puerta arquitectónica y evidencias. Cierre fase: lint/typecheck/build y regresión exigible antes y después de integrar.
La evidencia de cierre incluye diff revisado, migraciones y compatibilidad Docker, comandos ejecutados, resultados y enlace al PR/merge.
Scripts funcionales al implementarse: dev/build/preview/lint/typecheck/db:check/db:migrate/db:migrate:revert/db:seed/admin:create/test:unit/test:integration/test:e2e y verificador catálogo/fronteras. No scripts ficticios.
README de Docker Compose, PostgreSQL/bases/privilegios, variables, migraciones/bootstrap, ejecución/build/pruebas y extensión de módulos/componentes/endpoints. Reproducir instalación local limpia en contenedores sin destruir workspace.

## Flujo Git desde F0.2
Inspeccionar raíz/identidad/historial/ramas/cambios/merge pendiente. Si raíz externa o base ambigua, pedir decisión. Inicializar si falta; .gitignore antes de commit. No identidad global ficticia ni credenciales versionadas. F0.2 inicializa el repositorio y `dev`; `dev` es estable/protegida y no recibe commits directos.
Crear una rama `change/<subfase>-<slug>` por cada tarea independiente, no una rama compartida por fase ni por subfase. Una tarea dependiente parte de la rama del prerrequisito aún no integrado; inspeccionar y reanudar ramas existentes solo si corresponden. No hacer pull automático.
Mensajes de commit con formato Conventional Commits y la subfase como scope después del tipo, por ejemplo `feat(F4.3/users): crear usuarios con roles`. Describir la acción; evitar mensajes genéricos. Tras verificar la tarea, actualizar estado, revisar diff, hacer stage explícito y crear el commit en su rama; no incluir trabajo ajeno ni secretos.
Cada cambio se integra mediante PR obligatorio hacia `dev`, con pipeline obligatorio y checks requeridos aprobados. Resolver conflictos preservando requisitos/seguridad; no usar ours/theirs masivo ni borrar tests. La estrategia de integración es merge commit (`--no-ff`), sin squash ni rebase.
Integrar tareas verificadas en orden de dependencias y repetir checks en `dev`. Si falla, marcar BLOQUEADA y crear rama propia `change/<subfase>-integration-fix`; verificar y enviar mediante PR, sin nuevas funciones. Registrar merge/fixes/resultados con commit descriptivo en una rama propia y PR; comprobar checks, historia integrada y árbol limpio. Solo entonces cerrar la fase y detenerse.
Publicar ramas y abrir PR requiere un remoto autorizado. No hacer force/reset --hard/clean destructivo, reescribir historia, borrar ramas, usar stash ajeno ni abortar un merge preexistente. Conservar ramas.
Adopción en proyecto empezado: no simular ramas históricas ni reescribir commits; inspeccionar y acordar base de adopción.

## Estados
Subfase: PENDIENTE/EN_CURSO/BLOQUEADA/VERIFICADA.
Fase: PENDIENTE/EN_CURSO/LISTA_PARA_MERGE/INTEGRANDO/BLOQUEADA/CERRADA.
La siguiente fase depende del cierre integrado anterior, no solo de código terminado.
