# Diseño de casos: auth

Contrato consultado: https://fakestoreapi.com/docs-data y README oficial (2026-11-24)

**Campos:** entrada `username` y `password` texto; salida `token` texto.

| ID | Operación | Técnica | Datos | Status esperado | Validaciones | Fuente | Cita | Tags | Estado |
|---|---|---|---|---|---|---|---|---|---|
| AUT-01 | POST /auth/login | Equivalencia | usuario demo 1 | 200 | JSON, `login`: token no vacío | CONTRATO | OpenAPI: POST /auth/login 200; reglas §7 | @smoke @regression | aprobado |
| AUT-02 | POST /auth/login | Equivalencia | usuario demo 2 | 200 | JSON, `login`: token no vacío | CONTRATO | OpenAPI: POST /auth/login 200; reglas §7 | @smoke @regression | aprobado |
| AUT-03 | POST /auth/login | Equivalencia inválida | contraseña incorrecta | 401 | mensaje de error | HTTP | RFC 9110 §15.5.2 | @negativo @smoke @regression | aprobado |
| AUT-04 | POST /auth/login | Equivalencia inválida | usuario inexistente | 401 | mensaje de error | HTTP | RFC 9110 §15.5.2 | @negativo @regression | aprobado |
| AUT-05 | POST /auth/login | Equivalencia inválida | `{}` | 400 | mensaje de error | CONTRATO | OpenAPI: 400 Bad request | @negativo @regression | aprobado |
| AUT-06 | POST /auth/login | Equivalencia inválida | sin password | 400 | mensaje de error | CONTRATO | OpenAPI: 400 Bad request | @negativo @regression | aprobado |
| AUT-07 | POST /auth/login | Equivalencia inválida | sin username | 400 | mensaje de error | CONTRATO | OpenAPI: 400 Bad request | @negativo @regression | aprobado |
| AUT-08 | POST /auth/login | Sintaxis | JSON mal formado | 400 | mensaje de error | CONTRATO | OpenAPI: 400 Bad request | @negativo @regression | aprobado |

## Contradicciones y dudas

1. **Credenciales incorrectas:** el OpenAPI solo declara 400 y no dice cuándo se usa. La matriz espera 401, que es lo que define HTTP para credenciales no válidas. **Decisión (2026-11-24):** 401.

## Supuestos

Ninguno. Las credenciales demo son públicas: salen de `GET /users` de la propia API.

## Casos descartados y motivo

- **Formato JWT del token:** ninguna fuente lo promete.
- **Usar el token en otro endpoint:** ningún endpoint documentado lo exige.
- **Mayúsculas en username:** ninguna fuente define si distingue.
