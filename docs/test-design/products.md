# Diseño de casos: products

Contrato consultado: https://fakestoreapi.com/docs-data y README oficial (2026-11-24)

Products se implementó primero, sin la skill, como patrón de referencia. Esta matriz se escribió después, a partir de los tests; el usuario los aprobó el 2026-11-24.

**Campos:** `id` entero, `title` texto, `price` número, `description` texto, `category` texto, `image` texto.

| ID | Operación | Técnica | Datos | Status esperado | Validaciones | Fuente | Cita | Tags | Estado |
|---|---|---|---|---|---|---|---|---|---|
| PRD-01 | GET /products | Contrato | — | 200 | JSON, lista no vacía, cada elemento cumple `product` | ENUNCIADO | GET: "Es un array", al menos 1 elemento | @smoke @regression | aprobado |
| PRD-02 | GET /products?limit=1 | Valor límite | limit=1 | 200 | `product`, 1 elemento | CONTRATO | README: /products?limit=5 | @regression | aprobado |
| PRD-03 | GET /products?limit=5 | Equivalencia | limit=5 | 200 | `product`, 5 elementos | CONTRATO | README: /products?limit=5 | @regression | aprobado |
| PRD-04 | GET /products?sort=asc | Equivalencia | sort=asc | 200 | `product`, ids ascendentes | CONTRATO | README: /products?sort=desc (asc\|desc) | @regression | aprobado |
| PRD-05 | GET /products?sort=desc | Equivalencia | sort=desc | 200 | `product`, ids descendentes | CONTRATO | README: /products?sort=desc (asc\|desc) | @regression | aprobado |
| PRD-06 | GET /products/categories | Contrato | — | 200 | lista no vacía de textos | CONTRATO | README: get all categories | @regression | aprobado |
| PRD-07 | GET /products/category/{c} | Equivalencia | jewelery | 200 | `product`, cada `category` coincide | CONTRATO | README: /products/category/jewelery | @regression | aprobado |
| PRD-08 | GET /products/category/{c} | Equivalencia | electronics | 200 | `product`, cada `category` coincide | CONTRATO | README: /products/category/jewelery | @regression | aprobado |
| PRD-09 | GET /products/{id} | Valor límite | id=1 | 200 | JSON, `product`, el id coincide | ENUNCIADO | GET: el id coincide con el solicitado | @smoke @regression | aprobado |
| PRD-10 | GET /products/{id} | Valor límite | id=20 | 200 | JSON, `product`, el id coincide | ENUNCIADO | GET: el id coincide con el solicitado | @smoke @regression | aprobado |
| PRD-11 | GET /products/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| PRD-12 | GET /products/{id} | Valor límite | id=0 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| PRD-13 | GET /products/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |
| PRD-14 | POST /products | Equivalencia | producto completo | 201 | JSON, `product`, id > 0, lo enviado coincide | ENUNCIADO | POST: 201, se genera id | @smoke @regression | aprobado |
| PRD-15 | POST /products | Valor límite | price=0 | 201 | JSON, `product`, id > 0, lo enviado coincide | ENUNCIADO | POST: "Numéricos >= 0" | @smoke @regression | aprobado |
| PRD-16 | POST /products | Equivalencia inválida | `{}` | 400 | mensaje de error | ENUNCIADO | POST: body inválido; OpenAPI 400 | @negativo @regression | aprobado |
| PRD-17 | POST /products | Equivalencia inválida | price de texto | 400 | mensaje de error | CONTRATO | OpenAPI: price number, 400 | @negativo @regression | aprobado |
| PRD-18 | POST /products | Sintaxis | JSON mal formado | 400 | mensaje de error | ENUNCIADO | POST: body inválido | @negativo @regression | aprobado |
| PRD-19 | PUT /products/{id} | Equivalencia | id=7, body completo | 200 | JSON, `product`, id coincide, lo enviado coincide | ENUNCIADO | PUT: el campo refleja el cambio | @regression | aprobado |
| PRD-20 | PATCH /products/{id} | Equivalencia | id=8, solo `price` | 200 | JSON, id coincide, lo enviado coincide | ENUNCIADO | PATCH: el campo refleja el cambio; README: devuelve el id | @regression | aprobado |
| PRD-21 | PUT /products/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| PRD-22 | PATCH /products/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| PRD-23 | PUT /products/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |
| PRD-24 | DELETE + GET /products/{id} | Transición de estados | id=6 | 200 y 200 | `product`, el id coincide en ambas | SUPUESTO | README: nada se borra; reglas §7 | @regression | aprobado |
| PRD-25 | DELETE /products/{id} | Equivalencia inválida | id=9999 | 404 | status | HTTP | RFC 9110 §15.5.5; reglas §7 | @negativo @regression | aprobado |
| PRD-26 | DELETE /products/{id} | Equivalencia inválida | id=abc | 400 | status | CONTRATO | OpenAPI: id integer, 400 | @negativo @regression | aprobado |

## Contradicciones y dudas

1. **Categorías:** el README escribe la ruta como `/products/products/categories`, que parece una errata. Se usa `/products/categories`.
2. **PATCH:** no está en el OpenAPI, pero sí en el README y en el enunciado.

## Supuestos aprobados (2026-11-24)

- PRD-24: DELETE devuelve el recurso eliminado, por "Response coherente" del enunciado.

## Casos descartados y motivo

- **Id negativo:** misma partición que 0.
- **`price` negativo:** ninguna fuente define la respuesta al crear.
- **Crear y consultar el id generado:** el README dice que no se guarda. La reutilización del id se prueba en GoRest.
