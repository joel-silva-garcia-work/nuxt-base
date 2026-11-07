# Skill Integration

El workspace contiene una biblioteca `skills/` de conocimiento especializado.

Regla:
- Las reglas de `.continue/rules/` son las instrucciones operativas que Continue debe aplicar en el workspace.
- Las `SKILL.md` contienen conocimiento especializado de apoyo.
- Para frontend Nuxt/Vue, aplicar conjuntamente `09-frontend-nuxt-vue.md` y `skills/nuxt-vue-frontend/SKILL.md` cuando esta skill esté disponible en el contexto del agente.
- No asumir que una `SKILL.md` arbitraria se auto-descubre si el mecanismo de Continue usado en el proyecto no la carga explícitamente.
