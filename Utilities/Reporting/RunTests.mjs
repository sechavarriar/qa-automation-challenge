// Ejecuta Cucumber y genera siempre el reporte HTML, conservando el código de salida de las pruebas.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import * as reporter from 'multiple-cucumber-html-reporter';
import dotenv from 'dotenv';

const environment = process.env.TEST_ENV?.trim() || 'qa';
dotenv.config({ path: [`.env.${environment}`, '.env'], quiet: true });

const JSON_FOLDER = 'reports/json';
const HTML_FOLDER = 'reports/html';
const JSON_FILE = `${JSON_FOLDER}/cucumber.json`;

rmSync('reports', { recursive: true, force: true });

const require = createRequire(import.meta.url);
const cucumberPackage = require.resolve('@cucumber/cucumber/package.json');
const cucumberBin = join(dirname(cucumberPackage), 'bin', 'cucumber.js');

const run = spawnSync(process.execPath, [cucumberBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
const scenarios = countScenarios();
// Un tag mal escrito no debe dar una ejecución en verde sin haber probado nada.
const exitCode = scenarios === 0 ? 1 : (run.status ?? 1);

if (scenarios > 0) {
  const generate = reporter.generate ?? reporter.default.generate;
  await generate({
    jsonDir: JSON_FOLDER,
    reportPath: HTML_FOLDER,
    reportName: 'QA Automation Challenge',
    pageTitle: 'Reporte de pruebas de API',
    displayDuration: true,
    hideMetadata: true,
    customData: {
      ambiente: environment,
      fakestore: process.env.FAKESTORE_BASE_URL ?? '(sin definir)',
      gorest: process.env.GOREST_BASE_URL ?? '(sin definir)',
      argumentos: process.argv.slice(2).join(' ') || '(suite completa)',
      commit: process.env.GITHUB_SHA?.slice(0, 7) ?? 'local',
      build: process.env.GITHUB_RUN_NUMBER ?? 'local',
    },
  });
  console.log(`Reporte HTML: ${HTML_FOLDER}/index.html`);
} else {
  console.error('No se ejecutó ningún escenario: revisa los tags y la salida de Cucumber.');
}

process.exit(exitCode);

function countScenarios() {
  if (!existsSync(JSON_FILE)) return 0;
  const content = readFileSync(JSON_FILE, 'utf8').trim();
  if (content === '') return 0;
  return JSON.parse(content).reduce((total, feature) => total + feature.elements.length, 0);
}
