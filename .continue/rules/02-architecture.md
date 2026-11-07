---
name: Project Architecture
description: Arquitectura y convenciones generales del proyecto.
alwaysApply: true
---

# Arquitectura
- Respeta la estructura actual del proyecto antes de crear carpetas nuevas.
- No introduzcas una librería para resolver algo que ya existe en el proyecto.
- Mantén responsabilidades pequeñas y explícitas.
- Evita lógica de negocio duplicada.
- No acoples frontend directamente a detalles de persistencia.
- Los cambios de contrato entre frontend y backend deben identificarse explícitamente.
- Los nombres deben seguir las convenciones existentes.
- Los cambios estructurales deben incluir impacto, migración y pruebas cuando corresponda.
- Si hay conflicto entre esta regla y código existente, explica el conflicto antes de hacer una refactorización amplia.
