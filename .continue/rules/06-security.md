---
name: Security
description: Reglas de seguridad para frontend y backend.
alwaysApply: false
---

# Seguridad
- Nunca expongas secretos, API keys, tokens privados o credenciales en frontend.
- Valida y sanea entradas en el servidor.
- Aplica autorización por recurso, no solamente autenticación.
- Considera CSRF cuando exista autenticación basada en cookies.
- Considera XSS, SQL/ORM injection, SSRF, path traversal y fuga de información según el caso.
- No registres contraseñas, tokens completos ni datos sensibles.
- Usa expiración y rotación cuando el diseño lo requiera.
- Los mensajes al cliente deben evitar revelar detalles internos.
- Revisa dependencias y configuración antes de introducir una solución de seguridad.
- Para cambios de autenticación/autorización, incluye pruebas positivas y negativas.
