# PROMPT_CURSOR — Ejecución incremental

## Preparación
Colocar PLAN.md, SUBFASES.md, ESTADO.md y este archivo en raíz. Una conversación por subfase; referenciar archivos, no pegar todo el historial. División orientada a reducir consumo, sin garantía de cuota gratuita.
Si existe un ESTADO anterior, reconciliar y conservar evidencias; la plantilla no sustituye una auditoría. No rehacer commits/fases aprobadas automáticamente: revisar cambios de requisitos y planificar correcciones explícitas antes de continuar.
Antes de ejecutar cualquier ID, busca su fila en “Skills y prompts indispensables por subfase” de SUBFASES.md y lee completos todos los archivos allí listados. Aplica sus procedimientos dentro del alcance del ID; no supongas que skills o prompts se cargaron automáticamente. Si falta un recurso obligatorio, detente y marca BLOQUEADA indicando cuál.

## Inicio — F0.1
```text
Lee PLAN.md, reglas comunes de SUBFASES.md, contrato F0.1 y resumen ESTADO.md. Ejecuta SOLO F0.1 desde este workspace.
Lee y aplica todas las skills y prompts adicionales requeridos para F0.1 según la matriz de SUBFASES.md. Si alguno falta, detente BLOQUEADA.
Inspecciona sin sobrescribir trabajo ajeno. Máximo 8 líneas iniciales con objetivo/entregas/pruebas. Usa herramientas reales y documentación oficial para compatibilidad pendiente.
Respeta arquitectura: todo Vue reusable mediante componentes/composables/páginas delgadas; backend modular con casos de uso, contratos y persistencia encapsulada. Sin Docker.
No cargues generados/lockfiles completos/secretos ni imprimas archivos extensos. Registra resultados reales; si falta comprobación, BLOQUEADA.
Respuesta máxima 250 palabras: ID/estado, entregas, pruebas, próximo ID sugerido. DETENTE.
```

## Prompt principal — reemplazar F1.1 por ID
```text
Ejecuta SOLO F1.1. Fuentes: PLAN.md, reglas comunes y contrato exacto SUBFASES.md, resumen ESTADO.md. Si falta un documento, detente.
Lee PLAN si este chat aún no lo leyó; no todo el historial ni catálogo completo.
Busca la fila exacta del ID en la matriz “Skills y prompts indispensables por subfase” de SUBFASES.md; lee completos y aplica los archivos requeridos antes de planificar o modificar. Incluye skills compartidas y prompts adicionales. No asumas carga automática. Si falta un archivo requerido, BLOQUEADA.
1. Verifica dependencias y cierre integrado de fase previa.
2. Inspecciona Git: raíz/rama/cambios/merge. F1.1 crea/valida repo/dev/rama; primera unidad posterior abre rama desde dev limpio; demás usan misma rama. Trabajo ajeno o base ambigua: bloquear, no stash/reset automático.
3. Expón objetivo, archivos, entregas y pruebas en 8 líneas.
4. Implementa únicamente el contrato. TODO Vue: componentes SFC cohesivos reutilizables, props/eventos tipados, lógica en composables/cliente, páginas/layouts delgados. No duplicar controles/tabla/formulario ni meter fetch en componentes base.
5. TODO backend: módulos por dominio con API interna explícita, dependencias sin ciclos; handlers delgados, casos de uso sin HTTP y repositorios TypeORM encapsulados. Construcción mediante composition root, transacciones compartidas y sin importar privados de otros módulos. No capas vacías ni god-services.
6. Busca antes de abrir; orientación 3–6 archivos más pruebas. Si grande, dividir ANTES en .a/.b con contratos/estado y detenerse. No refactorizar fuera del objetivo ni reinstalar sin necesidad.
7. Registra endpoints con wrapper/política/catálogo y cobertura. Nunca desactives seguridad.
8. Ejecuta verificaciones específicas/typecheck/tests. Aplica puerta arquitectónica PLAN.md criterio por criterio con evidencia o NO APLICA justificado. Comprueba reutilización, ausencia de ciclos, handlers/páginas delgados, DTO seguros, transacciones, consultas acotadas y aislamiento SSR. No afirmar automatización si la revisión fue manual.
9. Si falla, corregir esta unidad o BLOQUEAR. Actualiza ESTADO con comandos/resultados y evidencias arquitectónicas; revisa diff/stage y commit al verificar. Sin secretos/trabajo ajeno.
10. No merge en implementación. Si es unidad de integración, seguir PLAN: checks previos y PR preferido; si no se puede crear/confirmar por falta de herramienta o autenticación, exigir autorización explícita y registrar el impedimento antes de merge --no-ff a dev. Resolver conflictos preservando modularidad/reutilización, ejecutar checks EN dev, registrar fixes, autorización y evidencia, y comprobar ancestría/árbol limpio. Nunca eludir protección de rama; no cerrar si falla o se bloquea.
Sin autorización no publicar, borrar ramas, reescribir/destruir historial, guardar trabajo ajeno ni abortar merge preexistente. Dev compartida requiere política acordada.
Máximo 250 palabras finales: ID/estado/rama, entregas, pruebas y revisión arquitectónica, commit, próximo ID o bloqueo. DETENTE, no otra unidad.
```

