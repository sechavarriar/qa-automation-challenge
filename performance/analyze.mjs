// Agrupa los datos crudos de k6 por ventanas de tiempo: VUs, throughput, P95 y errores.
// Uso: node performance/analyze.mjs <nombre-de-la-prueba> [segundos por ventana]
import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const [name, windowArg = '10'] = process.argv.slice(2);
const windowSeconds = Number(windowArg);
const BREAKING_ERROR_RATE = 0.05;

const requests = [];
const vus = [];
const lines = createInterface({ input: createReadStream(`performance/results/raw/${name}.json`) });
for await (const line of lines) {
  const { type, metric, data } = JSON.parse(line);
  if (type !== 'Point') continue;
  const time = Date.parse(data.time);
  if (metric === 'http_req_duration') {
    requests.push({ time, duration: data.value, status: Number(data.tags.status) });
  } else if (metric === 'vus') {
    vus.push({ time, value: data.value });
  }
}
requests.sort((a, b) => a.time - b.time);
vus.sort((a, b) => a.time - b.time);

const start = Math.min(requests[0].time, vus[0]?.time ?? Infinity);
const windows = new Map();
for (const request of requests) {
  const index = Math.floor((request.time - start) / 1000 / windowSeconds);
  if (!windows.has(index)) windows.set(index, []);
  windows.get(index).push(request);
}

let total = 0;
let failed = 0;
const rows = [...windows].map(([index, items]) => {
  const errors = items.filter(isError).length;
  total += items.length;
  failed += errors;
  return {
    segundo: (index + 1) * windowSeconds,
    vus: vusAt(start + (index + 1) * windowSeconds * 1000),
    peticiones: items.length,
    porSegundo: round(items.length / windowSeconds),
    p95ms: percentile(items, 0.95),
    medianaMs: percentile(items, 0.5),
    tasaDeErrores: round(errors / items.length, 3),
    tasaAcumulada: round(failed / total, 3),
    estados: countByStatus(items),
  };
});

const result = {
  prueba: name,
  peticiones: requests.length,
  estados: countByStatus(requests),
  primerError: describe(requests.find(isError)),
  primer429: describe(requests.find(({ status }) => status === 429)),
  quiebreAcumulado: describe(firstBreakingRequest()),
  quiebrePorVentana: rows.find(({ tasaDeErrores }) => tasaDeErrores > BREAKING_ERROR_RATE) ?? null,
  p95PorEstado: Object.fromEntries(
    [...new Set(requests.map(({ status }) => status))].map((status) => [
      status,
      percentile(requests.filter((request) => request.status === status), 0.95),
    ]),
  ),
  ventanas: rows,
};

writeFileSync(`performance/results/${name}-timeline.json`, `${JSON.stringify(result, null, 2)}\n`);
console.table(rows.map(({ estados, ...row }) => ({ ...row, estados: JSON.stringify(estados) })));
console.log(JSON.stringify({ ...result, ventanas: undefined }, null, 2));

/** Primera petición a partir de la cual el error rate acumulado supera el 5%. */
function firstBreakingRequest() {
  let errors = 0;
  return requests.find((request, index) => {
    if (isError(request)) errors += 1;
    return errors / (index + 1) > BREAKING_ERROR_RATE;
  });
}

function describe(request) {
  if (!request) return null;
  return {
    segundo: round((request.time - start) / 1000),
    vus: vusAt(request.time),
    estado: request.status,
    peticionesUltimoMinuto: requests.filter(
      ({ time }) => time > request.time - 60_000 && time <= request.time,
    ).length,
  };
}

function vusAt(time) {
  let value = 0;
  for (const point of vus) {
    if (point.time > time) break;
    value = point.value;
  }
  return value;
}

function isError({ status }) {
  return status === 0 || status >= 400;
}

function percentile(items, ratio) {
  const sorted = items.map(({ duration }) => duration).sort((a, b) => a - b);
  return Math.round(sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)]);
}

function countByStatus(items) {
  return items.reduce((counts, { status }) => ({ ...counts, [status]: (counts[status] ?? 0) + 1 }), {});
}

function round(value, decimals = 1) {
  return Number(value.toFixed(decimals));
}
