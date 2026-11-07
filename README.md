# Nuxt Base

## Desarrollo con Docker Compose

Requiere Docker Desktop con Docker Compose. Copia la plantilla local y llena sus campos de contraseña con valores aleatorios locales; no compartas ni versionas `.env`:

```sh
cp .env.example .env
```

Inicia Nuxt y PostgreSQL en `http://localhost:3000`:

```sh
docker compose up --build
```

Antes de conectar Nuxt, aprovisiona explícitamente las bases y los usuarios de ejecución. El comando usa la cuenta superusuario administrativa del contenedor PostgreSQL y el script es idempotente para los recursos que ya tengan la propiedad esperada:

```sh
docker compose exec -T postgres sh -ec 'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -h 127.0.0.1 -U "$POSTGRES_USER" -d postgres -f /provision/provision.sql'
docker compose exec app npm run db:check
```

Las cuentas de desarrollo y pruebas son distintas y no son superusuarios. El script rechaza nombres inválidos, una cuenta administrativa insuficiente, bases de desarrollo/pruebas iguales, roles existentes con privilegios elevados y bases existentes con dueño distinto; no elimina datos ni cambia propietarios existentes.

El puerto PostgreSQL se publica solo en loopback (`127.0.0.1`) por defecto. Edita `APP_PORT` y `POSTGRES_HOST_PORT` en `.env` para cambiar los puertos. Cambiar `POSTGRES_HOST_BIND_ADDRESS` puede exponer PostgreSQL a otras interfaces: hazlo solo si necesitas acceso remoto y configúralo con controles de red adecuados. El acceso remoto también requiere `DB_SSL=require` y validación de certificados. Detén los servicios con `docker compose down`; para borrar los datos persistidos del contenedor se requiere además `--volumes`.

Los checks de calidad se pueden ejecutar en el servicio de desarrollo:

```sh
docker compose run --build --rm app npm run lint
docker compose run --build --rm app npm run typecheck
docker compose run --build --rm app npm run build
docker compose --profile testing run --build --rm tests
```

`tests` verifica las conexiones a ambas bases y ejecuta las suites unitarias y de integración. El `Dockerfile` también construye una imagen de producción por etapas.
