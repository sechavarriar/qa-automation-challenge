---
name: escribir-tests
description: Convierte una matriz de casos ya aprobada en feature, step definitions y API Object con Playwright y Cucumber en TypeScript. Úsala después de disenar-casos. No cambia valores esperados.
argument-hint: "[recurso]"
---

# Escribir tests

Recurso: $ARGUMENTS (si viene vacío, pregunta cuál).

## Antes de escribir

1. Lee `.claude/reglas-qa.md` y `docs/test-design/<recurso>.md`.
2. Si la matriz no existe o no tiene casos `aprobado`, detente y dilo. Implementa solo los `aprobado`.
3. Lee la implementación de Products (feature, steps, API Object) y `Utilities/`. Es el patrón de referencia: copia su estructura y sus nombres, no inventes otra.
4. Busca los steps existentes y reutilízalos. Crea uno nuevo solo si ninguno sirve.

## Qué escribir

| Archivo | Contenido |
|---|---|
| `Features/` | `Scenario Outline` con `Examples`; una fila por caso, con su ID de la matriz y la columna `fuente` |
| `PageObject/Api/` | Un API Object por recurso, que hereda o usa lo común |
| `StepsDefinitions/` | Solo los steps propios del recurso; los genéricos se comparten |
| `Utilities/` | El esquema JSON del recurso; nada más, salvo que se justifique |

- Status, datos y fuente se copian tal cual de la matriz.
- Los steps se leen como negocio: "Cuando consulto el producto con id 1".
- Los mensajes de assert dicen qué se esperaba y qué se recibió.
- Sin `any`, sin valores fijos en steps y sin lógica repetida.

## Verificar

1. Mira los comandos en `package.json`. Compila y ejecuta los tests del recurso.
2. Separa los fallos:
   - **Error del código del test** (no compila, step sin definir, dato mal leído): corrígelo.
   - **Assert que no se cumple:** déjalo en rojo. No toques el esperado.
3. Si dudas de cuál es, déjalo en rojo y repórtalo.

## Cierre

Reporta los archivos creados, cuántos casos pasan y cuántos fallan, y cada fallo con esperado y recibido. Recomienda pasar el agente `revisor-tests`. No hagas commit.