## Integración independiente — reemplazar F1.3
```text
Ejecuta SOLO F1.3 con PLAN/SUBFASES/ESTADO. Comprueba todas las unidades verificadas y Git limpio. No nuevas funciones.
Lee y aplica todas las skills y prompts adicionales de F1.3 indicados en la matriz de SUBFASES.md; no supongas carga automática. Si alguno falta, BLOQUEADA.
Ejecuta checks previos y puerta arquitectónica. Abre PR y confirma sus checks cuando sea posible; si no se puede crear/confirmar por falta de herramienta o autenticación, exige autorización explícita del usuario y registra el impedimento antes de integrar con merge --no-ff en dev. Resuelve conflictos preservando componentes/contratos/fronteras/seguridad y ejecuta checks posteriores EN dev. Nunca eludas protección de rama.
Si falla: BLOQUEADA; solo arreglos de integración con commits explícitos; repetir. Si requiere decisión, detenerse.
Registrar hashes merge/fixes y evidencias en commit documental posterior; verificar ancestría/árbol limpio. Solo entonces CERRADA. No push/borrar rama. Máximo 250 palabras y detenerse.
```

## Auditoría independiente — reemplazar F4.2
```text
Audita SOLO F4.2 según PLAN y contrato SUBFASES; comprueba ESTADO contra código/ejecución real. No cambiar funcionalidades ni avanzar.
Lee y aplica todas las skills y prompts adicionales de F4.2 indicados en la matriz de SUBFASES.md; no supongas carga automática. Si alguno falta, BLOQUEADA.
Revisa entregables y puerta arquitectónica: Vue reusable/composición, composables, backend por módulos/casos de uso/repositorios, dependencias sin ciclos, transacciones, DTO, límites/SSR y pruebas. Verifica mediante herramientas cuando posible y distingue revisión manual de automatizada.
Ejecuta checks en destino autorizado. Cada criterio CUMPLE/NO CUMPLE/NO APLICA justificado y evidencia en ESTADO. Fallo o falta de prueba = BLOQUEADA; indicar corrección mínima. Si cierre, comprobar merge/ancestría/checks EN dev.
Commit documental revisado si procede. Máximo 250 palabras y detenerse.
```

## Reanudar — sustituir [ID]
```text
Reanuda SOLO [ID] con PLAN, su contrato y bloqueo ESTADO. Comprueba entorno/Git y si bloqueo se resolvió. No repetir instalaciones/trabajo innecesarios ni abortar merge automáticamente.
Busca la fila de [ID] en la matriz de SUBFASES.md, lee y aplica todos sus archivos obligatorios, incluidos los que falten por resolver. No asumas que se cargaron en la conversación anterior. Si falta alguno, BLOQUEADA.
Corrige pendientes, cumple pruebas y puerta arquitectónica, registra evidencia y commit correspondiente. Si no puedes verificar, BLOQUEADA. No avanzar/publicar. Máximo 250 palabras.
```

## Interrupciones
Antes de detenerse por cuota/contexto, guardar estado real, archivos/rama/merge, pruebas pendientes y siguiente acción. No marcar completo. Reanudar mismo ID.
