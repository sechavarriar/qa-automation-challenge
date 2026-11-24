# Diseño de casos: users

Contrato consultado: https://fakestoreapi.com/docs-data y README oficial (2026-11-24)

**Campos:** `id` entero, `email`, `username`, `password`, `phone` texto, `name {firstname, lastname}`, `address {city, street, number, zipcode, geolocation {lat, long}}`.

| ID | Operación | Técnica | Datos | Status esperado | Validaciones | Fuente | Cita | Tags | Estado |
|---|---|---|---|---|---|---|---|---|---|
| USR-01 | GET /users | Contrato | — | 200 | JSON, lista no vacía, cada elemento cumple `user` | ENUNCIADO | GET: "Es un array", al menos 1 elemento | @smoke @regression | aprobado |
| USR-02 | GET /users?limit=1 | Valor límite | limit=1 | 200 | `user`, 1 elemento | CONTRATO | README: /users?limit=5 | @regression | aprobado |
| USR-03 | GET /users?limit=5 | Equivalencia | limit=5 | 200 | `user`, 5 elementos | CONTRATO | README: /users?limit=5 | @regression | aprobado |
| USR-04 | GET /users?sort=asc | Equivalencia | sort=asc | 200 | `user`, ids ascendentes | CONTRATO | README: /users?sort=desc (asc\|desc) | @regression | aprobado |
| USR-05 | GET /users?sort=desc | Equivalencia | sort=desc | 200 | `user`, ids descendentes | CONTRATO | README: /users?sort=desc (asc\|desc) | @regression | aprobado |
| USR-06 | GET /users/{id} | Valor límite | id=1 | 200 | JSON, `user`, el id coincide, email con @ | ENUNCIADO | GET: el id coincide con el solicitado | @smoke @regression | aprobado |
| USR-07 | GET /users/{id} | Equivalencia | id=5 | 200 | JSON, `user`, el id coincide, email con @ | ENUNCIADO | GET: el id coincide con el solicitado | @smoke @regression | aprobado |
| USR-08 | GET /users/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| USR-09 | GET /users/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |
| USR-10 | POST /users | Equivalencia | usuario completo, email `{unico}` | 201 | JSON, `user`, id > 0, lo enviado coincide | ENUNCIADO | POST: 201, se genera id | @smoke @regression | aprobado |
| USR-11 | POST /users | Equivalencia inválida | `{}` | 400 | mensaje de error | ENUNCIADO | POST: body inválido; OpenAPI 400 | @negativo @regression | aprobado |
| USR-12 | POST /users | Equivalencia inválida | email numérico | 400 | mensaje de error | CONTRATO | OpenAPI: email string, 400 | @negativo @regression | aprobado |
| USR-13 | POST /users | Equivalencia inválida | email sin @ | 400 | mensaje de error | ENUNCIADO | Validaciones mínimas: "email contiene @" y POST: body inválido | @negativo @regression | aprobado |
| USR-14 | POST /users | Sintaxis | JSON mal formado | 400 | mensaje de error | ENUNCIADO | POST: body inválido | @negativo @regression | aprobado |
| USR-15 | PUT /users/{id} | Equivalencia | id=7, body completo | 200 | JSON, `user`, id coincide, lo enviado coincide | ENUNCIADO | PUT: el campo refleja el cambio; OpenAPI: devuelve User con id | @regression | aprobado |
| USR-16 | PATCH /users/{id} | Equivalencia | id=8, solo `email` | 200 | JSON, id coincide, lo enviado coincide | SUPUESTO | PATCH: el campo refleja el cambio | @regression | aprobado |
| USR-17 | PUT /users/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| USR-18 | PATCH /users/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| USR-19 | PUT /users/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |
| USR-20 | DELETE + GET /users/{id} | Transición de estados | id=6 | 200 y 200 | `user`, el id coincide en ambas | SUPUESTO | README: nada se borra; reglas §7 | @regression | aprobado |
| USR-21 | DELETE /users/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| USR-22 | DELETE /users/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |

## Contradicciones y dudas

1. **Campos:** el OpenAPI declara 4 (`id`, `username`, `email`, `password`); el README, además, `name`, `address` y `phone`. El contrato `user` exige los del README, que es el más completo y no contradice al OpenAPI.
2. **PATCH y el id:** el OpenAPI no documenta PATCH. El README muestra el `id` en la respuesta de PATCH de products; aquí se aplica por analogía.
3. **Respuesta de DELETE:** ninguna fuente fija su body. El README de products no lo muestra; se exige el recurso eliminado por "Response coherente" del enunciado.

## Supuestos aprobados (2026-11-24)

- USR-16: PATCH devuelve el `id`, por analogía con products.
- USR-20: DELETE devuelve el recurso eliminado, por "Response coherente" del enunciado.

## Casos descartados y motivo

- **Id 0 y negativos:** misma partición que 9999. El id 0 ya se cubre en products.
- **Email duplicado:** FakeStoreAPI no promete unicidad. Se prueba en GoRest.
- **Contraseña en la respuesta de GET /users:** es un riesgo de seguridad, pero el contrato la incluye. Se anota en el README, sin test.
- **Crear y consultar el id generado:** el README dice que no se guarda. La reutilización del id se prueba en GoRest.
