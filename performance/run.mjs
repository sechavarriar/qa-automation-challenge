// Ejecuta una prueba de k6, o todas, y conserva su código de salida.
// El token llega a k6 por variable de entorno: no aparece en la línea de comandos.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: [`.env.${process.env.TEST_ENV?.trim() || 'qa'}`, '.env'], quiet: true });

const TESTS = {
  load: 'load-test-products',
  stress: 'stress-test-users',
  spike: 'spike-test-products',
};
const RESULTS = 'performance/results';

const [type, ...extraArgs] = process.argv.slice(2);
const selected = type === 'all' ? Object.values(TESTS) : [TESTS[type]];
if (selected.includes(undefined)) {
  console.error(`Uso: node performance/run.mjs <${[...Object.keys(TESTS), 'all'].join('|')}>`);
  process.exit(1);
}

mkdirSync(`${RESULTS}/raw`, { recursive: true });

// Con "all" se ejecutan todas aunque una falle; el resultado final es el de la peor.
const exitCodes = selected.map((name) => {
  const { status, error } = spawnSync(
    process.env.K6_BIN || 'k6',
    ['run', `performance/tests/${name}.js`, '--out', `json=${RESULTS}/raw/${name}.json`, ...extraArgs],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        K6_WEB_DASHBOARD: 'true',
        K6_WEB_DASHBOARD_PORT: '-1',
        K6_WEB_DASHBOARD_EXPORT: `${RESULTS}/${name}-dashboard.html`,
        K6_NO_USAGE_REPORT: 'true',
      },
    },
  );
  if (error) console.error(`No se pudo ejecutar k6: ${error.message}`);
  return status ?? 1;
});

process.exit(Math.max(...exitCodes));
