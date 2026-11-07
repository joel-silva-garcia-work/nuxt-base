# Continue AI Kit

Kit de reglas, prompts y skills para usar con Continue en VS Code.

## Instalación

Copia `.continue/` y `skills/` a la raíz del proyecto.

Las reglas y prompts son consumidos por Continue. Las carpetas `skills/` son una biblioteca organizada de conocimiento reutilizable; si tu versión de Continue/VS Code dispone de un mecanismo de Agent Skills compatible, puedes apuntarlo a estas carpetas.

## Prompts

- `/analyze-requirement`
- `/implement-hu`
- `/review-code`
- `/create-tests`
- `/create-qa-cases`
- `/security-review`
- `/refactor`

## Recomendación

No cargues todas las skills completas en cada petición. Mantén reglas generales cortas y utiliza prompts/skills especializados según la tarea.


## Nueva skill: Nuxt + Vue Frontend

Se agregó:
- `.continue/rules/09-frontend-nuxt-vue.md` — reglas frontend aplicables al workspace.
- `skills/nuxt-vue-frontend/SKILL.md` — conocimiento especializado Nuxt/Vue.

Las reglas de `.continue/rules/` son la capa que Continue puede aplicar directamente. La carpeta `skills/` funciona como biblioteca especializada y debe ser cargada por el mecanismo de skills/agente que utilices cuando corresponda.
