import http from 'k6/http';
import exec from 'k6/execution';

export const FAKESTORE_BASE_URL = __ENV.FAKESTORE_BASE_URL || 'https://fakestoreapi.com';
export const GOREST_BASE_URL = __ENV.GOREST_BASE_URL || 'https://gorest.co.in';
const OUTPUT_FOLDER = 'performance/output';

export function requiredEnv(name) {
  const value = __ENV[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

/** Corta la prueba si el destino no responde 200: cargar contra un bloqueo no mide nada. */
export function abortIfUnreachable(url) {
  const { status } = http.get(url);
  if (status !== 200) {
    exec.test.abort(`La prueba no se ejecutó: ${url} respondió ${status} en la verificación previa.`);
  }
}

/** Nombre de la fase según el tiempo transcurrido. `phases`: [{ name, until }], en segundos. */
export function currentPhase(phases) {
  const elapsedSeconds = exec.instance.currentTestRunDuration / 1000;
  const phase = phases.find(({ until }) => elapsedSeconds < until);
  return (phase || phases[phases.length - 1]).name;
}

export function uniqueUser() {
  const id = `${Date.now()}.${exec.vu.idInTest}.${exec.vu.iterationInInstance}`;
  return {
    name: `Performance QA ${exec.vu.idInTest}`,
    email: `perf.${id}@example.com`,
    gender: exec.vu.idInTest % 2 === 0 ? 'female' : 'male',
    status: 'active',
  };
}

/** Las colecciones cortas bastan; `null` indica que el body no es JSON. */
export function parseJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

/** Guarda el resumen completo en `performance/output` y una versión corta en consola. */
export function buildSummary(testName) {
  return (data) => ({
    [`${OUTPUT_FOLDER}/${testName}-summary.json`]: JSON.stringify(
      { metrics: data.metrics, state: data.state },
      null,
      2,
    ),
    stdout: shortSummary(testName, data),
  });
}

function shortSummary(testName, { metrics }) {
  const lines = [`\n== ${testName} ==`];
  for (const name of Object.keys(metrics).sort()) {
    const { values, thresholds } = metrics[name];
    for (const [rule, { ok }] of Object.entries(thresholds || {})) {
      lines.push(`${ok ? 'CUMPLE   ' : 'NO CUMPLE'} ${name}: ${rule} | ${describe(values)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function describe(values) {
  if (values['p(95)'] !== undefined) return `p95=${values['p(95)'].toFixed(0)} ms`;
  if (values.count !== undefined) return `${values.rate.toFixed(1)}/s (${values.count})`;
  return `${(values.rate * 100).toFixed(2)}%`;
}
