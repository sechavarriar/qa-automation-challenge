/**
 * Throughput mínimo esperado: VUs promedio / (latencia + think time).
 * Se usa la latencia máxima aceptada, así que es el piso que se cumple si se respeta el P95.
 */
export function minimumThroughput({ averageVus, maxLatencySeconds, thinkTimeSeconds }) {
  return Math.floor(averageVus / (maxLatencySeconds + thinkTimeSeconds));
}

// Carga: 1→50 VUs en 30 s, 50 VUs por 60 s y 50→0 en 30 s.
// VUs promedio = (25,5 × 30 + 50 × 60 + 25 × 30) / 120 ≈ 37,6
export const LOAD_THINK_TIME_SECONDS = 1;
const LOAD_AVERAGE_VUS = (25.5 * 30 + 50 * 60 + 25 * 30) / 120;

export const loadThresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
  http_reqs: [
    `rate>${minimumThroughput({
      averageVus: LOAD_AVERAGE_VUS,
      maxLatencySeconds: 0.5,
      thinkTimeSeconds: LOAD_THINK_TIME_SECONDS,
    })}`,
  ],
};

// Estrés: el 5% es el punto de quiebre que define el enunciado.
// Si el servidor empieza a fallar por su cuenta (5xx o sin respuesta), se detiene la prueba.
export const STRESS_THINK_TIME_SECONDS = 20;

export const stressThresholds = {
  http_req_failed: ['rate<0.05'],
  server_errors: [{ threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '10s' }],
  'http_req_duration{fase:1}': ['p(95)<1000'],
  'http_req_duration{fase:2}': ['p(95)<1000'],
  'http_req_duration{fase:3}': ['p(95)<1000'],
  'http_req_failed{fase:1}': ['rate<0.05'],
  'http_req_failed{fase:2}': ['rate<0.05'],
  'http_req_failed{fase:3}': ['rate<0.05'],
};

// Spike: el enunciado no fija umbrales; estos son criterio propio.
export const SPIKE_THINK_TIME_SECONDS = 1;

export const spikeThresholds = {
  http_req_failed: ['rate<0.01'],
  'http_req_duration{fase:base}': ['p(95)<500'],
  'http_req_duration{fase:spike}': ['p(95)<1000'],
  'http_req_duration{fase:recuperacion}': ['p(95)<500'],
};
