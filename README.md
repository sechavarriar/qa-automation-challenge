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

## Resultados de pruebas de performance

Ejecución local del 24-11-2026 con k6 2.4.0, un solo generador de carga y red doméstica. Los datos están en `performance/results/`: resumen JSON, dashboard HTML y línea de tiempo por ventanas de 10 s.

```bash
npm run perf:load     # o perf:stress, perf:spike, perf:all
node performance/analyze.mjs load-test-products
```

### Load Test: GET https://fakestoreapi.com/products

| Métrica | Umbral | Resultado | ¿Cumple? |
|---|---|---|---|
| VUs máximos | 50 | 50 | — |
| Response time P95 | < 500 ms | 209 ms (mediana 173, P99 480, máx. 1425) | ✅ |
| Throughput | > 25 req/s | 31,8 req/s (3833 peticiones) | ✅ |
| Error rate | < 1% | 0% | ✅ |
| Checks | > 99% | 99,77%: 27 respuestas tardaron más de 500 ms | ✅ |

**Umbral de throughput:** VUs promedio / (latencia + think time). Con la rampa pedida hay 37,6 VUs promedio; con `sleep(1)` y la latencia máxima aceptada de 0,5 s, el piso es 37,6 / 1,5 ≈ 25 req/s. El `rate>30` del ejemplo no se deriva de estos datos: exigiría una latencia menor a 0,25 s.

### Stress Test: POST https://gorest.co.in/public/v2/users

| Fase | VUs | Peticiones | Mediana | P95 | Error rate | ¿< 5%? |
|---|---|---|---|---|---|---|
| 1 | 0 → 50 | 96 | 397 ms | 975 ms | 0% | ✅ |
| 2 | 50 → 100 | 243 | 389 ms | 430 ms | 0% | ✅ |
| 3 | 100 → 200 | 491 | 384 ms | 426 ms | 5,5% | ❌ |
| **Total** | 200 (pico) | 830 | — | — | 3,25% | ✅ |

- **Punto de quiebre:** entre 184 y 200 VUs. El primer 429 llega a los ~175 s, con ~193 VUs; en la última ventana de 10 s el error rate es 28,3%. El acumulado de toda la prueba no supera el 5%, pero el de la fase 3 sí.
- **Response time en el pico:** P95 435 ms y mediana 382 ms. La latencia no se degrada con la carga.
- **Rate limiting detectado:** sí. 26 respuestas 429, mezcladas con 201 en los mismos segundos y con una latencia similar (P95 429 ms): es un rechazo controlado. Ningún 5xx.
- **Comportamiento observado:** el límite configurado es de 300 por minuto, pero el primer 429 llegó con 473 peticiones en los 60 s previos. El límite real no se aplica como una ventana fija estricta.
- **Un error de red:** 1 petición sin respuesta (21,6 s) a los 159 s. No se puede atribuir al servidor con estos datos.

**Qué mide y qué no:** se usaron los 200 VUs y las 3 fases pedidas, con `sleep(20)`. Los términos de GoRest prohíben intentar saturar el servicio, así que la prueba encuentra el límite de peticiones por token y **no la capacidad del servidor**. Como protección, se detiene sola si los 5xx o las peticiones sin respuesta superan el 10%.

### Spike Test: GET https://fakestoreapi.com/products

| Fase | VUs | P95 | Umbral (criterio propio) | ¿Cumple? |
|---|---|---|---|---|
| Base | 10 | 196 ms | < 500 ms | ✅ |
| Spike | 100 | 236 ms | < 1000 ms | ✅ |
| Recuperación | 10 | 195 ms | < 500 ms | ✅ |

3346 peticiones y 0% de errores. El P95 sube a 393 ms en los primeros 10 s del spike y vuelve al nivel base en la ventana siguiente.
