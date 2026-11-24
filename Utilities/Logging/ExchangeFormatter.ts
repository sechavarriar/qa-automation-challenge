import type { HttpExchange } from '../Http/HttpTypes';
import { maskHeader, maskText, maskUrl } from './Masking';

/** Texto completo del intercambio, con los datos sensibles enmascarados. */
export function formatExchange(exchange: HttpExchange): string {
  const { request, response, error } = exchange;
  const lines = [
    `>>> ${request.method} ${maskUrl(request.url)} (intento ${exchange.attempt})`,
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
  return Object.entries(headers).map(([name, value]) => `${name}: ${maskHeader(name, value)}`);
}

function formatBody(body: string | undefined): string {
  return body ? maskText(body, 2) : '(sin body)';
}
