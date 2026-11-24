# Prueba del agente `triage-fallos` (24-11-2026)

**Insumo:** `reports/fallos.md` con 31 fallos: los 27 reales de FakeStoreAPI y 4 sembrados de otras causas. El agente no sabía cuáles eran y no leyó el README.

## Fallos sembrados

| Caso | Qué se provocó | Esperado | Clasificación del agente |
|---|---|---|---|
| TMP-01 | Esperar 404 al consultar un producto eliminado | Defecto del test o limitación conocida | Defecto del test, con la otra como hipótesis ✅ |
| TMP-02 | Token inválido de GoRest | Entorno / configuración | Entorno / configuración ✅ |
| TMP-03 | Esperar 200 donde el enunciado pide 201 | Defecto del test | Defecto del test ✅ |
| TMP-04 | Timeout de 20 ms | Entorno / configuración | Entorno / configuración, sin confundirlo con intermitencia ✅ |

## Fallos reales

Agrupó los 27 en las 8 causas documentadas (FS-01 a FS-08) y bajó la confianza cuando la fuente no es el contrato: media en los 404 por estándar HTTP y baja en USR-16, que se apoya en un supuesto.

## Lo que aportó

- **Detectó que el insumo mezclaba ejecuciones:** el HTML solo tenía un escenario y los tiempos no cuadraban. Era cierto: se armó así para la prueba.
- **Señaló respuestas recortadas** en el resumen de fallos. Se corrigió: ahora se acortan las cabeceras largas y no el body.
- **Cuestionó el 404 de PUT (FS-04):** HTTP también permite que PUT cree el recurso con 201. El 200 no encaja en ninguna de las dos lecturas.

## Antes de la prueba

El agente leía el JSON de Cucumber, donde los adjuntos van en base64, y no podía ver los request/response. Por eso cada ejecución genera `reports/fallos.md`.

## Límites

Es una sola prueba, con fallos sembrados por quien conoce el proyecto. No mide su precisión general, y la decisión sigue siendo de una persona.
