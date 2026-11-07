---
name: Safe Refactor
description: Refactoriza sin alterar comportamiento.
invokable: true
---

Antes de refactorizar:
1. Explica el comportamiento actual.
2. Identifica dependencias.
3. Identifica tests existentes.

Después:
1. Realiza el cambio mínimo.
2. Mantén contratos públicos.
3. Ejecuta tests disponibles.
4. Comprueba TypeScript/lint.
5. Resume riesgos y diferencias.

No combines la refactorización con funcionalidades nuevas salvo que sea imprescindible.
