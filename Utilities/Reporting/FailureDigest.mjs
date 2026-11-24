// Resumen legible de los fallos: en el JSON de Cucumber los adjuntos van en base64.
const MAX_LINE_LENGTH = 160;
const MAX_EXCHANGE_LENGTH = 6000;

/** `features` es el contenido del JSON de Cucumber. Los adjuntos ya vienen enmascarados. */
export function buildFailureDigest(features) {
  const scenarios = features.flatMap((feature) =>
    feature.elements.map((element) => ({ ...element, uri: feature.uri })),
  );
  const failed = scenarios.filter(hasFailed);
  const lines = [
    '# Fallos de la ejecución',
    '',
    `Escenarios: ${scenarios.length} | pasaron: ${scenarios.filter(hasPassed).length} | fallaron: ${failed.length}`,
  ];
  return [...lines, ...failed.flatMap(describeScenario), ''].join('\n');
}

function describeScenario({ name, tags, steps, uri, line }) {
  const failedStep = steps.find(({ result }) => result.status === 'failed');
  const skipped = steps.filter(({ result }) => result.status === 'skipped').length;
  const exchanges = steps.flatMap(({ embeddings = [] }) => embeddings.map(decode));
  return [
    '',
    `## ${name}`,
    '',
    `- Ubicación: ${uri.replaceAll('\\', '/')}:${line}`,
    `- Tags: ${tags.map((tag) => tag.name).join(' ')}`,
    `- Step fallido: ${failedStep.keyword.trim()} ${failedStep.name}`,
    `- Error: ${failedStep.result.error_message.split('\n')[0]}`,
    `- Steps no ejecutados después del fallo: ${skipped}`,
    ...exchanges.flatMap((exchange) => ['', '```', exchange, '```']),
  ];
}

function decode({ data, mime_type: mimeType }) {
  const content = mimeType === 'text/plain' ? Buffer.from(data, 'base64').toString('utf8') : data;
  // Se acortan las líneas largas (cabeceras de seguridad) para no perder el body.
  const text = content
    .split('\n')
    .map((line) => (line.length > MAX_LINE_LENGTH ? `${line.slice(0, MAX_LINE_LENGTH)}…` : line))
    .join('\n');
  if (text.length <= MAX_EXCHANGE_LENGTH) return text;
  return `${text.slice(0, MAX_EXCHANGE_LENGTH)}\n(recortado: el texto completo está en el reporte HTML)`;
}

function hasFailed({ steps }) {
  return steps.some(({ result }) => result.status === 'failed');
}

function hasPassed({ steps }) {
  return steps.every(({ result }) => result.status === 'passed');
}
