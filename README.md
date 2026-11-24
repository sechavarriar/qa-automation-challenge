# QA Automation Challenge

Automatización de las APIs de [FakeStoreAPI](https://fakestoreapi.com/) y [GoRest](https://gorest.co.in/) con Playwright y Cucumber en TypeScript, ejecución en GitHub Actions y pruebas de performance con k6.

## Resultado

| API | Escenarios | Verde | Rojo |
|---|---|---|---|
| FakeStoreAPI | 81 | 54 | 27 |
| GoRest | 14 | 14 | 0 |
| **Total** | **95** | **68** | **27** |

**Los 27 fallos son intencionales.** El valor esperado sale del enunciado, del contrato o del estándar HTTP, nunca de lo que la API respondió. Si un assert correcto no se cumple, queda en rojo y se refleja en el reporte: no hay skips, `continue-on-error` ni asserts ajustados. Ver [Defectos encontrados](#defectos-encontrados).

| Evidencia | Resultado |
|---|---|
| [GoRest, ejecución manual](https://github.com/sechavarriar/qa-automation-challenge/actions/runs/45501289273) | Verde: 14 de 14 |
| [Regresión manual, 4 procesos](https://github.com/sechavarriar/qa-automation-challenge/actions/runs/45501372833) | Rojo: 68 de 95 |
| [Smoke en Pull Request](https://github.com/sechavarriar/qa-automation-challenge/actions/runs/45500953041) | Rojo: 16 de 19 |
| [Performance en Actions](https://github.com/sechavarriar/qa-automation-challenge/actions/runs/45502783617) | Rojo: Cloudflare bloquea a k6 ([detalle](#resultados-de-pruebas-de-performance)) |
| Performance local | [`performance/results/`](performance/results) |

## Estructura

| Carpeta | Responsabilidad |
|---|---|
| `Features/` | Escenarios Gherkin y todos los datos de prueba |
| `StepsDefinitions/` | Traducen el Gherkin a operaciones y asserts |
| `PageObject/Api/` | API Objects: endpoints y operaciones. `CrudApi` es la base común |
| `Utilities/` | Cliente HTTP, configuración, logs, contratos JSON Schema y reporte |
| `performance/` | Scripts, umbrales y resultados de k6 |
| `docs/test-design/` | Matrices de casos con la fuente de cada valor esperado |
| `.github/workflows/` | Pipelines de API y de performance |

## Instalación

Requiere Node.js 22 o superior y, para performance, [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).

```bash
npm ci
cp .env.example .env
```

Completa `GOREST_TOKEN` en `.env` con un token de GoRest **que tenga permiso de v2**. FakeStoreAPI se puede probar sin token.

## Ejecución

| Comando | Qué ejecuta |
|---|---|
| `npm test` | Todo |
| `npm run test:smoke` / `test:regression` | Por nivel |
| `npm run test:fakestore` / `test:gorest` | Por API |
| `npm test -- --tags "@carts and @negativo" --parallel 2` | Filtro y paralelo a elección |
| `npm run perf:load` / `perf:stress` / `perf:spike` | Performance |
| `npm run typecheck` | Verificación de tipos |

El reporte queda en `reports/html/index.html` y un resumen legible de los fallos, en `reports/fallos.md`, con el request y el response de cada petición y los datos sensibles enmascarados. Se generan aunque haya fallos.

## Decisiones técnicas

| Decisión | Motivo |
|---|---|
| GoRest **v2** | Es la versión que pide el enunciado. La v3 salió el 1-11-2026 y usa ids y errores con otro formato |
| Cada escenario es independiente; el id se guarda en el World | Cucumber lo reinicia por escenario, así que la suite corre en paralelo. El id se reutiliza dentro del flujo E2E; pasarlo entre escenarios crearía dependencia de orden |
| Cuerpos como texto desde el feature | Permite enviar JSON mal formado en los negativos |
| Reintentos solo en GET y solo ante errores de red | Un assert fallido o un status inesperado nunca se reintenta |
| Los usuarios creados en GoRest se borran al terminar | GoRest sí guarda los datos |
| IPv4 primero | En redes sin salida IPv6, Playwright esperaba 5 s por conexión |
| Cero escenarios ejecutados es un fallo | Un tag mal escrito no debe dar verde sin haber probado nada |

**Librerías adicionales:** `ajv` y `ajv-formats` (JSON Schema), `dotenv` (configuración) y `tsx` (TypeScript sin compilar). No se usa faker: `{unico}` genera valores irrepetibles desde el feature.

## Supuestos

| Supuesto | Dónde aplica |
|---|---|
| Un id inexistente debe dar 404. El contrato de FakeStoreAPI no lo define, se usa el estándar HTTP | Consultar, actualizar y eliminar |
| Credenciales incorrectas deben dar 401. El OpenAPI solo declara 400, sin decir cuándo | Auth |
| PATCH devuelve el `id`, por analogía con el README de products | CRT-19, USR-16 |
| DELETE devuelve el recurso eliminado ("Response coherente") | PRD-24, CRT-23, USR-20 |
| Los productos de un carrito son `{productId, quantity}`: el README y el OpenAPI se contradicen | Carts |
| Cualquier texto no vacío vale como mensaje de error; ninguna fuente fija el formato | Negativos |

Tras un DELETE, el recurso **debe seguir existiendo**: la documentación de FakeStoreAPI dice que nada se borra.

## Defectos encontrados

| Id | API | Comportamiento | Esperado | Recibido | Casos |
|---|---|---|---|---|---|
| FS-01 | products, carts, users | Consultar un id inexistente | 404 | 200 vacío o `null` | 4 |
| FS-02 | products | Consultar un id no numérico | 400 | 200 vacío | 1 |
| FS-03 | products, carts, users | Crear con un body que incumple el contrato | 400 | 201 | 8 |
| FS-04 | products, carts, users | Actualizar un id inexistente | 404 | 200 | 6 |
| FS-05 | products, carts, users | Eliminar un id inexistente | 404 | 200 | 3 |
| FS-06 | auth | Login correcto | 200 (OpenAPI) | 201 | 2 |
| FS-07 | users | Crear un usuario | El usuario creado | Solo `{"id": 11}` | 1 |
| FS-08 | users | Actualizar un usuario | Respuesta con `id` | Sin `id` | 2 |

Cada caso lleva el tag `@defecto-FS-nn`, que lo identifica y no lo excluye. FS-02 contrasta con carts y users, que sí responden 400. Además, `GET /users` expone contraseñas en texto plano: el contrato las incluye, así que no tiene test, pero en un producto real sería grave.

## Secretos

| Nombre | Dónde | Uso |
|---|---|---|
| `GOREST_TOKEN` | `.env` en local, GitHub Secret en CI | Peticiones a GoRest |

`.env` está en `.gitignore`; solo se versiona `.env.example`. Las credenciales de Auth son las demo públicas de FakeStoreAPI.

## Parte 1: preguntas

### 1. ¿Qué mejoraría con más tiempo?

- **Asserts que no se tapen entre sí:** Cucumber se detiene en el primer step fallido. En FS-03 y FS-06 el status falla primero y no se llega a revisar el mensaje o el token.
- **Contrato del proveedor:** comparar en cada nightly el OpenAPI publicado con el que usan los tests, para enterarme de un cambio antes de que falle.
- **Gherkin sin query strings:** "limitado a 5" en lugar de `limit=5`.
- **Historial de resultados** para medir flakiness con datos y no con impresiones.
- **Formato de errores:** acordar con el equipo qué es un mensaje de error válido y validarlo con un esquema.

### 2. ¿Cómo lo parametrizaría por ambiente?

`TEST_ENV` elige el ambiente y se valida al arrancar: un nombre inválido detiene la ejecución.

| Nivel | Cómo se configura |
|---|---|
| Local | `.env.<ambiente>` tiene prioridad sobre `.env` |
| CI | Input `environment` y variables del repo por ambiente, como `FAKESTORE_BASE_URL_STAGING` |
| Secretos (propuesta) | GitHub Environments, con un token por ambiente y aprobación manual para prod |

Los features no cambian entre ambientes. Los datos que dependan de uno irían en archivos por ambiente, y en prod solo correría un subconjunto de lectura (`@smoke and not @escritura`). Estas dos APIs tienen un solo ambiente, así que hoy todos apuntan a las mismas URLs; el reporte muestra la URL real para que el nombre no engañe.

### 3. ¿Cómo gestionaría datos sensibles?

- **En local,** `.env` fuera de Git y `.env.example` sin valores.
- **En CI,** GitHub Secrets, expuestos solo al paso que los usa.
- **En logs y reportes,** enmascarados por código: `Authorization`, `password`, `token` y parámetros de URL, también en JSON mal formado y en los mensajes de fallo.
- **Mínimo privilegio:** token con caducidad y solo con los permisos que la suite necesita.
- **En un equipo:** un gestor de secretos con rotación, y escaneo de secretos antes de cada commit y en el repo. Si uno se filtra, se revoca primero y se limpia después.

### 4. ¿Qué estrategia usaría contra la flakiness?

| Causa | Medida |
|---|---|
| Red | Reintento con espera creciente solo en GET, y cada intento queda en el reporte |
| Datos | `{unico}` por escenario y limpieza al terminar |
| Orden | Sin estado compartido; la suite da el mismo resultado con 1, 2 y 4 procesos |
| Tiempo | Timeout por petición configurable; sin esperas fijas |
| Idempotencia | POST, PUT, PATCH y DELETE no se reintentan: podrían duplicar o alterar datos |
| Ruido | Un fallo conocido se identifica con tag y se investiga; no se reejecuta hasta verlo verde |

Con historial, un test que falle y pase sin cambios iría a cuarentena con responsable y fecha.

### 5. ¿Cómo separaría smoke y regression?

Con tags: `@smoke` es el camino crítico de cada recurso (19 escenarios, unos 12 s en local) y `@regression` es todo (95). Además hay tags por API, recurso, tipo (`@negativo`, `@e2e`) y defecto. El PR recibe el smoke; push y nightly, la regresión en paralelo. Un caso no sale de `@smoke` por estar en rojo: el login falla y se queda. Priorizo por riesgo: primero autenticación, lectura y creación; después actualización, filtros y negativos.

## Parte 2: CI/CD

| Trigger | Qué ejecuta |
|---|---|
| Pull Request a `main` o `develop` | `@smoke` |
| Push a `main` o `develop` | `@regression` |
| Nightly, 6:00 UTC | `@regression` |
| Manual | Tags, ambiente y procesos a elección |

El reporte se publica como artefacto durante 30 días, también si hay fallos.

### 1. ¿Cómo ejecutar solo smoke en PR y regression nightly?

Ya está en [api-tests.yml](.github/workflows/api-tests.yml): un solo workflow elige los tags según el evento, y el cron `0 6 * * *` lanza la regresión. Uso uno y no dos porque los pasos son idénticos. Los separaría si necesitaran distintos permisos, runners o responsables. Un push nuevo a un PR cancela la ejecución anterior.

### 2. ¿Cómo manejar el token de GoRest sin exponerlo?

Es un GitHub Secret que solo recibe el paso de pruebas, nunca por línea de comandos. GitHub lo muestra como `***` y, como eso no protege los artefactos, el código también lo enmascara en el reporte. El workflow solo tiene permiso de lectura. Los PR desde forks no reciben secretos: hoy sus casos de GoRest fallarían indicando que falta el token, y limitaría esos PR a `@fakestore`.

### 3. ¿Qué haría si falla por intermitencia de la API externa?

1. **Separar la causa:** un error de red se reporta como "no obtuvo respuesta tras N intentos", distinto de un assert.
2. **Reintentar solo lo seguro:** GET con error de red. Nunca un assert.
3. **Verificar antes:** un paso previo que consulte la salud de cada API y marque "no se pudo probar" si está caída. En k6 ya existe y fue lo que detectó el bloqueo de Cloudflare.
4. **Circuit breaker:** si una API no responde varias veces seguidas, omitir el resto de sus escenarios **y reportarlos como no ejecutados**, no como verdes.
5. **Mocks** para lo que deba bloquear un merge: los contratos se prueban contra un simulador estable, y la integración real queda en el nightly.

### 4. ¿Cómo versionar y almacenar evidencias?

El artefacto lleva número de build e intento, y el reporte incluye commit, build, ambiente, URLs y argumentos, así que cada evidencia se puede relacionar con su código. Son 30 días en GitHub. Para auditoría copiaría los reportes a un almacenamiento con retención y bloqueo de escritura, organizados por fecha, commit y build, y publicaría los resultados en una herramienta como Allure TestOps o ReportPortal. Los resultados de performance relevantes se versionan en `performance/results/`.

### 5. ¿Qué métricas incorporaría?

| Métrica | Para qué | Alerta |
|---|---|---|
| Tasa de éxito, sin contar defectos conocidos | Detectar regresiones nuevas | Cualquier fallo nuevo |
| Defectos conocidos abiertos y su antigüedad | Que el rojo no se vuelva normal | Más de 30 días |
| Flakiness rate: pasa al repetir sin cambios | Confianza en la suite | > 2% |
| Duración p95 del pipeline | Feedback rápido | PR > 10 min |
| Latencia por endpoint | Degradación del proveedor | +30% sobre su media |
| Disponibilidad del proveedor | Separar su caída de un defecto | < 99% semanal |

Enviaría `cucumber.json` a una base de series de tiempo y lo vería en Grafana, con tendencia por rama y avisos al canal del equipo. Los umbrales son un punto de partida y se ajustan con datos.

## Parte 3: performance

### Resultados de pruebas de performance

Ejecución local del 24-11-2026 con k6 2.4.0, un solo generador de carga y red doméstica. Los datos están en `performance/results/`: resumen JSON, dashboard HTML y línea de tiempo por ventanas de 10 s.

```bash
npm run perf:load     # o perf:stress, perf:spike, perf:all
node performance/analyze.mjs load-test-products
```

Cada ejecución escribe en `performance/output/`, que no se versiona.

**En GitHub Actions, k6 no puede medir FakeStoreAPI.** La [ejecución del 24-11-2026](https://github.com/sechavarriar/qa-automation-challenge/actions/runs/45501301260) recibió 403 en las 4445 peticiones, desde la primera, así que no depende de la carga. En la misma franja, Cucumber recibió 200 desde Actions y k6 recibe 200 en local: el bloqueo ocurre con k6 desde la red de los runners. La causa está confirmada en [otra ejecución](https://github.com/sechavarriar/qa-automation-challenge/actions/runs/45502783617): la respuesta trae `server=cloudflare` y `cf-mitigated=challenge`, es decir, un desafío antibots de Cloudflare que exige un navegador. No lo rechaza la API.

No se altera la identidad de k6 para evitar ese control. Las pruebas de FakeStoreAPI verifican primero el acceso y, si no hay 200, se detienen con error y muestran quién rechazó la petición. Los resultados válidos son los locales.

Esa misma ejecución muestra por qué el P95 no basta por sí solo: marcó 44 ms, «cumple», con el 100% de errores.

#### Load Test: GET https://fakestoreapi.com/products

| Métrica | Umbral | Resultado | ¿Cumple? |
|---|---|---|---|
| VUs máximos | 50 | 50 | — |
| Response time P95 | < 500 ms | 209 ms (mediana 173, P99 480, máx. 1425) | ✅ |
| Throughput | > 25 req/s | 31,8 req/s (3833 peticiones) | ✅ |
| Error rate | < 1% | 0% | ✅ |
| Checks | > 99% | 99,77%: 27 respuestas tardaron más de 500 ms | ✅ |

**Umbral de throughput:** VUs promedio / (latencia + think time). Con la rampa pedida hay 37,6 VUs promedio; con `sleep(1)` y la latencia máxima aceptada de 0,5 s, el piso es 37,6 / 1,5 ≈ 25 req/s. El `rate>30` del ejemplo no se deriva de estos datos: exigiría una latencia menor a 0,25 s.

#### Stress Test: POST https://gorest.co.in/public/v2/users

| Fase | VUs | Peticiones | Mediana | P95 | Error rate | ¿< 5%? |
|---|---|---|---|---|---|---|
| 1 | 0 → 50 | 96 | 397 ms | 975 ms | 0% | ✅ |
| 2 | 50 → 100 | 243 | 389 ms | 430 ms | 0% | ✅ |
| 3 | 100 → 200 | 491 | 384 ms | 426 ms | 5,5% | ❌ |
| **Total** | 200 (pico) | 830 | — | — | 3,25% | ✅ |

- **Punto de quiebre:** entre 184 y 200 VUs. El primer 429 llega a los ~175 s, con ~193 VUs; en la última ventana de 10 s el error rate es 28,3%. El acumulado de toda la prueba no supera el 5%, pero el de la fase 3 sí.
- **Response time en el pico:** P95 435 ms y mediana 382 ms. La latencia no se degrada con la carga.
- **Rate limiting detectado:** sí. 26 respuestas 429, mezcladas con 201 en los mismos segundos y con una latencia similar (P95 429 ms): es un rechazo controlado. Ningún 5xx.
- **Comportamiento observado:** el límite configurado es de 300 por minuto, y el primer 429 llegó con 473 peticiones en los 60 s previos. Eso no lo contradice, porque no se sabe cuándo empieza la ventana de GoRest. Que sigan llegando 201 entre los 429 es compatible con un cupo que se repone de forma continua, pero estos datos no bastan para confirmarlo.
- **Un error de red:** 1 petición sin respuesta (21,6 s) a los 159 s. No se puede atribuir al servidor con estos datos. Sin ella, la fase 3 igual supera el 5% (26 de 491, 5,3%).

**Qué mide y qué no:** se usaron los 200 VUs y las 3 fases pedidas, con `sleep(20)`. Los términos de GoRest prohíben intentar saturar el servicio, así que la prueba encuentra el límite de peticiones por token y **no la capacidad del servidor**. Como protección, se detiene sola si los 5xx o las peticiones sin respuesta superan el 10%.

#### Spike Test: GET https://fakestoreapi.com/products

| Fase | VUs | P95 | Umbral (criterio propio) | ¿Cumple? |
|---|---|---|---|---|
| Base | 10 | 196 ms | < 500 ms | ✅ |
| Spike | 100 | 236 ms | < 1000 ms | ✅ |
| Recuperación | 10 | 195 ms | < 500 ms | ✅ |

3346 peticiones y 0% de errores. El P95 sube a 393 ms en los primeros 10 s del spike y vuelve al nivel base en la ventana siguiente.

### Análisis y conclusiones

#### 1. ¿Qué cuellos de botella identifiqué?

| Cuello de botella | Evidencia |
|---|---|
| Rate limiting de GoRest | 26 respuestas 429 a partir de ~193 VUs; es el único límite que encontré en la API |
| Filtro antibots de FakeStoreAPI | 403 a k6 desde Actions, con `cf-mitigated=challenge` |
| Arranque | P95 de 661 ms en los primeros 10 s de la carga, contra 190-269 ms después; y 975 ms en la fase 1 del estrés, contra 430 ms en la 2 |
| Red propia | 1 petición sin respuesta durante 21,6 s, de 830 |

No encontré saturación del servidor: la mediana se mantuvo estable en las tres pruebas. El arranque lento puede venir del servidor, del CDN o de mi red; con una ejecución no se puede separar.

#### 2. ¿Cómo interpreté los resultados?

Primero el **error rate**, después la latencia y al final el throughput. La ejecución bloqueada en Actions marcó P95 de 44 ms y 37 req/s, ambos "cumplen", con el 100% de errores: responder rápido un 403 no es rendimiento. También miro **P95 y P99 en lugar del promedio** (en la carga, 209 y 480 ms frente a 183), y la **evolución por ventanas**: en el estrés el acumulado es 3,25% y parece aprobado, pero la última ventana llega a 28,3%.

El throughput depende del think time: 31,8 req/s es lo que generan 50 VUs con `sleep(1)`, no el máximo de la API.

#### 3. ¿Qué mejoras propondría?

- **GoRest:** enviar `Retry-After` en el 429 si no lo hace, y documentar cómo se repone el cupo. En el cliente, respetar `X-RateLimit-Remaining` y reducir el ritmo antes de llegar al límite.
- **FakeStoreAPI:** caché HTTP o CDN para `/products`, que es una lectura repetida y pesa unos 11 KB por respuesta; y paginación por defecto.
- **Arranque:** precalentar instancias y conexiones antes de recibir tráfico.
- **Consultas y escalamiento horizontal:** no los propongo con estos datos, porque la latencia no creció con la carga. Antes mediría CPU, memoria y base de datos.

#### 4. ¿Cómo integraría estas pruebas en CI/CD?

**Lo que ya está:** [performance-tests.yml](.github/workflows/performance-tests.yml) se lanza a mano (`load`, `stress`, `spike` o `all`) y los domingos ejecuta solo la carga. Los umbrales definen el resultado y los artefactos se guardan 30 días. El estrés no se programa porque supera a propósito el límite de GoRest.

**Lo que aprendí al ejecutarlo:** un runner compartido no sirve para medir una API protegida. Cloudflare desafió a k6 y la prueba falló sin medir nada. En un proyecto real haría lo siguiente:

1. **Generador de carga propio**, con IP fija autorizada en el filtro y en un repositorio privado. Un runner propio en un repo público permitiría que un tercero intentara ejecutar código en él.
2. **Ambiente dedicado**, parecido a producción y sin otro tráfico, para que una variación se deba al cambio y no al entorno.
3. **Tres niveles:** una carga corta en cada PR, la carga completa cada noche y estrés o spike antes de un release o a mano.
4. **Verificación previa de acceso**, como la de este repo, para distinguir "no se pudo medir" de "el sistema es lento".
5. **Umbrales y alertas:** primero se comparan con una línea base sin bloquear; cuando el resultado es estable, un umbral incumplido detiene el despliegue y avisa al equipo.

#### 5. ¿Qué herramientas usaría en producción?

Un APM (Datadog, New Relic o Dynatrace) con trazas de OpenTelemetry para ubicar dónde se va el tiempo; Prometheus y Grafana para latencia, tráfico, errores y saturación; monitoreo sintético desde varias regiones; y RUM para lo que vive el usuario. Las alertas se basarían en objetivos de servicio y su presupuesto de error, no en picos aislados.

### Preguntas obligatorias

#### 1. ¿Cuál fue el comportamiento de las APIs bajo carga?

**FakeStoreAPI** se mantuvo estable con 50 VUs (P95 209 ms, 0% de errores) y absorbió un salto de 10 a 100 VUs con un P95 de 393 ms en los primeros 10 s y recuperación en la ventana siguiente. **GoRest** creó 803 usuarios con una mediana de 382 a 397 ms en las tres fases y, al llegar a su límite, rechazó con 429 sin degradar la latencia ni devolver 5xx.

#### 2. ¿Identifiqué algún cuello de botella o límite?

Sí: el rate limiting de GoRest, con unas 9 a 10 peticiones por segundo y entre 184 y 200 VUs. El número de VUs depende del think time de 20 s; el límite real es de peticiones. No encontré el límite de capacidad de ninguna API: en GoRest porque sus términos piden no saturarla, y en FakeStoreAPI porque 100 VUs no bastaron.

#### 3. ¿Qué métricas considero más importantes?

Error rate por tipo (4xx, 429, 5xx, red), P95 y P99, throughput de respuestas correctas y saturación de recursos (CPU, memoria, conexiones, colas). Las tres primeras dicen **qué** pasa; la saturación dice **por qué** y cuánto margen queda. En estas APIs no tengo acceso a la última, y por eso mis conclusiones no hablan de causas internas.

#### 4. ¿Cómo diferencio carga de estrés?

| | Carga | Estrés |
|---|---|---|
| Pregunta | ¿Cumple con el tráfico esperado? | ¿Dónde y cómo se rompe? |
| Configuración | Sube, se sostiene y baja (50 VUs) | Sube por escalones hasta el quiebre (200 VUs) |
| Umbrales | Criterio de aceptación: deben cumplirse | Instrumento: cruzarlos es el hallazgo |
| Aquí | Pasó los 4 umbrales | Quiebre por 429 en la fase 3 |

#### 5. ¿Qué estrategia usaría en un ambiente real?

Ambiente dedicado y parecido a producción, con volumen de datos comparable. Datos sintéticos, o anonimizados cuando la distribución importe; nunca personales sin anonimizar. Modelo de carga sacado del tráfico real (mezcla de operaciones y think time) y, para medir capacidad, llegadas por segundo en lugar de VUs, para que un servidor lento no reduzca la carga. Ventanas acordadas, aviso a los equipos, criterio de parada y terceros simulados. Cada prueba se repite al menos tres veces antes de concluir; aquí hice una.

#### 6. ¿Cómo automatizaría la detección de regresiones?

1. **Línea base:** mediana de las últimas 10 ejecuciones estables en el mismo ambiente.
2. **Comparación:** P95, error rate y throughput de cada build contra esa base.
3. **Tolerancia según el ruido medido:** por ejemplo, avisar con +15% de P95 y bloquear con +30% en dos ejecuciones seguidas.
4. **Tendencia:** resultados en Grafana por commit, para ver degradaciones lentas que no cruzan el umbral.
5. **Alerta con contexto:** métrica, build, commits incluidos y enlace al reporte.

## Parte 4: casos técnicos

### Caso 1. Code review

#### 1. Problemas por severidad

| # | Severidad | Problema | Justificación |
|---|---|---|---|
| 1 | Crítica | Token fijo en el código y en `console.log` | Queda en el historial de Git y en los logs de CI; hay que revocarlo, no solo borrarlo |
| 2 | Crítica | `res.json()` y luego `res.text()` sobre la misma respuesta | El body se lee una sola vez: el primer step lanza `TypeError` después de crear el usuario y deja un dato huérfano |
| 3 | Alta | El `GET` de "el usuario existe" no envía `Authorization` | GoRest solo muestra el usuario a su token: responde 404 aunque exista (verificado el 24-11-2026) |
| 4 | Alta | Los `When` no validan status ni errores | Un 401 o 422 deja `userId` en `undefined` y el fallo aparece lejos de su causa |
| 5 | Alta | Emails fijos | La segunda ejecución recibe 422 por email repetido |
| 6 | Alta | `let userId` a nivel de módulo | Se comparte entre escenarios y el segundo step lo sobrescribe; rompe el paralelo |
| 7 | Media | Step copiado y pegado | Cada cambio se hace dos veces |
| 8 | Media | URL, headers y datos dentro del step | No hay ambientes, ni datos desde el feature, ni capas |
| 9 | Media | Espera fija de 3 s | Alarga la suite y no garantiza nada |
| 10 | Media | "Existe" solo mira el 200 | No comprueba id, email ni contrato |
| 11 | Baja | Sin limpieza y `userId` sin tipo | Acumula datos y oculta errores de tipos |

**Por qué el token va antes que el step que siempre falla:** el step roto se nota enseguida y se arregla cambiando unas líneas. El token, en cambio, ya quedó expuesto: alguien pudo copiarlo y usarlo sin que nos demos cuenta, y borrarlo del código no sirve porque sigue en el historial de Git. Por eso primero revoco el token y después corrijo el step. Ordeno por el daño que puede causar, no por lo que se ve primero.

Supuesto: el fragmento está completo. Si los imports existen en otra parte, no los cuento.

#### 2. Tres comentarios de review

> **Token (bloqueante).** El token está en la línea del `Authorization` y también se imprime en el `console.log`. Como ya está en el historial, ¿lo revocas y generas otro? Después lo leemos de `GOREST_TOKEN` (`.env` en local, secret en CI) y lo enmascaramos al loguear. Si quieres, te acompaño en el cambio.

> **Este step falla siempre (bloqueante).** Encontré por qué: el body de la respuesta solo se puede leer una vez. Aquí se lee con `json()` y luego con `text()`, y la segunda lectura lanza un error. Si lo guardas en una variable y validas el 201 antes de usar el `id`, queda resuelto. Si quieres lo vemos juntos.

> **Estado compartido (bloqueante).** `userId` es global y "creo otro usuario" lo pisa, así que en paralelo los escenarios se mezclan. ¿Lo pasamos al World? De paso, los dos steps quedan en uno solo con los datos desde `Examples`. Buena idea separar la creación de la verificación: eso lo mantendría.

#### 3. Refactor de un step

```gherkin
# Feature: los datos
Scenario Outline: Crear un usuario
  When creo un usuario con nombre "<name>", email "<email>" y género "<gender>"
  Then el status es 201

  Examples:
    | name   | email                   | gender |
    | Ana QA | qa.{unico}@example.com  | female |
```

```ts
// Step: traduce el Gherkin y guarda el estado en el World
When('creo un usuario con nombre {string}, email {string} y género {string}',
  async function (this: ApiWorld, name: string, email: string, gender: string) {
    const user = { name, email: resolveTemplate(email), gender, status: 'active' };
    this.response = await this.users.create(user);
  });

// API Object: conoce el endpoint, no hace asserts
class UsersApi {
  constructor(private readonly http: HttpClient) {}
  create(user: NewUser) { return this.http.post('/public/v2/users', user); }
}

// Utilities: token, headers, timeout y log enmascarado en un solo lugar
const http = HttpClient.create({
  baseUrl: Environment.goRestBaseUrl,
  headers: { Authorization: `Bearer ${Environment.goRestToken}` },
});
```

#### 4. Qué enseñaría primero

**Separación de responsabilidades, con un API Object sobre un cliente HTTP único.** Es un solo cambio que arregla varios problemas: si todas las peticiones pasan por un mismo lugar, el token se lee una vez (1), el body se lee bien (2), el header no se olvida (3), el código no se duplica (7) y la URL no se repite (8).

Mover `userId` al World también hace falta, pero solo arregla el estado compartido (6). Y reglas sueltas como "no uses esperas fijas" corrigen una línea, sin explicar por qué el error se repitió en tres steps.

Si no conoce el patrón, le mostraría uno de sus steps antes y después, y dejaría que haga el siguiente.

### Caso 2. Triage de la nightly #142

#### 1. Clasificación

| Fallo | Categoría | Evidencia |
|---|---|---|
| F1 | Entorno / configuración | Falla en las últimas 3 y en local pasa con otro token. Pero F3 recibió 201 en la misma ejecución, y crear exige token: **el token no está caído para toda la suite**. La causa es propia de ese escenario: otra variable, o un header que se pierde |
| F2 | Intermitencia | 3 rojos de 20 (15%) y pasa al reejecutar. El timeout es el síntoma: no hubo respuesta |
| F3 | Defecto del producto, confianza media | Pasaba y falla desde hoy. Los dos emails solo difieren en mayúsculas y ambos dieron 201: la unicidad no los trata como iguales |
| F4 | Limitación conocida | Falla siempre desde que se creó. La documentación de FakeStore dice que nada se borra; el 404 esperado es incorrecto |

**Causa y síntoma:** el 401 de F1 y el timeout de F2 son síntomas. En F1, la causa está en lo que ese escenario tiene distinto de F3; en F2, hay que separar si falló la conexión o la respuesta.

**Supuesto de F3:** el test no cambió entre #141 y #142, así que la API dejó de tratar esos correos como iguales. Antes de abrir el ticket reviso si cambió el test en Git y repito con el email idéntico; si el test cambió, es defecto del test. El 24-11-2026, GoRest devolvía 422 con el email idéntico y 201 si cambiaban las mayúsculas; su documentación no promete ignorarlas.

#### 2. Primera verificación

| Fallo | Qué reviso |
|---|---|
| F1 | En el log de #142, qué variable usa el paso de F1 y cuál F3, y la fecha del secret con `gh secret list`. El header enmascarado no prueba que el valor sea correcto. Además, hoy GoRest responde `Authentication failed` **sin header** e `Invalid token` con un token malo: buscaría un header que no llega |
| F2 | Hora de los 3 rojos y duración de las peticiones; luego, 20 `curl` desde el runner con `-w '%{time_connect} %{time_total}'` para separar conexión de respuesta |
| F3 | `git log -p` del generador de datos entre los commits de #141 y #142, y repetir el POST con el email **idéntico**. Si da 422, la diferencia son las mayúsculas |
| F4 | La nota de DELETE en el README de FakeStore y un `DELETE` + `GET` a mano |

#### 3. Prioridad

| Orden | Fallo | Impacto | Frecuencia | Costo del fallo |
|---|---|---|---|---|
| 1 | F3 | Alto: cuentas duplicadas | Nuevo, desde hoy | Datos difíciles de limpiar |
| 2 | F1 | Alto: actualización sin cobertura | 3 seguidas | 3 noches a ciegas |
| 3 | F2 | Medio: ruido | 15% | Tiempo de reejecución y desconfianza |
| 4 | F4 | Bajo: no hay riesgo nuevo | 100% | Solo ruido |

F3 va primero porque puede ser un defecto real y su verificación toma minutos. F4 queda para el final: no se degrada por esperar.

#### 4. Prevención

| Fallo | Cambio |
|---|---|
| F1 | Paso previo en el pipeline que llama a GoRest con cada credencial y corta la ejecución con un mensaje claro si hay 401; una sola fuente de token para toda la suite |
| F2 | Timeout por petición menor que 30 s, reintento solo de GET ante error de red, y registro del reintento para medir flakiness. Nunca reintentar un assert |
| F3 | Dos casos separados en `Examples`: email idéntico (422) y email con otras mayúsculas (según lo que defina el negocio) |
| F4 | Corregir el esperado con la cita de la documentación. Antes de integrar un escenario, exigir la fuente del esperado y una ejecución revisada |

#### 5. Mensaje al equipo

> Nightly #142: 44 de 48 en verde. 4 fallos con 4 causas distintas.
> F3 (email duplicado): posible defecto, desde hoy. Reviso si cambió el test; si no, abro ticket hoy.
> F1 (401): configuración de ese escenario, no el token general (F3 creó usuarios). Lo reviso después de F3.
> F2 (timeout, 3 de 20): intermitencia; ajusto timeout y reintento de red. F4: expectativa incorrecta, la corrijo.
> Pedido: no reejecutar hasta confirmar F3, para conservar la evidencia.

### Caso 3. Decisión de release

#### 1. Recomendación

**Go condicionado: se libera sin pagos.** Si los 3 PRs de pagos se pueden retirar o apagar antes de las 16:00, y la regresión de pagos queda en verde sin ellos, salen los otros 11. Si no se pueden separar, o el defecto también está en la versión actual, **no se libera hoy**.

Los 3 datos que más pesaron:

1. **Cobro duplicado reproducible 3 de 3:** no es intermitencia y afecta dinero de clientes.
2. **Antecedente:** un defecto similar generó 38 tickets y 1 rollback.
3. **3 de 14 PRs tocan pagos:** hay una causa probable acotada y una salida parcial que protege el compromiso comercial.

El 40% de exploratorias pendiente debe cubrir primero lo que se libere. No elijo entre el cliente y la calidad: saco lo que está probado y dejo fuera lo que cobra dos veces.

#### 2. Experimento antes de las 17:00

Desarrollo afirma que el usuario no reintenta así. La pregunta objetiva no es quién reintenta, sino **si el servidor cobra dos veces la misma operación**.

| Hora | Prueba | Si ocurre |
|---|---|---|
| 14:00 | Desde la interfaz y sin el código del test: pagar, cortar la respuesta con un proxy tras el cobro y reintentar como lo haría una persona (botón, recargar, atrás) | Dos cobros: es un defecto y el test tiene razón |
| 14:40 | Por API: dos POST con la misma orden y la misma clave de idempotencia | Dos cobros: falta idempotencia, sin importar quién reintente |
| 15:10 | Logs de producción, 30 días: misma orden, usuario y monto en menos de 2 minutos; timeouts de pago; reintentos automáticos en app, gateway o colas | Hay casos: en producción sí se reintenta |
| 15:40 | Lo mismo sobre la versión actual y sin los 3 PRs | Indica si el defecto es nuevo y qué PR lo introduce |

La evidencia son los registros del proveedor de pagos, no la pantalla. Acoto timeout antes y después del cobro. **Regla acordada de antemano:** un solo cobro en todas las pruebas y cero casos en logs dan la razón a Desarrollo; un duplicado basta para no-go en pagos. Si a las 16:00 no hay resultado, se mantiene el no-go en pagos: la duda no puede pagarla el cliente.

#### 3. Los 9 intermitentes y los 5 leves

**Los 5 de severidad baja no bloquean.** Son formato de fechas y columnas en reportes: se registran, se informan a Producto y se corrigen después. Verificaría solo una cosa: que la fecha esté mal mostrada y no mal guardada.

**Los 9 intermitentes sí entran, pero como incertidumbre y no como defectos.** Fallar en más del 30% de las ejecuciones significa que no informan: ni su rojo prueba un error ni su verde prueba que todo está bien. Por eso no los reejecutaría hasta verlos pasar. Los separaría por módulo:

- Los que tocan pagos o lo que se libera se validan a mano hoy.
- El resto va a cuarentena con responsable y fecha, sin contar para la decisión.

Las cuentas cuadran: 2 + 5 + 9 = 16 fallos. El 94,9% en verde (296 de 312) no decide nada: 2 fallos críticos pesan más que 296 aciertos.

#### 4. Si el negocio libera de todas formas

1. **Técnica:** apagar el cambio de pagos con un feature flag, o exigir una clave de idempotencia por orden en el servidor; y desactivar los reintentos automáticos de cobro.
2. **Técnica:** liberar a un 5% de usuarios durante 2 horas, con una alerta por dos cobros de la misma orden, usuario y monto.
3. **Proceso:** riesgo aceptado por escrito por Producto, soporte avisado con un guion, reembolso preparado y una persona de guardia de Desarrollo y QA.

**Rollback:** inmediato con **1 cobro duplicado confirmado**; también si los errores de pago duplican su nivel normal durante 10 minutos. El responsable de guardia lo ejecuta sin pedir aprobación y el procedimiento se ensaya antes de las 17:00. Como el rollback no devuelve el dinero, incluye revisar y reembolsar los cobros hechos desde la liberación.

Supuesto: existe la posibilidad de activar flags o liberar por porcentaje. Si no existe, el riesgo sube y mantengo el no-go.

### Caso 4. Estrategia y ROI

#### 1. Punto de equilibrio

| Concepto | Cálculo | Resultado |
|---|---|---|
| Horas manuales que se evitan | 60% × 32 h | 19,2 h por release |
| Ahorro neto | 19,2 − 4 | 15,2 h por release |
| **Equilibrio** | 160 / 15,2 = 10,5 | **11 releases** |
| En meses | 11 × 2 semanas = 22 semanas | **5,1 meses** |
| Primer año (26 releases) | 15,2 × 26 − 160 | +235 h |

Supuestos: se cuenta desde que el 60% está listo; una hora vale lo mismo en automatizar, probar o corregir; y el 60% es de las 32 h actuales.

| Escenario | Cálculo | Equilibrio |
|---|---|---|
| Solo ahorro de regresión | 160 / 15,2 | 11 releases (5,1 meses) |
| Además evita 1 de los 4 defectos (8 h) | 160 / 23,2 = 6,9 | 7 releases (3,2 meses) |
| Construcción gradual en 6 releases, desde el día 1 | 6 + (160 − 38) / 15,2 = 14,0 | 15 releases (6,9 meses) |

Doy los dos plazos porque miden cosas distintas: 5 meses cuenta desde que el 60% está listo, y 7 meses, desde hoy. El segundo es el realista: automatizando un 10% adicional por release, durante la construcción solo se ahorran unas 38 h (48 − 10 de mantenimiento). **En 90 días no se recupera la inversión:** hay unos 6 releases y hacen falta 15. Prefiero decirlo ahora que prometer algo que no va a pasar.

Los defectos evitados van aparte porque son una hipótesis que hay que medir: hoy cuestan 4 × 8 = 32 h por release.

#### 2. Plan de 90 días

Son unos 6 releases. Cada uno tiene 160 h de QA (2 personas × 80 h) y 32 se van en regresión. Construir 160 h en 6 releases son **unas 27 h por release, el 21% de las 128 restantes**.

| Días | Automatizar | Manual |
|---|---|---|
| 1–30 | Pipeline y smoke de API de los flujos críticos; reportes | Regresión completa |
| 31–60 | Regresión de API por riesgo y por defectos escapados | Se retira lo que lleve 2 releases estable |
| 61–90 | Pocos flujos E2E de interfaz; completar el 60% | Exploratorias con el tiempo liberado |

**Primero:** lo que se repite en cada release, es estable y cuesta dinero si falla; por API, que es más rápida y menos frágil que la interfaz.

**Todavía no:** pantallas en rediseño (el mantenimiento superaría las 4 h), casos de un solo uso, reportes y aspecto visual (bajo impacto), y exploratorias (dependen del criterio de una persona).

**Reparto:** un QA dedica cerca de un tercio de su tiempo a automatizar y el otro sostiene la regresión; rotan cada release para no depender de una persona. Los 8 desarrolladores revisan los tests como código y arreglan los que rompan. Si un release se complica, se pausa la automatización, no la entrega.

#### 3. Métricas

| Métrica | Línea base | Meta a 90 días |
|---|---|---|
| Esfuerzo de regresión por release | 32 h | 17 h (12,8 manuales + 4 de mantenimiento) |
| Defectos escapados por release | ~4 (32 h de corrección) | ≤ 3, promedio de los últimos 3 releases |
| Tasa de flakiness (fallos que pasan al repetir sin cambios) | Sin medir: se fija en el primer mes | < 2% |
| Tiempo de feedback en PR | Sin smoke automático: hasta 2 días, lo que dura la regresión | < 10 minutos |

Supuesto: hoy no hay smoke en PR, porque la cobertura automatizada es ~5%. La cobertura (5% a 60%) la mostraría como avance, no como valor.

#### 4. Respuesta al líder

> Hoy cada entrega nos cuesta 32 horas de repetir las mismas pruebas, y aun así unos 4 errores llegan al cliente.
> Con 160 horas de inversión, cada entrega costaría 15 horas menos: se paga en unas 11 entregas.
> Como lo haríamos poco a poco, sin frenar el trabajo, calculo unos 7 meses; en 90 días aún no lo veremos pagado.
> Después ganamos cerca de 395 horas al año para buscar los errores que hoy se nos escapan.
> Propongo empezar por lo que más dinero cuesta si falla y revisar los números contigo cada mes.

## Extra: AI Testing

`.claude/` contiene dos skills y dos agentes de Claude Code que se usaron para construir esta suite y quedan para el futuro. **Los tests, el pipeline y k6 no dependen de esa carpeta ni llaman a servicios de IA.**

| Pieza | Qué hace |
|---|---|
| `disenar-casos` | Saca la matriz de casos desde el enunciado y el contrato |
| `escribir-tests` | Convierte la matriz aprobada en feature, steps y API Object |
| `revisor-tests` | Revisa el código contra las reglas y la matriz, solo lectura |
| `triage-fallos` | Clasifica los fallos de una ejecución, solo lectura |

Flujo: diseñar → **aprobación humana** → escribir → revisar → ejecutar → triage → **decisión humana**. Las reglas están en [reglas-qa.md](.claude/reglas-qa.md); la principal es que la IA no puede cambiar un valor esperado para que un test pase.

| Dato | Resultado |
|---|---|
| Casos diseñados con la skill | 55 (Carts, Users y Auth), aprobados por una persona |
| Hallazgos de la revisión | 16: 3 altos, 7 medios y 6 bajos. 15 corregidos |
| Errores de la IA detectados | Un filtro de fechas que no podía fallar, un mensaje de error que aceptaba `{}`, una ejecución sin escenarios en verde y logs ilegibles en el reporte |
| Prueba de `triage-fallos` | 31 fallos: 27 reales y 4 sembrados sin avisarle. Clasificó bien los 4 sembrados y los 27 reales, y descubrió que el insumo mezclaba ejecuciones ([detalle](docs/ai-testing/triage.md)) |

La revisión y el triage usaron las instrucciones de cada agente en uno sin herramientas de edición, porque la sesión había empezado antes de crearlos. Es una sola prueba de cada uno: sirve para ver que funcionan, no para medir su precisión.
