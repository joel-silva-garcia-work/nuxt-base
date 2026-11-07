---
name: Change Control
description: Control de alcance para evitar cambios innecesarios.
alwaysApply: true
---

# Control de cambios
Antes de editar:
1. Identifica el objetivo.
2. Identifica archivos directamente afectados.
3. Busca dependencias y usos existentes.
4. Comprueba si ya existe una implementación reutilizable.

Durante la edición:
- Cambia solamente lo necesario.
- Mantén compatibilidad salvo que el requisito indique lo contrario.
- No refactorices código no relacionado.

Después:
- Revisa diff.
- Comprueba errores de TypeScript/lint/test disponibles.
- Resume qué cambió y qué quedó pendiente.
