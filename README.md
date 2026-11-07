# Nuxt Base

## Desarrollo con Docker Compose

Requiere Docker Desktop con Docker Compose. Copia la plantilla local y luego inicia el servidor Nuxt de desarrollo en `http://localhost:3000`:

```sh
cp .env.example .env
docker compose up --build
```

Para cambiar el puerto publicado, edita `APP_PORT` en `.env`. No incluyas credenciales ni secretos en ese archivo. Detén el servicio con `docker compose down`.

Los checks de calidad se pueden ejecutar en el servicio de desarrollo:

```sh
docker compose run --build --rm app npm run lint
docker compose run --build --rm app npm run typecheck
docker compose run --build --rm app npm run build
```

El `Dockerfile` construye una imagen de produccion por etapas. PostgreSQL y sus pruebas se incorporaran en F1.2.
