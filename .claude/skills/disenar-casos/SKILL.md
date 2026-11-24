---
name: disenar-casos
description: Diseña la matriz de casos de prueba de un recurso de API (products, carts, users, auth, GoRest o uno nuevo) a partir del enunciado y del contrato. Úsala antes de escribir tests. No escribe código.
argument-hint: "[recurso]"
---

# Diseñar casos de prueba

Recurso: $ARGUMENTS (si viene vacío, pregunta cuál).

Salida: `docs/test-design/<recurso>.md`. No crees ni edites ningún otro archivo.

## Pasos

1. Lee `.claude/reglas-qa.md`.
2. Lee el contrato del recurso (sección 7 de las reglas). Si no puedes acceder, dilo y detente; no lo completes de memoria.
3. Lista cada operación con su status documentado y los campos del recurso con su tipo.
4. Diseña los casos aplicando:
   - **Partición de equivalencia:** datos válidos e inválidos por campo.
   - **Valores límite:** ids 0, negativo, último existente y siguiente; numéricos 0 y negativos.
   - **Transición de estados:** crear → consultar → actualizar → eliminar → consultar.
   - **Contrato:** campos obligatorios, tipos y formato.
5. Decide el esperado **antes** de llamar a la API. No la llames para averiguarlo.
6. Descarta los casos que no aporten información nueva. Calidad sobre cantidad.
7. Compara con la cobertura exigida (sección 6) y completa lo que falte.

## Formato

```markdown
# Diseño de casos: <recurso>

Contrato consultado: <url> (<fecha>)

| ID | Operación | Técnica | Datos | Status esperado | Validaciones | Fuente | Cita | Tags | Estado |
|---|---|---|---|---|---|---|---|---|---|
| PRD-01 | GET /products/{id} | Equivalencia | id=1 | 200 | id coincide, tipos | CONTRATO | OpenAPI: GET /products/{id} 200 | @smoke @regression | propuesto |

## Contradicciones y dudas
## Supuestos por aprobar
## Casos descartados y motivo
```

- `Cita` apunta al punto exacto de la fuente. Sin cita no hay caso.
- `Estado` empieza siempre en `propuesto`. Solo el usuario lo cambia a `aprobado` o `rechazado`.

## Cierre

Muestra un resumen (casos por fuente, supuestos y contradicciones) y pide al usuario que apruebe o rechace. No sigas con la escritura de tests.
