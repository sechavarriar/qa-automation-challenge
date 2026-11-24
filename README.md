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

El reporte queda en `reports/html/index.html`, con el request y el response de cada petición y los datos sensibles enmascarados. Se genera aunque haya fallos.

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
| Sin probar | `triage-fallos` |

La revisión usó las instrucciones del agente `revisor-tests` en un agente sin herramientas de edición, porque la sesión había empezado antes de crearlo.
