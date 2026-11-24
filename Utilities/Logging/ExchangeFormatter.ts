import type { HttpExchange } from '../Http/HttpTypes';

const MASK = '******';
const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie']);
const SENSITIVE_FIELDS = new Set(['password', 'token', 'access_token']);

/** Texto completo del intercambio, con los datos sensibles enmascarados. */
export function formatExchange(exchange: HttpExchange): string {
  const { request, response, error } = exchange;
  const lines = [
    `>>> ${request.method} ${request.url} (intento ${exchange.attempt})`,
    ...formatHeaders(request.headers),
    formatBody(request.body),
    '',
  ];

  if (response) {
    lines.push(
      `<<< ${response.status} (${exchange.durationMs} ms)`,
      ...formatHeaders(response.headers),
      formatBody(response.body),
    );
  } else {
    lines.push(`<<< Sin respuesta (${exchange.durationMs} ms): ${error}`);
  }
  return lines.join('\n');
}

function formatHeaders(headers: Record<string, string>): string[] {
  return Object.entries(headers).map(([name, value]) => {
    if (!SENSITIVE_HEADERS.has(name.toLowerCase())) return `${name}: ${value}`;
    return `${name}: ${value.startsWith('Bearer ') ? `Bearer ${MASK}` : MASK}`;
  });
}

function formatBody(body: string | undefined): string {
  if (!body) return '(sin body)';
  try {
    return JSON.stringify(JSON.parse(body), maskField, 2);
  } catch {
    return maskMalformedJson(body);
  }
}

function maskField(key: string, value: unknown): unknown {
  return SENSITIVE_FIELDS.has(key.toLowerCase()) ? MASK : value;
}

function maskMalformedJson(body: string): string {
  return body.replace(/("(?:password|token|access_token)"\s*:\s*)"[^"]*"?/gi, `$1"${MASK}"`);
}
