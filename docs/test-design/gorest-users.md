# Diseño de casos: GoRest users (v2)

Contrato consultado: https://www.gorest.co.in/docs/v2/users (2026-11-24)

**Campos:** `id` entero, `name` texto (máx. 200), `email` válido y único, `gender` male/female, `status` active/inactive.

GRT-01 y GRT-02 son el flujo E2E que exige el enunciado. El resto cubre "happy path + casos negativos".

| ID | Operación | Técnica | Datos | Status esperado | Validaciones | Fuente | Cita | Tags | Estado |
|---|---|---|---|---|---|---|---|---|---|
| GRT-01 | Crear → PATCH email → consultar → email repetido | Transición de estados | email `{unico}` | 201, 200, 200, 422 | id generado y conservado, email enviado = recibido, email actualizado, error en `email` | ENUNCIADO | GoRest: escenarios obligatorios 1 a 4 | @smoke @regression | aprobado |
| GRT-02 | Igual, con PUT | Transición de estados | email `{unico}` | 201, 200, 200, 422 | las mismas | ENUNCIADO | GoRest: escenarios 1 a 4; docs: "PUT does the same as PATCH" | @smoke @regression | aprobado |
| GRT-03 | POST | Equivalencia | female, active | 201 | JSON, Location, `gorest-user`, lo enviado coincide | CONTRATO | Docs: Create a user, 201 | @regression | propuesto |
| GRT-04 | POST | Equivalencia | male, inactive | 201 | JSON, Location, `gorest-user`, lo enviado coincide | CONTRATO | Docs: Create a user, 201 | @regression | propuesto |
| GRT-05 | POST | Equivalencia inválida | sin token | 401 | mensaje de error | CONTRATO | Docs: a write without a token gives 401 | @negativo @regression | propuesto |
| GRT-06 | POST | Equivalencia inválida | token inválido | 401 | mensaje de error | CONTRATO | Docs: a token that is wrong gives 401 | @negativo @regression | propuesto |
| GRT-07 | POST | Equivalencia inválida | `{}` | 422 | error en `email` | CONTRATO | Docs: email required, 422 | @negativo @regression | propuesto |
| GRT-08 | POST | Equivalencia inválida | email sin @ | 422 | error en `email` | CONTRATO | Docs: valid email, 422 | @negativo @regression | propuesto |
| GRT-09 | POST | Equivalencia inválida | gender fuera de la lista | 422 | error en `gender` | CONTRATO | Docs: male or female, 422 | @negativo @regression | propuesto |
| GRT-10 | POST | Valor límite | name de 200 caracteres | 201 | `gorest-user`, lo enviado coincide | CONTRATO | Docs: up to 200 characters | @regression | propuesto |
| GRT-11 | POST | Valor límite | name de 201 caracteres | 422 | error en `name` | CONTRATO | Docs: up to 200 characters | @negativo @regression | propuesto |
| GRT-12 | GET por id | Equivalencia inválida | id inexistente | 404 | mensaje de error | CONTRATO | Docs: a wrong id gives 404 | @negativo @regression | propuesto |
| GRT-13 | PATCH | Equivalencia inválida | id inexistente | 404 | mensaje de error | CONTRATO | Docs: a record you cannot see gives 404 | @negativo @regression | propuesto |
| GRT-14 | Crear → DELETE → consultar | Transición de estados | email `{unico}` | 201, 204, 404 | el usuario deja de existir | CONTRATO | Docs: delete 204; a wrong id gives 404 | @regression | propuesto |

## Contradicciones y dudas

Ninguna. Los 4 escenarios del enunciado coinciden con la documentación de v2.

## Supuestos

Ninguno.

## Casos descartados y motivo

- **Email con otras mayúsculas:** la documentación no define si se considera el mismo.
- **JSON mal formado:** la documentación no define la respuesta.
- **429:** se mide en la prueba de estrés, no en la funcional.
- **Token vencido:** exige un token vencido real.
