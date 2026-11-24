# QA Automation Challenge

Automatización de APIs (FakeStoreAPI y GoRest) con Playwright y Cucumber en TypeScript, ejecución en GitHub Actions y pruebas de performance con k6.

> En construcción.

## Requisitos

- Node.js 22 o superior
- Token de GoRest con permisos de v2

## Instalación

```bash
npm ci
```

Copia `.env.example` como `.env` y completa `GOREST_TOKEN`.

## Criterio de los asserts

El valor esperado sale del enunciado, del contrato de la API o del estándar HTTP, nunca de lo que la API respondió. Si un assert correcto no se cumple, el test queda en rojo y se refleja en el reporte.

## Extra: apoyo de IA en el desarrollo

`.claude/` contiene skills y agentes de Claude Code para diseñar, escribir y revisar tests, y para analizar fallos. Los tests, el pipeline y k6 no dependen de esa carpeta ni llaman a servicios de IA.
