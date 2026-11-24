// Ejecuta Cucumber y genera siempre el reporte HTML, conservando el código de salida de las pruebas.
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import * as reporter from 'multiple-cucumber-html-reporter';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const JSON_FOLDER = 'reports/json';
const HTML_FOLDER = 'reports/html';

rmSync('reports', { recursive: true, force: true });

const require = createRequire(import.meta.url);
const cucumberPackage = require.resolve('@cucumber/cucumber/package.json');
const cucumberBin = join(dirname(cucumberPackage), 'bin', 'cucumber.js');

const run = spawnSync(process.execPath, [cucumberBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
const exitCode = run.status ?? 1;

if (existsSync(`${JSON_FOLDER}/cucumber.json`)) {
  const generate = reporter.generate ?? reporter.default.generate;
  await generate({
    jsonDir: JSON_FOLDER,
    reportPath: HTML_FOLDER,
    reportName: 'QA Automation Challenge',
    pageTitle: 'Reporte de pruebas de API',
    displayDuration: true,
    hideMetadata: true,
    customData: {
      title: 'Ejecución',
      data: [
        { label: 'Ambiente', value: process.env.TEST_ENV || 'qa' },
        { label: 'Argumentos', value: process.argv.slice(2).join(' ') || '(suite completa)' },
        { label: 'Commit', value: process.env.GITHUB_SHA ?? 'local' },
        { label: 'Build', value: process.env.GITHUB_RUN_NUMBER ?? 'local' },
        { label: 'Fecha', value: new Date().toISOString() },
      ],
    },
  });
  console.log(`Reporte HTML: ${HTML_FOLDER}/index.html`);
} else {
  console.error('Cucumber no generó resultados; no hay reporte.');
}

process.exit(exitCode);
