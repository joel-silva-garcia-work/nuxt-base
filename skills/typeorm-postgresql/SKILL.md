---
name: typeorm-postgresql
description: Persistencia con TypeORM y PostgreSQL.
---

# TypeORM/PostgreSQL Skill

## Antes de modificar
- Revisar entidades y relaciones.
- Revisar migrations.
- Revisar servicios/repositorios.
- Revisar configuración de conexión.
- Revisar índices y constraints relacionados.

## Implementación
- Mantener DTO/entity separados.
- Usar repositories/services existentes.
- Usar transacciones para operaciones atómicas.
- Evitar N+1.
- Crear migration para cambios de esquema.
- Validar nullability y relaciones.

## Verificación
- Ejecutar tests.
- Verificar migration.
- Verificar persistencia y rollback cuando corresponda.
