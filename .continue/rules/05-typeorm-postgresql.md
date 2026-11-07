---
name: TypeORM PostgreSQL
description: Reglas para TypeORM y PostgreSQL.
globs:
  - "server/**/*.entity.ts"
  - "server/**/*.repository.ts"
  - "server/**/*.service.ts"
  - "src/**/*.entity.ts"
  - "src/**/*.repository.ts"
  - "src/**/*.service.ts"
  - "migrations/**/*.ts"
  - "database/**/*.ts"
---

# TypeORM + PostgreSQL
- Usa TypeORM siguiendo la versión instalada en package.json.
- No cambies el esquema de producción manualmente si el proyecto utiliza migrations.
- Los cambios de entidades que alteren el esquema deben considerar migration.
- Revisa relaciones, nullability, índices, constraints y cascades.
- Evita N+1 queries.
- No cargues relaciones innecesarias.
- Usa transacciones cuando varias operaciones deban ser atómicas.
- No guardes secretos ni credenciales en entidades o código.
- Considera PostgreSQL como motor real de producción; no asumas que SQLite y PostgreSQL son equivalentes.
- Las migrations deben ser reversibles cuando sea razonable.
- Las operaciones destructivas deben identificarse explícitamente.
