---
name: QA Testing
description: Reglas para pruebas unitarias, integración y e2e.
alwaysApply: false
---

# QA
- Convierte cada requisito verificable en al menos un escenario de prueba.
- Incluye casos positivos, negativos, límites y restricciones.
- Usa textos visibles reales del requisito/UI cuando estén disponibles.
- No inventes elementos de UI ausentes.
- Verifica estados loading, error, empty y success cuando correspondan.
- Para APIs verifica status, body, validaciones, autorización y persistencia.
- Para e2e verifica el flujo completo y sus precondiciones.
- Evita pruebas frágiles basadas en detalles visuales innecesarios.
- Los tests deben describir comportamiento observable.
- Si un requisito no puede verificarse con la información disponible, márcalo como desconocido.
