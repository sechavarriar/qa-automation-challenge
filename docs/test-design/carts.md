# Diseño de casos: carts

Contrato consultado: https://fakestoreapi.com/docs-data y README oficial (2026-11-24)

**Campos:** `id` entero, `userId` entero, `date` fecha, `products` array de `{productId: número, quantity: número}`.

| ID | Operación | Técnica | Datos | Status esperado | Validaciones | Fuente | Cita | Tags | Estado |
|---|---|---|---|---|---|---|---|---|---|
| CRT-01 | GET /carts | Contrato | — | 200 | JSON, lista no vacía, cada elemento cumple `cart` | ENUNCIADO | GET: "Es un array", al menos 1 elemento | @smoke @regression | aprobado |
| CRT-02 | GET /carts?limit=1 | Valor límite | limit=1 | 200 | `cart`, 1 elemento | CONTRATO | README: /carts?limit=5 | @regression | aprobado |
| CRT-03 | GET /carts?limit=3 | Equivalencia | limit=3 | 200 | `cart`, 3 elementos | CONTRATO | README: /carts?limit=5 | @regression | aprobado |
| CRT-04 | GET /carts?sort=asc | Equivalencia | sort=asc | 200 | `cart`, ids ascendentes | CONTRATO | README: /carts?sort=desc (asc\|desc) | @regression | aprobado |
| CRT-05 | GET /carts?sort=desc | Equivalencia | sort=desc | 200 | `cart`, ids descendentes | CONTRATO | README: /carts?sort=desc (asc\|desc) | @regression | aprobado |
| CRT-06 | GET /carts por fechas | Equivalencia | 2020-01-01 a 2020-12-31 | 200 | lista no vacía, `cart`, cada `date` en el rango | CONTRATO | README: /carts?startdate&enddate | @regression | aprobado |
| CRT-07 | GET /carts/user/{id} | Equivalencia | usuario 1 | 200 | lista no vacía, `cart`, cada `userId` = 1 | CONTRATO | README: /carts/user/1 | @regression | aprobado |
| CRT-08 | GET /carts/{id} | Valor límite | id=1 | 200 | JSON, `cart`, el id coincide | ENUNCIADO | GET: el id coincide con el solicitado | @smoke @regression | aprobado |
| CRT-09 | GET /carts/{id} | Equivalencia | id=5 | 200 | JSON, `cart`, el id coincide | ENUNCIADO | GET: el id coincide con el solicitado | @smoke @regression | aprobado |
| CRT-10 | GET /carts/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| CRT-11 | GET /carts/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |
| CRT-12 | POST /carts | Equivalencia | userId, date y 1 producto | 201 | JSON, `cart`, id > 0, lo enviado coincide | ENUNCIADO | POST: 201, se genera id | @smoke @regression | aprobado |
| CRT-13 | POST /carts | Equivalencia | varios productos | 201 | JSON, `cart`, id > 0, lo enviado coincide | ENUNCIADO | POST: 201, se genera id | @smoke @regression | aprobado |
| CRT-14 | POST /carts | Equivalencia inválida | `{}` | 400 | mensaje de error | ENUNCIADO | POST: body inválido; OpenAPI 400 | @negativo @regression | aprobado |
| CRT-15 | POST /carts | Equivalencia inválida | userId de texto | 400 | mensaje de error | CONTRATO | OpenAPI: userId integer, 400 | @negativo @regression | aprobado |
| CRT-16 | POST /carts | Equivalencia inválida | products no es array | 400 | mensaje de error | CONTRATO | OpenAPI: products array, 400 | @negativo @regression | aprobado |
| CRT-17 | POST /carts | Sintaxis | JSON mal formado | 400 | mensaje de error | ENUNCIADO | POST: body inválido | @negativo @regression | aprobado |
| CRT-18 | PUT /carts/{id} | Equivalencia | id=3, body completo | 200 | JSON, `cart`, id coincide, lo enviado coincide | ENUNCIADO | PUT: el campo refleja el cambio | @regression | aprobado |
| CRT-19 | PATCH /carts/{id} | Equivalencia | id=4, solo `products` | 200 | JSON, id coincide, lo enviado coincide | ENUNCIADO | PATCH: el campo refleja el cambio | @regression | aprobado |
| CRT-20 | PUT /carts/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| CRT-21 | PATCH /carts/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| CRT-22 | PUT /carts/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |
| CRT-23 | DELETE + GET /carts/{id} | Transición de estados | id=2 | 200 y 200 | `cart`, el id coincide en ambas | CONTRATO | README: nada se borra; reglas §7 | @regression | aprobado |
| CRT-24 | DELETE /carts/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| CRT-25 | DELETE /carts/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |

## Contradicciones y dudas

1. **Elementos de `products`:** el OpenAPI dice que son `Product` (título, precio...); el README dice `{productId, quantity}`. **Decisión (2026-11-24):** se usa el README; un carrito necesita cantidades.
2. **PATCH:** no está en el OpenAPI, pero sí en el README y en el enunciado. Se incluye.
3. **`date`:** está en el README y no en el OpenAPI. Se exige en el contrato `cart`.

## Supuestos aprobados (2026-11-24)

- CRT-19: PATCH devuelve el `id`, por analogía con products.
- CRT-23: DELETE devuelve el recurso eliminado, por "Response coherente" del enunciado.

## Casos descartados y motivo

- **Id 0 y negativos:** misma partición que 9999. El id 0 ya se cubre en products.
- **`quantity` negativa o `productId` inexistente:** ninguna fuente define la respuesta.
- **Carritos de un usuario inexistente:** ninguna fuente aclara si es lista vacía o 404.
- **Crear y consultar el id generado:** el README dice que no se guarda. La reutilización del id se prueba en GoRest.
